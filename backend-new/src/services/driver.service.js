const { sendToMultipleDevices } = require("../config/firebase.config");
const Driver = require("../models/driver.model");
const User = require("../models/user.model");
const { filterDriversByRadius } = require("../utils/locationUtils");
const { cloudinary } = require("../config/cloudinaryConfig");
const KYCModel = require("../models/kyc.model");
const { UpdateOrderStatusWithDriver } = require("./order.service");

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
    const kycData = await requestKYCData(driver.userId);
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
    const driver = await Driver.findOneAndUpdate(
      { userId },
      { kycStatus: status },
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
    );
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
    );
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
    const { lat, long, radiusInKm = 10, orderId } = payload;
    console.log("order id in get nearby drivers:", orderId);
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

    // Find all active drivers
    const activeDrivers = await Driver.find({
      workingStatus: "ONLINE",
      isActive: true,
      "currentLocation.latitude": { $ne: 0 },
      "currentLocation.longitude": { $ne: 0 },
    }).select("currentLocation userId driverId ratings");

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
      radiusInKm = 10,
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
      // Find nearby drivers automatically
      const nearbyResult = await GetNearbyDrivers({
        lat: pickupLocation.latitude,
        long: pickupLocation.longitude,
        radiusInKm,
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
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes expiry
      status: "PENDING",
    };

    // Get user details for consumer
    const consumer = await User.findOne({ userId: consumerUserId }).select(
      "firstName lastName phoneNumber profilePicture"
    );

    const targetUserIds = targetDrivers.map((driver) => driver.userId);

    // Send push notifications to drivers
    const users = await User.find({ userId: { $in: targetUserIds } });
    await sendToMultipleDevices(
      users.flatMap(
        (user) =>
          user.metadata.deviceInfo?.map((device) => device.fcmToken) || []
      ),
      {
        title: "New Ride Request",
        body: `New ride request from ${consumer?.firstName || "Customer"}`,
      },
      {
        type: "RIDE_REQUEST",
        rideRequestData: JSON.stringify(rideRequestData),
        consumerData: JSON.stringify(consumer),
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

    // Update earnings
    driver.earnings.totalEarnings += amount;
    driver.earnings.todayEarnings += amount;

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
    const { name, licenseNumber, userId, licenseDocument, phoneNumber } =
      payload;

    if (!name || !licenseNumber) {
      return {
        success: false,
        message: "Name and LicenseNumber are required",
      };
    }
    let licenseDocumentUrl = await cloudinary.UploadToCloudinary(
      licenseDocument,
      "driverLicense"
    );
    const KYCApplication = await KYCModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          "driver.name": name,
          "driver.licenseNumber": licenseNumber,
          "driver.licenseImageUrl": licenseDocumentUrl,
          "driver.phoneNumber": phoneNumber,
          stepCompleted: 3,
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
};
