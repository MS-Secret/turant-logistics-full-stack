const httpStatusCode = require("../constants/httpStatusCode");
const vehicleService = require("../services/vehicle.service");
const CreateVehicleDetails = async (req, res) => {
  try {
    const {
      vehicleNumber,
      userId,
      operationCity,
      vehicleType,
      vehicleBodyDetails,
      vehicleBodyType,
      vehicleFuelType,
    } = req.body;
    if (!vehicleNumber || !userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "VehicleNumber and UserId are required",
        timestamp: new Date().toISOString(),
      });
    }

    // Initialize payload with basic info
    let payload = {
      vehicleNumber,
      userId,
      operationCity,
      vehicleType: vehicleType || "truck",
      vehicleBodyDetails: vehicleBodyDetails
        ? JSON.parse(vehicleBodyDetails)
        : {},
      vehicleBodyType,
      vehicleFuelType,
      vehicleRC: req?.files?.['vehicleRC']?.[0],
      vehiclePhoto: req?.files?.['vehicleImageDocument']?.[0],
    };

    const result = await vehicleService.AddVehicleDetails(payload);
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(httpStatusCode.OK).json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in CreateVehicleOwner:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};

module.exports = { CreateVehicleDetails };
