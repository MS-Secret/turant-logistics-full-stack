const httpStatusCode = require("../constants/httpStatusCode");
const {
  GetDriverList,
  GetDriverDetails,
  UpdateKycStatus,
  UpdateDriverWorkingStatus,
  FindingActiveDrivers,
  GetNearbyDrivers,
  SendRideRequestToDrivers,
  CompleteRideByDriver,
  ResetDailyEarnings
} = require("../services/driver.service");
const driverService = require("../services/driver.service");

const handleGetDriverList = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await GetDriverList({
      page: parseInt(page),
      limit: parseInt(limit),
    });
    console.log("Driver list result:", result);
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.NOT_FOUND).json(result);
    }
  } catch (error) {
    console.error("Error fetching driver list:", error);
    return res
      .status(httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
  }
};

const handleGetDriverDetails = async (req, res) => {
  try {
    const { driverId } = req.params;
    if (!driverId) {
      return res
        .status(httpStatusCode.BAD_REQUEST)
        .json({ success: false, message: "Driver ID is required" });
    }
    const result = await GetDriverDetails({ driverId });
    console.log("Driver details result:", result);
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.NOT_FOUND).json(result);
    }
  } catch (error) {
    console.error("Error fetching driver details:", error);
    return res
      .status(httpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
  }
};

const handleUpdateDriverKycStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "UserId is required",
        timestamp: new Date().toISOString(),
      });
    }
    if (!status) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Status is required",
        timestamp: new Date().toISOString(),
      });
    }
    const result = await UpdateKycStatus({ userId, status });
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error in handleUpdateDriverKycStatus:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};

const handleActiveFindingDrivers = async (req, res) => {
  try {

    const result = await FindingActiveDrivers();
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.NOT_FOUND).json(result);
    }
  } catch (error) {
    console.error("Error in handleActiveFindingDrivers:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};

const handleUpdateDriverWorkingStatus = async (req, res) => {
  try {
    const { userId, status, lat, long } = req.body;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "UserId is required",
        timestamp: new Date().toISOString(),
      });
    }
    if (!status) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Status is required",
        timestamp: new Date().toISOString(),
      });
    }
    const result = await UpdateDriverWorkingStatus({ userId, status, lat, long });
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error in handleUpdateDriverWorkingStatus:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};

const handleGetNearbyDrivers = async (req, res) => {
  try {
    const { lat, long, radiusInKm } = req.query;

    if (!lat || !long) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Both latitude and longitude are required",
      });
    }

    const result = await GetNearbyDrivers({
      lat: parseFloat(lat),
      long: parseFloat(long),
      radiusInKm: radiusInKm ? parseFloat(radiusInKm) : 10
    });

    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error in handleGetNearbyDrivers:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while fetching nearby drivers.",
      error: error.message,
    });
  }
};

const handleSendRideRequest = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      rideType,
      estimatedFare,
      driverIds,
      radiusInKm
    } = req.body;

    const userId = req.user?.userId; // Assuming user info is available from auth middleware

    if (!userId) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!pickupLocation || !dropoffLocation) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Pickup and dropoff locations are required",
      });
    }

    const result = await SendRideRequestToDrivers({
      consumerUserId: userId,
      pickupLocation,
      dropoffLocation,
      rideType,
      estimatedFare,
      driverIds,
      radiusInKm
    });

    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error in handleSendRideRequest:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while sending ride request.",
      error: error.message,
    });
  }
};

const handleUpdateCurrentLocation = async (req, res) => {
  try {
    const result = await driverService.UpdateCurrentLocation(req.body);
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result)
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.log("error while update the driver current location", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong",
      error: error?.message
    })
  }
}

const handleCompleteRideByDriver = async (req, res) => {
  try {
    const { driverId, orderId, amount } = req.body;

    if (!driverId || !orderId || !amount) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Driver ID, Order ID, and amount are required"
      });
    }

    const result = await CompleteRideByDriver({
      driverId,
      orderId,
      amount: parseFloat(amount)
    });

    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error in handleCompleteRideByDriver:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while completing the ride",
      error: error.message,
    });
  }
};

const handleResetDailyEarnings = async (req, res) => {
  try {
    const result = await ResetDailyEarnings();

    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error in handleResetDailyEarnings:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while resetting daily earnings",
      error: error.message,
    });
  }
};

const CreateDriverDetails = async (req, res) => {
  try {
    const { name, licenseNumber, userId, phoneNumber, accountHolderName, accountNumber, ifscCode } = req.body;
    if (!name || !licenseNumber || !userId || !phoneNumber) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Name, LicenseNumber, UserId and PhoneNumber are required",
      });
    }

    // Using req.files now since we changed to upload.fields
    if (!req.files || !req.files['licenseDocument'] || !req.files['licenseDocument'][0]) {
      return res.status(400).json({
        success: false,
        message: "License document is required",
      });
    }

    const payload = {
      name,
      licenseNumber,
      userId,
      phoneNumber,
      accountHolderName,
      accountNumber,
      ifscCode,
      licenseDocument: req.files['licenseDocument'][0],
      passbookDocument: req.files['passbookDocument'] ? req.files['passbookDocument'][0] : null,
    };
    const result = await driverService.AddDriverDetails(payload);
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error in CreateDriverDetails:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};

const handleBlockDriver = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "UserId is required"
      });
    }
    const result = await driverService.BlockDriver({ userId });
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error in handleBlockDriver:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const handleUnblockDriver = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "UserId is required"
      });
    }
    const result = await driverService.UnblockDriver({ userId });
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error in handleUnblockDriver:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  handleGetDriverList,
  handleGetDriverDetails,
  handleUpdateDriverKycStatus,
  handleActiveFindingDrivers,
  handleUpdateDriverWorkingStatus,
  handleGetNearbyDrivers,
  handleSendRideRequest,
  handleUpdateCurrentLocation,
  handleCompleteRideByDriver,
  handleResetDailyEarnings,
  CreateDriverDetails,
  handleBlockDriver,
  handleUnblockDriver
};
