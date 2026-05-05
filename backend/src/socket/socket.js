const { Server } = require("socket.io");
const dotenv = require("dotenv");
const winston = require("winston");
const driverService = require("../services/driver.service");
const { VerifyTokenThroughSocket } = require("../middleware/auth.middleware");
const { UpdateOrderStatusWithDriver, updateRideStatusByOrderId } = require("../services/order.service");
const PricingService = require("../services/pricing.service");
const { calculateDistance } = require("../utils/locationUtils");
const logger = require("../utils/logger");

// Store active ride requests and their timers
const activeRideRequests = new Map();
const rideRequestTimers = new Map();

const cleanupRideRequestByOrderId = (orderId) => {
  for (const [requestId, request] of activeRideRequests.entries()) {
    if (request.orderId === orderId) {
      // Clear the expiry timer if it exists
      if (rideRequestTimers.has(requestId)) {
        clearTimeout(rideRequestTimers.get(requestId));
        rideRequestTimers.delete(requestId);
      }
      
      // Remove from active requests
      activeRideRequests.delete(requestId);
      logger.debug(`Cleaned up active ride request`, { requestId, orderId });
      return true;
    }
  }
  return false;
};
dotenv.config();

// Centralized logger imported above

const initializeSocket = (server) => {
  try {
    logger.info("Initializing Socket.io...");
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
        path: process.env.SOCKET_PATH || "/socket.io",
        transports: ["websocket", "polling"],
        pingTimeout: 60000,
        pingInterval: 25000,
      },
    });

    io.on("connection", async (socket) => {
      logger.debug("New client connected", { socketId: socket.id });

      // Authenticate socket connection
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          logger.warn("Socket authentication failed: No token provided", { socketId: socket.id });
          socket.emit("auth_error", { message: "No token provided" });
          socket.disconnect();
          return;
        }

        // Verify token and wait for result
        const response = await VerifyTokenThroughSocket(token);

        if (!response.success) {
          logger.warn("Socket authentication failed", { socketId: socket.id, message: response.message });
          socket.emit("auth_error", {
            message: response.message || "Token validation failed",
          });
          socket.disconnect();
          return;
        }

        const decoded = response.data;
        logger.debug("Socket authenticated for user", { user: logger.sanitize(decoded) });

        // Set user ID - note that decoded already contains userId, not nested in user object
        socket.userId = decoded.userId;

        // Join user to their own room for targeted messages
        socket.join(`user_${socket.userId}`);

        // Send success authentication message
        socket.emit("authenticated", {
          message: "Successfully authenticated",
          userId: socket.userId,
        });
      } catch (error) {
        console.error("Socket authentication error:", error);
        logger.error("Socket authentication error:", {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });

        socket.emit("auth_error", { message: "Invalid token" });
        socket.disconnect();
        return;
      }

      // Helper function for continuous matching
      const checkAndNotifyDriver = (driver, ioObj) => {
        if (!driver || driver.workingStatus !== "ONLINE" || !driver.currentLocation || driver.currentLocation.latitude === 0) return;

        for (const [requestId, request] of activeRideRequests.entries()) {
          if (request.status !== "PENDING") continue;
          if (request.notifiedDrivers && request.notifiedDrivers.has(driver.userId)) continue;

          // Check vehicle constraints (with normalizer for consumer vs KYC naming)
          const { normalizeVehicleAttributes } = require("../utils/vehicleNormalizer");
          const kycVeh = driver.kycDetailsId?.vehicle;
          if (!kycVeh) continue;

          const normalizedReq = normalizeVehicleAttributes({
            vehicleType: request.vehicleType,
            vehicleBodyType: request.vehicleBodyType,
            vehicleFuelType: request.vehicleFuelType
          });

          const normalizedKyc = normalizeVehicleAttributes({
            vehicleType: kycVeh.vehicleType,
            vehicleBodyType: kycVeh.vehicleBodyType,
            vehicleFuelType: kycVeh.vehicleFuelType
          });

          if (normalizedReq.vehicleType && normalizedKyc.vehicleType !== normalizedReq.vehicleType) continue;
          if (normalizedReq.vehicleBodyType && normalizedKyc.vehicleBodyType !== normalizedReq.vehicleBodyType) continue;
          // if (normalizedReq.vehicleFuelType && normalizedKyc.vehicleFuelType !== normalizedReq.vehicleFuelType) continue;

          // Check distance
          const distance = calculateDistance(
            request.pickupLocation.latitude,
            request.pickupLocation.longitude,
            driver.currentLocation.latitude,
            driver.currentLocation.longitude
          );

          if (distance <= request.radiusInKm) {
            // Match found! Push to this driver
            request.notifiedDrivers.add(driver.userId);
            ioObj.to(`user_${driver.userId}`).emit("ride_request_received", {
              requestId: requestId,
              rideData: {
                // Ensure all crucial fields from request are extracted properly if nested differently, 
                // but usually activeRideRequests has the flat spread of rideRequestData already.
                ...request,
              },
              consumerData: request.consumerData,
              distance: parseFloat(distance.toFixed(2)),
              orderId: request.orderId || null,
            });
            console.log(`Pushed active request ${requestId} to newly online/nearby driver ${driver.userId}`);
          }
        }
      };

      //handle send-location change of driver
      socket.on("send-location", async (data) => {
        console.log("location received from driver", data);
        try {
          const result = await driverService.UpdateCurrentLocation(data);
          if (!result.success) {
            console.log(
              "error while updating the driver location:",
              result.message
            );
            socket.emit("location_update_error", { message: result.message });
            return;
          }

          socket.emit("location_update_success", {
            message: result.message,
            data: result.data,
          });

          // Continuous matching: Check if this new location puts the driver within range of any active requests
          if (result.data) {
            checkAndNotifyDriver(result.data, io);
            
            // Broadcast live location to Admin Tracking Dashboard
            try {
              const User = require("../models/user.model");
              const user = await User.findOne({ userId: result.data.userId }).select("profile phone");
              const fullName = user?.profile ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() : "Driver";

              io.to("admin_tracking_room").emit("admin-driver-location-update", {
                driverId: socket.userId || (data.driverId || "unknown"),
                name: fullName || "Driver",
                mobile: user?.phone || "N/A",
                vehicleType: result.data.kycDetailsId?.vehicle?.vehicleType || "Vehicle",
                location: {
                  latitude: data.latitude,
                  longitude: data.longitude
                },
                status: result.data.workingStatus || "ONLINE"
              });
            } catch (err) {
              console.log("Error finding user for admin tracking broadcast", err);
            }
          }
        } catch (error) {
          console.log("error while getting send-location from driver:", error);
        }
      });

      // Handle status update to ONLINE
      socket.on("update_working_status", async (data) => {
        // I will assume there's a status update event, but actually the socket API doesn't have it natively here.
        // The partner app calls an HTTP route for status update `UpdateKycStatus` or similar? 
        // Let's rely on send-location since driver app sends location frequently when ONLINE.
      });

      // Handle Admin joining tracking room
      socket.on("join-admin-tracking", () => {
        socket.join("admin_tracking_room");
        console.log(`Admin joined tracking room: ${socket.id}`);
      });

      //handle request from consumer to get near by drivers
      socket.on("get-nearby-drivers", async (data) => {
        console.log("get-nearby-drivers request received:", data);
        try {
          const result = await driverService.GetNearbyDrivers(data);
          if (!result.success) {
            console.log("error while getting nearby drivers:", result.message);
            socket.emit("get_nearby_drivers_error", {
              message: result.message,
            });
            return;
          }
          socket.emit("get_nearby_drivers_success", {
            message: result.message,
            data: result.data,
          });
        } catch (error) {
          console.log("error while getting nearby drivers:", error);
        }
      });

      // Handle ride request from consumer
      socket.on("send-ride-request", async (data) => {
        try {
          const result = await driverService.SendRideRequestToDrivers({
            ...data,
            consumerUserId: socket.userId,
          });

          if (!result.success) {
            console.log("Error while sending ride request:", result.message);
            socket.emit("ride_request_error", { message: result.message });
            return;
          }

          // Store the ride request
          const rideRequestId = result.data.rideRequestData.requestId;
          // Extract orderId from multiple sources: result.data.orderId, data.orderId
          let orderId = result.data.orderId || data.orderId || null;

          // If orderId is still missing, try to fetch from recent orders or create one
          if (!orderId && socket.userId) {
            try {
              const Order = require("../models/order.model");
              const { generateOrderId } = require("../utils/generateRandom");

              // Find the most recent pending/in-progress order for this user
              const recentOrder = await Order.findOne({
                userId: socket.userId,
                status: { $in: ["PENDING", "IN_PROGRESS", "CONFIRMED", "CREATED", "QUOTE_GENERATED", "MATCHING"] }
              })
                .sort({ createdAt: -1 })
                .select("orderId")
                .limit(1);

              if (recentOrder && recentOrder.orderId) {
                orderId = recentOrder.orderId;
              } else {
                // Generate a temporary orderId - this will be linked to the actual order when it's created
                orderId = generateOrderId();
              }
            } catch (orderError) {
              console.error("Error fetching orderId from database:", orderError);
              // Fallback: generate a temporary orderId
              try {
                const { generateOrderId } = require("../utils/generateRandom");
                orderId = generateOrderId();
              } catch (genError) {
                console.error("Failed to generate fallback orderId:", genError);
              }
            }
          }

          if (!orderId) {
            console.error("No orderId found in ride request");
          }

          // Normalize payment data
          let paymentData = data.payment || result.data.rideRequestData.payment || { 
            method: 'CASH', 
            cashCollectionAt: data.cashCollectionAt || 'DROP' 
          };
          
          if (paymentData && paymentData.method && paymentData.method.toLowerCase().includes('cash')) {
            paymentData.method = 'CASH';
          }

          activeRideRequests.set(rideRequestId, {
            ...result.data.rideRequestData,
            consumerData: result.data.consumerData,
            consumerSocketId: socket.id,
            consumerUserId: socket.userId,
            status: "PENDING",
            orderId: orderId,
            payment: paymentData,
            vehicleType: data.rideType,
            vehicleBodyType: data.vehicleBodyType,
            vehicleFuelType: data.vehicleFuelType,
            pickupLocation: data.pickupLocation,
            radiusInKm: data.radiusInKm || data.radius || 5,
            notifiedDrivers: new Set()
          });

          // Send ride request to all nearby drivers (strict vehicle matching via normalizer)
          const nearbyDriversResult = await driverService.GetNearbyDrivers({
            lat: data.pickupLocation.latitude,
            long: data.pickupLocation.longitude,
            radiusInKm: data.radiusInKm || data.radius || 5,
            vehicleType: data.rideType,
            vehicleBodyType: data.vehicleBodyType,
            vehicleFuelType: data.vehicleFuelType,
          });

          if (nearbyDriversResult.success) {
            nearbyDriversResult.data.drivers.forEach((driver) => {
              activeRideRequests.get(rideRequestId).notifiedDrivers.add(driver.userId);
              io.to(`user_${driver.userId}`).emit("ride_request_received", {
                requestId: rideRequestId,
                rideData: result.data.rideRequestData,
                consumerData: result.data.consumerData,
                distance: driver.distance,
                orderId: orderId || null,
              });
            });
            console.log(`✅ Emitted ride_request_received to ${nearbyDriversResult.data.drivers.length} drivers via Socket`);

            // Send FCM Notification as backup/background alert
            // Pass orderId separately since rideRequestData doesn't contain it
            const rideDataWithOrderId = {
              ...result.data.rideRequestData,
              orderId: orderId, // Add orderId to rideData for notification
            };
            driverService.SendRideRequestNotification(
              nearbyDriversResult.data.drivers,
              rideDataWithOrderId
            );
          }

          // Set auto-expiry timer (2 minutes)
          const timer = setTimeout(() => {
            if (activeRideRequests.has(rideRequestId)) {
              const request = activeRideRequests.get(rideRequestId);
              if (request.status === "PENDING") {
                activeRideRequests.delete(rideRequestId);
                rideRequestTimers.delete(rideRequestId);

                // Notify consumer about request timeout
                io.to(request.consumerSocketId).emit("ride_request_timeout", {
                  requestId: rideRequestId,
                  message: "No drivers accepted your ride request",
                });

                // Notify all drivers that the request has expired
                io.emit("ride_request_expired", { requestId: rideRequestId });
              }
            }
          }, 10 * 60 * 1000); // 10 minutes

          rideRequestTimers.set(rideRequestId, timer);

          socket.emit("ride_request_sent", {
            message: result.message,
            requestId: rideRequestId,
            data: result.data,
          });
        } catch (error) {
          console.log("Error while processing ride request:", error);
          socket.emit("ride_request_error", {
            message: "Error while processing ride request",
          });
        }
      });

      // Handle ride acceptance from driver
      socket.on("accept-ride-request", async (data) => {
        try {
          const { requestId, orderId: orderIdFromPayload } = data;

          if (!activeRideRequests.has(requestId)) {
            socket.emit("ride_accept_error", {
              message: "Ride request not found or already processed",
            });
            return;
          }

          // Check if driver is suspended
          const Driver = require("../models/driver.model");
          const driver = await Driver.findOne({ userId: socket.userId });
          if (!driver || driver.approvalStatus === 'SUSPENDED' || !driver.isActive) {
            socket.emit("ride_accept_error", {
              message: "Your account is suspended. You cannot accept rides.",
            });
            socket.disconnect(); // Disconnect them for safety
            return;
          }

          const rideRequest = activeRideRequests.get(requestId);

          if (rideRequest.status !== "PENDING") {
            socket.emit("ride_accept_error", {
              message: "Ride request is no longer available",
            });
            return;
          }

          // Extract orderId - use from payload first, then from stored rideRequest
          const orderId = orderIdFromPayload || rideRequest.orderId;

          if (!orderId) {
            console.error("No orderId found in accept payload or rideRequest");
            socket.emit("ride_accept_error", {
              message: "Order ID is missing. Cannot process ride acceptance.",
            });
            return;
          }

          // Update ride request status
          rideRequest.status = "ACCEPTED";
          rideRequest.acceptedBy = socket.userId;
          rideRequest.acceptedAt = new Date().toISOString();
          // Ensure orderId is in rideRequest
          rideRequest.orderId = orderId;
          activeRideRequests.set(requestId, rideRequest);

          // Generate 4-digit OTP
          const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();

          //send update to database about acceptance
          await UpdateOrderStatusWithDriver({
            orderId,
            status: "DRIVER_ACCEPTED",
            driverId: socket.userId,
          });

          // Update OTP in order
          await updateRideStatusByOrderId({
            orderId,
            updateData: { "tracking.rideOtp": rideOtp }
          });

          // Update driver status to BUSY
          await driverService.UpdateDriverWorkingStatus({
            userId: socket.userId,
            status: "BUSY"
          });

          // Clear the expiry timer
          if (rideRequestTimers.has(requestId)) {
            clearTimeout(rideRequestTimers.get(requestId));
            rideRequestTimers.delete(requestId);
          }

          // Get driver details
          const driverDetails = await driverService.GetDriverDetails({
            userId: socket.userId,
          });
          console.log("driver details on ride accept:", driverDetails);

          // Notify consumer about ride acceptance
          io.to(rideRequest.consumerSocketId).emit("ride_request_accepted", {
            requestId,
            message: "Your ride has been accepted!",
            driverData: driverDetails.success ? driverDetails.data : null,
            rideData: { ...rideRequest, rideOtp }, // Send OTP to consumer
          });

          // Notify the accepting driver
          const finalOrderId = rideRequest.orderId || orderId;
          if (!finalOrderId) {
            console.error("No orderId found in rideRequest or payload");
          }

          socket.emit("ride_accept_success", {
            requestId,
            message: "Ride request accepted successfully",
            rideData: rideRequest,
            orderId: finalOrderId,
            consumerData: rideRequest.consumerData || null,
            distance: rideRequest.distance || 0,
          });

          // Notify other drivers that the request is no longer available
          socket.broadcast.emit("ride_request_unavailable", {
            requestId,
            message: "This ride request has been accepted by another driver",
          });

          // Remove from active requests after notifying (keep for a short time for reference)
          setTimeout(() => {
            activeRideRequests.delete(requestId);
          }, 5000);
        } catch (error) {

          console.log("Error while processing ride acceptance:", error);
          socket.emit("ride_accept_error", {
            message: "Error while processing ride acceptance",
          });
        }
      });

      // Handle driver arrived
      socket.on("driver-arrived", async (data) => {
        console.log("Driver arrived:", data);
        try {
          const { orderId } = data;
          if (!orderId) {
            socket.emit("driver_arrived_error", { message: "Order ID is required" });
            return;
          }

          // Update order status and set arrived time
          const updateResult = await updateRideStatusByOrderId({
            orderId,
            status: "DRIVER_ARRIVED",
            updateData: {
              "timeline.driverArrivedAt": new Date(),
              "waitingInfo.startTime": new Date()
            }
          });

          if (!updateResult.success) {
            socket.emit("driver_arrived_error", { message: updateResult.message });
            return;
          }

          // Notify consumer
          const order = updateResult.data;
          io.to(`user_${order.userId}`).emit("driver_arrived", {
            orderId,
            message: "Driver has arrived at pickup location",
            arrivedAt: order.timeline.driverArrivedAt
          });

          socket.emit("driver_arrived_success", {
            orderId,
            message: "Arrival status updated",
            data: order
          });

        } catch (error) {
          console.error("Error in driver-arrived:", error);
          socket.emit("driver_arrived_error", { message: "Internal server error" });
        }
      });

      // Handle OTP verification to start ride
      socket.on("verify-ride-otp", async (data) => {
        console.log("Verify ride OTP:", data);
        try {
          const { orderId, otp } = data;
          if (!orderId || !otp) {
            socket.emit("verify_otp_error", { message: "Order ID and OTP are required" });
            return;
          }

          // Get order to check OTP
          const OrderModel = require("../models/order.model");
          const order = await OrderModel.findOne({ orderId });

          if (!order) {
            socket.emit("verify_otp_error", { message: "Order not found" });
            return;
          }

          if (order.tracking.rideOtp !== otp) {
            socket.emit("verify_otp_error", { message: "Invalid OTP" });
            return;
          }

          // OTP Valid: Start Ride
          const startTime = order.waitingInfo?.startTime ? new Date(order.waitingInfo.startTime) : new Date();
          const endTime = new Date();
          const duration = Math.max(0, Math.round((endTime - startTime) / 60000)); // minutes

          const updateResult = await updateRideStatusByOrderId({
            orderId,
            status: "IN_TRANSIT", // or ON_RIDE, assumed IN_TRANSIT based on schema
            updateData: {
              "timeline.pickedUpAt": endTime,
              "waitingInfo.endTime": endTime,
              "waitingInfo.duration": duration
            }
          });

          if (!updateResult.success) {
            socket.emit("verify_otp_error", { message: updateResult.message });
            return;
          }

          // Notify consumer
          io.to(`user_${order.userId}`).emit("ride_started", {
            orderId,
            message: "Ride started successfully",
            data: updateResult.data
          });

          socket.emit("verify_otp_success", {
            orderId,
            message: "OTP Verified. Ride Started.",
            data: updateResult.data
          });

        } catch (error) {
          console.error("Error in verify-ride-otp:", error);
          socket.emit("verify_otp_error", { message: "Internal server error" });
        }
      });

      // Handle ride completion from driver
      socket.on("complete-ride", async (data) => {
        console.log("Ride completion received from driver:", data);
        try {
          const { orderId, driverId, amount } = data; // payload from frontend



          // Calculate final fare including waiting charges
          const OrderModel = require("../models/order.model");
          const order = await OrderModel.findOne({ orderId });

          let finalAmount = amount;
          let fareDetails = null;

          if (order) {
            // Calculate actual duration if not already set (safety check)
            let waitTime = order.waitingInfo?.duration || 0;
            if (waitTime === 0 && order.waitingInfo?.startTime && order.waitingInfo?.endTime) {
               const start = new Date(order.waitingInfo.startTime);
               const end = new Date(order.waitingInfo.endTime);
               waitTime = Math.max(0, Math.round((end - start) / 60000));
            }

            const pricingPayload = {
              distance: order.distance || 5, 
              weight: order.packageDetails?.weight || '1kg', 
              vehicleType: order.vehicleDetails?.vehicleType,
              vehicleId: order.vehicleDetails?.vehicleId,
              waitTimeMinutes: waitTime,
              isCOD: order.payment?.method === "CASH" || order.payment?.method === "COD"
            };

            // Recalculate if we have vehicle info (even if specific ID is missing, service handles fallback)
            if (pricingPayload.vehicleType) {
              console.log("[Socket] Attempting fare recalculation with payload:", pricingPayload);
              const pricingResult = await PricingService.CalculateFare(pricingPayload);
              if (pricingResult.success) {
                finalAmount = pricingResult.data.finalFare;
                fareDetails = pricingResult.data.breakdown;
                console.log("[Socket] Fare recalculated successfully. Final Amount:", finalAmount, "Waiting Charge:", fareDetails?.waitingCharge);

                // Sync all pricing components to the Order document
                if (!order.pricing) order.pricing = {};
                order.pricing.totalAmount = finalAmount;
                order.pricing.waitingCharge = fareDetails?.waitingCharge || 0;
                order.pricing.platformSurcharge = fareDetails?.platformSurcharge || 0;
                order.pricing.discount = fareDetails?.discount || 0;

                // Also update legacy field for wallet and invoice compatibility
                if (!order.waitingInfo) order.waitingInfo = {};
                order.waitingInfo.cost = fareDetails?.waitingCharge || 0;
                order.waitingInfo.duration = waitTime;
                
                await order.save();
              } else {
                console.warn("[Socket] Fare recalculation failed:", pricingResult.message, ". Using client-provided amount or estimate.");
              }
            } else {
              console.warn("[Socket] Cannot recalculate fare: vehicleType is missing in order details.");
            }
          }

          // Proceed with completion using the calculated finalAmount
          const result = await driverService.CompleteRideByDriver({
            ...data,
            amount: finalAmount
          });

          if (result.success) {
            // Notify driver of success
            socket.emit("ride_complete_success", {
              orderId,
              message: "Ride completed successfully",
              data: result.data
            });

            // Notify consumer that ride is completed
            // We need to find the consumer socket. 
            // Ideally we should track active ride sockets or store consumerSocketId in activeRequests before deleting.
            // But activeRequests are deleted on accept.
            // So we broadcast to the consumer room if they joined one, or we need to find them by userId.
            // For now, assuming consumer is listening on their own socket channel or room.
            // Actually, socket.js here doesn't seem to have a map of userId -> socketId easily accessible except maybe iterating.
            // Let's assume consumer joins a room named by their userId or orderId?

            // Check if we can find consumer socket.
            // If not, push notification should handle it (which service likely does).
            // But for real-time update:
            io.to(`user_${order.userId}`).emit("ride_completed", {
              orderId,
              status: 'COMPLETED',
              message: "Your ride has been completed",
              data: result.data
            });

            // Better: emit to specific consumer if possible.
            // For now, io.emit is safe enough if clients filter by orderId, but wasteful.
            // Let's stick to just processing the DB update. The Partner app needs 'ride_complete_success' to navigate.

          } else {
            socket.emit("ride_complete_error", {
              message: result.message || "Failed to complete ride",
            });
          }
        } catch (error) {
          console.log("Error handling complete-ride:", error);
          socket.emit("ride_complete_error", {
            message: "Internal server error during ride completion",
          });
        }
      });

      // Handle ride rejection from driver
      socket.on("reject-ride-request", async (data) => {
        console.log("Ride rejection received from driver:", data);
        try {
          const { requestId, reason } = data;

          if (!activeRideRequests.has(requestId)) {
            socket.emit("ride_reject_error", {
              message: "Ride request not found",
            });
            return;
          }

          const rideRequest = activeRideRequests.get(requestId);

          // Notify the driver about successful rejection
          socket.emit("ride_reject_success", {
            requestId,
            message: "Ride request rejected successfully",
          });

          // Log the rejection (could be stored in database for analytics)
          console.log(
            `Driver ${socket.userId
            } rejected ride request ${requestId}. Reason: ${reason || "No reason provided"
            }`
          );

          // Note: We don't remove the request from activeRideRequests here
          // because other drivers might still accept it
        } catch (error) {
          console.log("Error while processing ride rejection:", error);
          socket.emit("ride_reject_error", {
            message: "Error while processing ride rejection",
          });
        }
      });

      // Handle ride cancellation from consumer
      socket.on("cancel-ride-request", async (data) => {
        console.log("Ride cancellation received from consumer:", data);
        try {
          const { requestId } = data;

          if (!activeRideRequests.has(requestId)) {
            socket.emit("ride_cancel_error", {
              message: "Ride request not found",
            });
            return;
          }

          const rideRequest = activeRideRequests.get(requestId);

          // Only allow cancellation by the original requestor
          if (rideRequest.consumerUserId !== socket.userId) {
            socket.emit("ride_cancel_error", {
              message: "You can only cancel your own ride requests",
            });
            return;
          }

          // Clear the expiry timer if it exists
          if (rideRequestTimers.has(requestId)) {
            clearTimeout(rideRequestTimers.get(requestId));
            rideRequestTimers.delete(requestId);
          }

          // Remove from active requests
          activeRideRequests.delete(requestId);

          // Notify consumer about successful cancellation
          socket.emit("ride_cancel_success", {
            requestId,
            message: "Ride request cancelled successfully",
          });

          // Notify all drivers that the request has been cancelled
          io.emit("ride_request_cancelled", {
            requestId,
            message: "This ride request has been cancelled by the consumer",
          });
        } catch (error) {
          console.log("Error while processing ride cancellation:", error);
          socket.emit("ride_cancel_error", {
            message: "Error while processing ride cancellation",
          });
        }
      });
      // Handle disconnections
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        if (socket.userId) {
          // Clean up any active ride requests for disconnected users
          for (const [requestId, request] of activeRideRequests.entries()) {
            if (
              request.consumerUserId === socket.userId &&
              request.status === "PENDING"
            ) {
              // Clear timer and remove request
              if (rideRequestTimers.has(requestId)) {
                clearTimeout(rideRequestTimers.get(requestId));
                rideRequestTimers.delete(requestId);
              }
              activeRideRequests.delete(requestId);

              // Notify drivers that request is cancelled
              io.emit("ride_request_cancelled", {
                requestId,
                message: "Ride request cancelled due to consumer disconnect",
              });
            }
          }

          logger.info(`User disconnected: ${socket.userId}`, {
            timestamp: new Date().toISOString(),
          });
        }
      });
    });

    return io;
  } catch (error) {
    console.error("Socket initialization error:", error);
    logger.error("Socket initialization failed:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = { initializeSocket, cleanupRideRequestByOrderId };
