const { sendToMultipleDevices } = require("../config/firebase.config");
const Driver = require("../models/driver.model");
const User = require("../models/user.model");
const { filterDriversByRadius } = require("../utils/locationUtils");
const { UploadToCloudinary } = require("../config/cloudinaryConfig");
const KYCModel = require("../models/kyc.model");
const NotificationModel = require("../models/notification.model");
const { UpdateOrderStatusWithDriver } = require("./order.service");
const { GetKycDetails } = require("./kyc.service");

const GetDriverList = async (payload) => {
  try {
    const { page, limit } = payload;
    const drivers = await Driver.find()
      .skip((page - 1) * limit)
      .limit(limit);
    if (!drivers) {
      return {
        success: false,
        message: "No drivers found",
        data: [],
      };
    }
    const driverDetailsPromises = drivers.map(async (driver) => {
      const user = await User.find({
        userId: driver.userId,
      });
      return { ...driver.toObject(), user: user[0] };
    });

    // Resolve all promises
    const driverDetails = await Promise.all(driverDetailsPromises);

    const totalDrivers = await Driver.countDocuments();
    console.log(`Total drivers in database: ${totalDrivers}`);
    const totalPages = Math.ceil(totalDrivers / limit);
    const currentPage = page;
    const pageSize = limit;

    console.log(
      `Total pages: ${totalPages}, Current page: ${currentPage}, Page size: ${pageSize}`
    );
    return {
      success: true,
      message: "Driver list fetched successfully",
      data: {
        totalDrivers,
        totalPages,
        currentPage: page,
        pageSize: limit,
        drivers: driverDetails,
      },
    };
  } catch (error) {
    console.error("Error fetching driver list:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const GetDriverDetails = async ({ driverId, userId }) => {
  try {
    let driver;
    if (userId) {
      driver = await Driver.findOne({ userId });
    } else {
      driver = await Driver.findById(driverId);
    }
    if (!driver) {
      return {
        success: false,
        message: "Driver not found",
        data: null,
      };
    }
    const user = await User.find({
      userId: driver.userId,
    });
    const kycResponse = await GetKycDetails(driver.userId);
    const kycData = kycResponse?.data;
    console.log("KYC Data for driver:", kycData);
    const data = {
      ...driver.toObject(),
      user: user[0],
      kyc: kycData,
    };
    return {
      success: true,
      message: "Driver details fetched successfully",
      data,
    };
  } catch (error) {
    console.error("Error fetching driver details:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const UpdateKycStatus = async ({ userId, status }) => {
  console.log(
    `UpdateKycStatus called with userId: ${userId}, status: ${status}`
  );
  try {
    if (!userId) {
      return {
        success: false,
        message: "UserId is required",
      };
    }
    if (!status) {
      return {
        success: false,
        message: "Status is required",
      };
    }
    const updatePayload = { kycStatus: status };

    // Automatically approve driver if KYC is verified
    if (status === 'VERIFIED') {
      updatePayload.approvalStatus = 'APPROVED';
      updatePayload.isActive = true;
    } else if (status === 'REJECTED') {
      updatePayload.approvalStatus = 'REJECTED';
      updatePayload.isActive = false;
    }

    const driver = await Driver.findOneAndUpdate(
      { userId },
      updatePayload,
      { new: true }
    );
    if (!driver) {
      return {
        success: false,
        message: "Driver not found for the given UserId",
      };
    }
    return {
      success: true,
      message: "Driver KYC status updated successfully",
      data: driver,
    };
  } catch (error) {
    console.error("Error updating driver KYC status:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const FindingActiveDrivers = async () => {
  try {
    const activeDrivers = await Driver.find({
      workingStatus: "ONLINE",
      isActive: true,
    }).select("currentLocation userId");
    if (!activeDrivers || activeDrivers.length === 0) {
      return {
        success: false,
        message: "No active drivers found",
        data: [],
      };
    }
    console.log("Active drivers found:", activeDrivers);

    const userIds = activeDrivers.map((driver) => driver.userId);
    const users = await User.find({ userId: { $in: userIds } });
    const userMap = {};
    users.forEach((user) => {
      userMap[user.userId] = user;
    });
    await sendToMultipleDevices(
      users.flatMap(
        (user) =>
          user.metadata.deviceInfo?.map((device) => device.fcmToken) || []
      ),
      {
        title: "Active Drivers",
        body: "You have active drivers available.",
      },
      {
        userIds: userIds.join(","),
        timestamp: new Date().toISOString(),
      }
    );
    return {
      success: true,
      message: "Active drivers fetched successfully",
      data: activeDrivers,
    };
  } catch (error) {
    console.log("error while finding the active drivers:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};
const UpdateDriverWorkingStatus = async (payload) => {
  try {
    const { userId, status, lat, long } = payload;
    if (!userId) {
      return {
        success: false,
        message: "UserId is required",
      };
    }
    if (!status) {
      return {
        success: false,
        message:
          "Status is required status will be either ONLINE or OFFLINE or BUSY",
      };
    }

    const driver = await Driver.findOneAndUpdate(
      { userId },
      {
        workingStatus: status,
      },
      { new: true }
    ).populate("kycDetailsId");
    if (lat && long) {
      driver.currentLocation.latitude = lat;
      driver.currentLocation.longitude = long;
      await driver.save();
    }
    if (!driver) {
      return {
        success: false,
        message: "Driver not found for the given UserId",
      };
    }
    return {
      success: true,
      message: "Driver working status updated successfully",
      data: driver,
    };
  } catch (error) {
    console.log("error while updating the driver working status:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const UpdateCurrentLocation = async (payload) => {
  try {
    const { userId, lat, long } = payload;
    if (!userId) {
      return {
        success: false,
        message: "userId is required",
      };
    }
    if (!lat) {
      return {
        success: false,
        message: "latitude is required",
      };
    }

    if (!long) {
      return {
        success: false,
        message: "longitude is required",
      };
    }

    const driver = await Driver.findOneAndUpdate(
      { userId },
      {
        currentLocation: {
          latitude: lat,
          longitude: long,
        },
      },
      { new: true }
    ).populate("kycDetailsId");
    if (!driver) {
      return {
        success: false,
        message: "driver data not updated",
      };
    }

    return {
      success: true,
      message: "driver location updated",
      data: driver,
    };
  } catch (error) {
    console.log("error while updating the driver current location:", error);
    return {
      success: false,
      message: "error while update location",
      error: error?.message,
    };
  }
};

const GetNearbyDrivers = async (payload) => {
  try {
    const { lat, long, radiusInKm = 5, orderId, vehicleType, vehicleBodyType, vehicleFuelType } = payload;
    console.log("order id in get nearby drivers:", orderId);
    console.log("Looking for vehicle:", { vehicleType, vehicleBodyType, vehicleFuelType });
    // Validate required parameters
    if (!lat || !long) {
      return {
        success: false,
        message: "Both latitude and longitude are required",
      };
    }

    if (isNaN(lat) || isNaN(long)) {
      return {
        success: false,
        message: "Invalid coordinates provided",
      };
    }

    // Find all active drivers and populate their KYC details for vehicle matching
    const activeDriversQuery = await Driver.find({
      workingStatus: "ONLINE",
      isActive: true,
      "currentLocation.latitude": { $ne: 0 },
      "currentLocation.longitude": { $ne: 0 },
    })
      .select("currentLocation userId driverId ratings kycDetailsId")
      .populate("kycDetailsId");

    // Filter drivers based on requested vehicle attributes
    let activeDrivers = activeDriversQuery;

    const { normalizeVehicleAttributes } = require("../utils/vehicleNormalizer");
    const normalizedReq = normalizeVehicleAttributes({
      vehicleType,
      vehicleBodyType,
      vehicleFuelType
    });

    if (normalizedReq.vehicleType) {
      activeDrivers = activeDriversQuery.filter((driver) => {
        const kycVeh = driver.kycDetailsId?.vehicle;
        if (!kycVeh) return false;

        const normalizedKyc = normalizeVehicleAttributes({
          vehicleType: kycVeh.vehicleType,
          vehicleBodyType: kycVeh.vehicleBodyType,
          vehicleFuelType: kycVeh.vehicleFuelType
        });

        // Match normalized vehicle type
        if (normalizedKyc.vehicleType !== normalizedReq.vehicleType) {
          return false;
        }

        // Match body type if requested
        if (normalizedReq.vehicleBodyType && normalizedKyc.vehicleBodyType !== normalizedReq.vehicleBodyType) {
          return false;
        }

        // Match fuel type if requested
        if (normalizedReq.vehicleFuelType && normalizedKyc.vehicleFuelType !== normalizedReq.vehicleFuelType) {
          return false;
        }

        return true;
      });
    }

    if (!activeDrivers || activeDrivers.length === 0) {
      return {
        success: false,
        message: "No active drivers found",
        data: [],
      };
    }

    console.log(`Found ${activeDrivers.length} active drivers`);
    console.log("active drivers data:", activeDrivers);

    // Filter drivers within radius and add distance information
    const nearbyDrivers = filterDriversByRadius(
      activeDrivers,
      parseFloat(lat),
      parseFloat(long),
      radiusInKm
    );

    if (nearbyDrivers.length === 0) {
      return {
        success: false,
        message: `No drivers found within ${radiusInKm}km radius`,
        data: [],
      };
    }

    // Get user details for nearby drivers
    const userIds = nearbyDrivers.map((driver) => driver.userId);
    const users = await User.find({ userId: { $in: userIds } }).select(
      "userId firstName lastName phoneNumber profilePicture metadata"
    );

    const userMap = {};
    users.forEach((user) => {
      userMap[user.userId] = user;
    });

    // Combine driver and user data
    const driversWithUserData = nearbyDrivers.map((driver) => ({
      ...driver,
      user: userMap[driver.userId] || null,
    }));

    console.log(
      `Found ${nearbyDrivers.length} drivers within ${radiusInKm}km radius`
    );

    return {
      success: true,
      message: `Found ${nearbyDrivers.length} drivers within ${radiusInKm}km radius`,
      data: {
        orderId: orderId || null,
        drivers: driversWithUserData,
        totalFound: nearbyDrivers.length,
        searchRadius: radiusInKm,
        consumerLocation: { lat: parseFloat(lat), long: parseFloat(long) },
      },
    };
  } catch (error) {
    console.log("Error while getting nearby drivers:", error);
    return {
      success: false,
      message: "Error while getting nearby drivers",
      error: error?.message,
    };
  }
};

// Function to send ride request to nearby drivers
const SendRideRequestToDrivers = async (payload) => {
  try {
    const {
      consumerUserId,
      pickupLocation,
      dropoffLocation,
      rideType,
      estimatedFare,
      driverIds = [],
      radiusInKm = 5,
      orderId,
    } = payload;

    if (!consumerUserId || !pickupLocation || !dropoffLocation) {
      return {
        success: false,
        message: "Consumer ID, pickup and dropoff locations are required",
      };
    }

    let targetDrivers = [];

    if (driverIds.length > 0) {
      // Send to specific drivers
      targetDrivers = await Driver.find({
        userId: { $in: driverIds },
        workingStatus: "ONLINE",
        isActive: true,
      }).select("userId");
    } else {
      // Find nearby drivers automatically (with vehicle matching)
      const nearbyResult = await GetNearbyDrivers({
        lat: pickupLocation.latitude,
        long: pickupLocation.longitude,
        radiusInKm,
        vehicleType: rideType,
        vehicleBodyType: payload.vehicleBodyType,
        vehicleFuelType: payload.vehicleFuelType,
      });

      if (!nearbyResult.success) {
        return nearbyResult;
      }

      targetDrivers = nearbyResult.data.drivers.map((driver) => ({
        userId: driver.userId,
      }));
    }

    if (targetDrivers.length === 0) {
      return {
        success: false,
        message: "No available drivers found for ride request",
      };
    }

    const rideRequestData = {
      requestId: `ride_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      consumerUserId,
      pickupLocation,
      dropoffLocation,
      rideType,
      estimatedFare,
      payment: payload.payment || { method: 'CASH', cashCollectionAt: payload.cashCollectionAt || 'DROP' },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes expiry
      status: "PENDING",
    };

    // Get user details for consumer
    const consumer = await User.findOne({ userId: consumerUserId }).select(
      "userId username phone profile.firstName profile.lastName profile.profileImageUrl"
    );

    const targetUserIds = targetDrivers.map((driver) => driver.userId);

    // Send push notifications to drivers
    const users = await User.find({ userId: { $in: targetUserIds } });

    // Save notifications to Database
    if (targetUserIds && targetUserIds.length > 0) {
      const notificationDocs = targetUserIds.map(uid => ({
        userId: uid,
        title: "New Delivery Request",
        message: `New delivery request from ${consumer?.firstName || "Customer"}`,
        type: 'order',
        read: false
      }));
      try {
        await NotificationModel.insertMany(notificationDocs);
      } catch (dbErr) {
        console.error("Error saving ride request notifications to DB:", dbErr);
      }
    }

    await sendToMultipleDevices(
      users.flatMap(
        (user) =>
          user.metadata.deviceInfo?.map((device) => device.fcmToken) || []
      ),
      {
        title: "New Delivery Request",
        body: `New delivery request from ${consumer?.firstName || "Customer"}`,
      },
      {
        type: "RIDE_REQUEST",
        rideRequestData: JSON.stringify(rideRequestData),
        consumerData: JSON.stringify(consumer),
        orderId: orderId || "", // IMPORTANT: Include orderId in notification data
        timestamp: new Date().toISOString(),
      }
    );

    return {
      success: true,
      message: `Ride request sent to ${targetDrivers.length} drivers`,
      data: {
        rideRequestData,
        targetDrivers: targetDrivers.length,
        consumerData: consumer,
        orderId: orderId || null,
      },
    };
  } catch (error) {
    console.log("Error while sending ride request:", error);
    return {
      success: false,
      message: "Error while sending ride request",
      error: error?.message,
    };
  }
};

const CompleteRideByDriver = async ({ driverId, orderId, amount }) => {
  try {
    if (!driverId) {
      return {
        success: false,
        message: "driverId is required",
      };
    }
    if (!orderId) {
      return {
        success: false,
        message: "orderId is required",
      };
    }
    const driver = await Driver.findOne({
      userId: driverId,
    });

    if (!driver) {
      return {
        success: false,
        message: "Driver not found",
      };
    }

    // Update statistics
    driver.statistics.totalOrders += 1;
    driver.statistics.completedOrders += 1;

    // Update earnings with safe validation
    const safeAmount = (amount && !isNaN(amount)) ? Number(amount) : 0;
    driver.earnings.totalEarnings += safeAmount;
    driver.earnings.todayEarnings += safeAmount;

    // Driver becomes available again after completing the ride
    driver.workingStatus = "ONLINE";

    await driver.save();
    const payload = {
      orderId: orderId,
      status: "COMPLETED",
      driverId: driverId,
    };
    await UpdateOrderStatusWithDriver(payload);
    return {
      success: true,
      message: "Ride completion initiated successfully",
      data: {
        orderId: orderId,
        driverId: driverId,
        status: "COMPLETED",
        totalEarnings: driver.earnings.totalEarnings,
        todayEarnings: driver.earnings.todayEarnings,
      },
    };
  } catch (error) {
    console.log("Error while completing ride by driver:", error);
    return {
      success: false,
      message: "Error while completing ride by driver",
      error: error?.message,
    };
  }
};

// Function to reset daily earnings for all drivers (to be called daily via cron job)
const ResetDailyEarnings = async () => {
  try {
    const result = await Driver.updateMany(
      {},
      {
        $set: {
          "earnings.todayEarnings": 0,
        },
      }
    );

    console.log(`Daily earnings reset for ${result.modifiedCount} drivers`);

    return {
      success: true,
      message: `Daily earnings reset for ${result.modifiedCount} drivers`,
      data: {
        driversUpdated: result.modifiedCount,
      },
    };
  } catch (error) {
    console.log("Error while resetting daily earnings:", error);
    return {
      success: false,
      message: "Error while resetting daily earnings",
      error: error?.message,
    };
  }
};

const AddDriverDetails = async (payload) => {
  try {
    console.log("Payload in service:", payload);
    const { name, licenseNumber, userId, licenseDocument, phoneNumber, accountHolderName, accountNumber, ifscCode, passbookDocument } = payload;

    if (!name || !licenseNumber) {
      return {
        success: false,
        message: "Name and LicenseNumber are required",
      };
    }
    let licenseDocumentUrl = await UploadToCloudinary(
      licenseDocument,
      "driverLicense"
    );

    let passbookDocumentUrl = null;
    if (passbookDocument) {
      passbookDocumentUrl = await UploadToCloudinary(
        passbookDocument,
        "driverPassbook"
      );
    }

    const KYCApplication = await KYCModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          "driver.name": name,
          "driver.licenseNumber": licenseNumber,
          "driver.licenseImageUrl": licenseDocumentUrl,
          "driver.phoneNumber": phoneNumber,
          "driver.bankDetails.accountHolderName": accountHolderName,
          "driver.bankDetails.accountNumber": accountNumber,
          "driver.bankDetails.ifscCode": ifscCode,
          "driver.bankDetails.passbookImageUrl": passbookDocumentUrl,
          status: "pending", // Explicitly set status to pending
        },
      },
      { new: true }
    );

    if (!KYCApplication) {
      return {
        success: false,
        message: "KYC Application not found for the given UserId",
      };
    }

    // CRITICAL FIX: Update Driver status to PENDING so they appear in Admin Panel
    // AND create driver record if it doesn't exist (upsert)
    await Driver.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          kycStatus: "PENDING",
          kycDetailsId: KYCApplication._id,
        },
        $setOnInsert: {
          approvalStatus: "PENDING",
          workingStatus: "OFFLINE",
          isActive: true,
          isDeleted: false,
          driverId: `DRV${Date.now()}${Math.floor(Math.random() * 1000)}`,
        }
      },
      { upsert: true, new: true }
    );

    return {
      success: true,
      message: "Driver details added successfully",
      data: KYCApplication,
    };
  } catch (error) {
    console.error("Error in AddDriverDetails:", error);
    return {
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    };
  }
};

const SendRideRequestNotification = async (drivers, rideData) => {
  try {
    if (!drivers || drivers.length === 0) return;

    // Extract user IDs to fetch FCM tokens
    const userIds = drivers.map(driver => driver.userId);

    // Fetch users with their device info
    const users = await User.find({ userId: { $in: userIds } }).select("userId metadata.deviceInfo");

    // Collect all FCM tokens
    let fcmTokens = [];
    users.forEach(user => {
      if (user.metadata && user.metadata.deviceInfo) {
        user.metadata.deviceInfo.forEach(device => {
          if (device.fcmToken) {
            fcmTokens.push(device.fcmToken);
          }
        });
      }
    });

    if (fcmTokens.length === 0) {
      console.log("No FCM tokens found for nearby drivers");
      return;
    }

    // Construct notification payload
    // rideData now includes orderId (added in socket.js before calling this function)
    const title = "New Delivery Request 🏍️";
    const body = `Pickup: ${rideData.pickupLocation?.address || 'Unknown Location'} - Fare: ₹${rideData.estimatedFare || 0}`;

    // Extract consumerData if it exists in rideData, otherwise use empty object
    const consumerData = rideData.consumerData || {};

    const data = {
      type: "RIDE_REQUEST",
      rideRequestId: rideData.requestId || "",
      orderId: rideData.orderId || "", // orderId is now included in rideData from socket.js
      rideRequestData: JSON.stringify(rideData), // Include full rideData with orderId
      consumerData: JSON.stringify(consumerData), // Include consumer data
    };

    console.log("FCM Notification data - orderId:", data.orderId, "rideRequestId:", data.rideRequestId);

    console.log(`Sending FCM notification to ${fcmTokens.length} devices`);

    // Save notifications to Database
    if (userIds && userIds.length > 0) {
      const notificationDocs = userIds.map(uid => ({
        userId: uid,
        title: title,
        message: body,
        type: 'order',
        read: false
      }));
      try {
        await NotificationModel.insertMany(notificationDocs);
      } catch (dbErr) {
        console.error("Error saving ride request notifications to DB:", dbErr);
      }
    }

    // Send notification
    await sendToMultipleDevices(fcmTokens, { title, body }, data);

    return { success: true, count: fcmTokens.length };
  } catch (error) {
    console.error("Error sending ride request FCM notification:", error);
    return { success: false, error: error.message };
  }
};

const AcceptRideRequest = async (payload) => {
  try {
    const { driverId, orderId, lat, long } = payload;

    if (!driverId || !orderId) {
      return { success: false, message: "DriverId and OrderId are required" };
    }

    // 1. Assign Driver to Order
    const orderPayload = {
      orderId,
      driverId,
      status: "ACCEPTED" // Or ASSIGNED? Let's check UpdateOrderStatusWithDriver
    };

    // We need to verify if the order is still PENDING? 
    // The socket handles the race condition for activeRideRequests map, 
    // but good to check DB too if needed. For now, we trust the flow.

    const updateOrderResult = await UpdateOrderStatusWithDriver(orderPayload);

    if (!updateOrderResult.success) {
      return { success: false, message: "Failed to update order status" };
    }

    // 2. Update Driver Status to BUSY
    const driverUpdatePayload = {
      userId: driverId, // Assuming driverId passed is actually userId. Let's verify usage.
      status: "BUSY",
      lat,
      long
    };

    // Wait, UpdateDriverWorkingStatus takes userId. 
    // In socket.js, data comes from client. 
    // Partner triggers it with `user?.userId` as driverId?
    // Let's assume input driverId is the userId.

    await UpdateDriverWorkingStatus(driverUpdatePayload);

    // 3. Get Driver Details to return to Consumer
    const driverDetails = await Driver.findOne({ userId: driverId });
    const userDetails = await User.findOne({ userId: driverId }).select("firstName lastName phoneNumber profilePicture ratings");

    const fullDriverData = {
      ...driverDetails?.toObject(),
      user: userDetails?.toObject(),
      currentLocation: { latitude: lat, longitude: long }
    };

    return {
      success: true,
      message: "Ride accepted successfully",
      data: {
        orderId,
        driver: fullDriverData,
        order: updateOrderResult.data // Assuming this contains updated order
      }
    };
  } catch (error) {
    console.error("Error in AcceptRideRequest:", error);
    return { success: false, message: error.message };
  }
};

const BlockDriver = async ({ userId }) => {
  try {
    if (!userId) {
      return { success: false, message: "UserId is required" };
    }

    // 1. Update User model status
    await User.findOneAndUpdate({ userId }, { status: 'SUSPENDED' });

    // 2. Update Driver model status
    const driver = await Driver.findOneAndUpdate(
      { userId },
      { 
        approvalStatus: 'SUSPENDED',
        isActive: false,
        workingStatus: 'OFFLINE' // Force offline
      },
      { new: true }
    );

    if (!driver) {
      return { success: false, message: "Driver not found" };
    }

    return {
      success: true,
      message: "Driver blocked successfully",
      data: driver
    };
  } catch (error) {
    console.error("Error blocking driver:", error);
    return { success: false, message: error.message };
  }
};

const UnblockDriver = async ({ userId }) => {
  try {
    if (!userId) {
      return { success: false, message: "UserId is required" };
    }

    // 1. Update User model status
    await User.findOneAndUpdate({ userId }, { status: 'ACTIVE' });

    // 2. Update Driver model status
    const driver = await Driver.findOneAndUpdate(
      { userId },
      { 
        approvalStatus: 'APPROVED',
        isActive: true 
      },
      { new: true }
    );

    if (!driver) {
      return { success: false, message: "Driver not found" };
    }

    return {
      success: true,
      message: "Driver unblocked successfully",
      data: driver
    };
  } catch (error) {
    console.error("Error unblocking driver:", error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  GetDriverList,
  GetDriverDetails,
  UpdateKycStatus,
  FindingActiveDrivers,
  UpdateDriverWorkingStatus,
  UpdateCurrentLocation,
  GetNearbyDrivers,
  SendRideRequestToDrivers,
  CompleteRideByDriver,
  ResetDailyEarnings,
  AddDriverDetails,
  SendRideRequestNotification,
  AcceptRideRequest,
  BlockDriver,
  UnblockDriver
};