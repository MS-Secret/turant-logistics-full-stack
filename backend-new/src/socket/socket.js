const { Server } = require("socket.io");
const dotenv = require("dotenv");
const winston = require("winston");
const driverService = require("../services/driver.service");
const { VerifyTokenThroughSocket } = require("../middleware/auth.middleware");
const { UpdateOrderStatusWithDriver } = require("../services/order.service");

// Store active ride requests and their timers
const activeRideRequests = new Map();
const rideRequestTimers = new Map();
dotenv.config();

// Create logger instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const initializeSocket = (server) => {
  try {
    console.log("Initializing Socket.io...");
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
      console.log("New client connected:", socket.id);

      // Authenticate socket connection
      try {
        console.log("socket token:", socket.handshake.auth);
        const token = socket.handshake.auth.token;
        if (!token) {
          console.log("Socket authentication failed: No token provided");
          socket.emit("auth_error", { message: "No token provided" });
          socket.disconnect();
          return;
        }

        // Verify token and wait for result
        const response = await VerifyTokenThroughSocket(token);

        if (!response.success) {
          console.log("Socket authentication failed:", response.message);
          socket.emit("auth_error", {
            message: response.message || "Token validation failed",
          });
          socket.disconnect();
          return;
        }

        const decoded = response.data;
        console.log("decode user:", decoded);
        console.log("Socket authenticated for user:", decoded);

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
        } catch (error) {
          console.log("error while getting send-location from driver:", error);
        }
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
        console.log("Ride request received from consumer:", data);
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
          const orderId = result.data.orderId;
          activeRideRequests.set(rideRequestId, {
            ...result.data.rideRequestData,
            consumerSocketId: socket.id,
            consumerUserId: socket.userId,
            status: "PENDING",
            orderId: orderId,
          });

          // Send ride request to all nearby drivers
          const nearbyDriversResult = await driverService.GetNearbyDrivers({
            lat: data.pickupLocation.latitude,
            long: data.pickupLocation.longitude,
            radiusInKm: data.radiusInKm || 10,
          });

          if (nearbyDriversResult.success) {
            nearbyDriversResult.data.drivers.forEach((driver) => {
              io.to(`user_${driver.userId}`).emit("ride_request_received", {
                requestId: rideRequestId,
                rideData: result.data.rideRequestData,
                consumerData: result.data.consumerData,
                distance: driver.distance,
                orderId: orderId || null,
              });
            });
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
          }, 2 * 60 * 1000); // 2 minutes

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
        console.log("Ride acceptance received from driver:", data);
        try {
          const { requestId, orderId } = data;

          if (!activeRideRequests.has(requestId)) {
            socket.emit("ride_accept_error", {
              message: "Ride request not found or already processed",
            });
            return;
          }

          const rideRequest = activeRideRequests.get(requestId);

          if (rideRequest.status !== "PENDING") {
            socket.emit("ride_accept_error", {
              message: "Ride request is no longer available",
            });
            return;
          }

          // Update ride request status
          rideRequest.status = "ACCEPTED";
          rideRequest.acceptedBy = socket.userId;
          rideRequest.acceptedAt = new Date().toISOString();
          activeRideRequests.set(requestId, rideRequest);

          //send update to database about acceptance
          await UpdateOrderStatusWithDriver({
            orderId,
            status: "DRIVER_ACCEPTED",
            driverId: socket.userId,
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
            rideData: rideRequest,
          });

          // Notify the accepting driver
          socket.emit("ride_accept_success", {
            requestId,
            message: "Ride request accepted successfully",
            rideData: rideRequest,
            orderId: orderId,
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
            `Driver ${
              socket.userId
            } rejected ride request ${requestId}. Reason: ${
              reason || "No reason provided"
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

      //handle ride completion by driver
      socket.on("complete-ride", async (data) => {
        console.log("complete-ride event received from driver:", data);
        try {
          const result = await driverService.CompleteRideByDriver(data);
          if (!result.success) {
            console.log("error while completing the ride:", result.message);
            socket.emit("complete_ride_error", { message: result.message });
            return;
          }

          // Emit to consumer with ride completion and order data
          io.to(`user_${data.consumerUserId}`).emit("ride_completed", {
            message: "Your ride has been completed",
            rideData: result.data,
            orderId: data.orderId || null,
            completedAt: new Date().toISOString(),
          });

          socket.emit("complete_ride_success", {
            message: result.message,
            data: result.data,
            orderId: data.orderId || null,
          });
        } catch (error) {
          console.log("error while completing the ride:", error);
          socket.emit("complete_ride_error", {
            message: "error while completing the ride",
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

module.exports = { initializeSocket };
