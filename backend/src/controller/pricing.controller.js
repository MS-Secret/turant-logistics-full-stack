const { plugin } = require("mongoose");
const httpStatusCode = require("../constants/httpStatusCode");
const PricingService = require("../services/pricing.service");

const CreatePricing = async (req, res) => {
  try {
    const {
      vehicleType,
      vehicleName,
      vehicleBodyDetails,
      vehicleBodyType,
      vehicleFuelType,
      minOrderFare,
      distanceSlabs,
      weightSlabs,
      platformSurchargePercentage,
      discountPercentage,
      waitingChargePerMin,
      freeWaitingMinutes,
      returnTripFeePercentage,
      nightSurchargeAmount,
      codHandlingFee,
      loadingCharge,
      offloadingCharge,
      extraHandsCharge,
    } = req.body;

    // Basic validation
    if (!vehicleType || !vehicleName || minOrderFare == null) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Missing required fields",
      });
    }
    if (req.file) {
      var vehicleImageUrl = req.file;
    }

    // Parse JSON strings for slabs
    let parsedDistanceSlabs = [];
    let parsedWeightSlabs = [];

    try {
      if (distanceSlabs) {
        parsedDistanceSlabs = typeof distanceSlabs === 'string'
          ? JSON.parse(distanceSlabs)
          : distanceSlabs;
      }
    } catch (error) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid distanceSlabs JSON format",
        error: error.message,
      });
    }

    try {
      if (weightSlabs) {
        parsedWeightSlabs = typeof weightSlabs === 'string'
          ? JSON.parse(weightSlabs)
          : weightSlabs;
      }
    } catch (error) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid weightSlabs JSON format",
        error: error.message,
      });
    }

    const payload = {
      vehicleType,
      vehicleName,
      vehicleImageUrl,
      vehicleBodyDetails: vehicleBodyDetails
        ? JSON.parse(vehicleBodyDetails)
        : {},
      vehicleBodyType,
      vehicleFuelType,
      minOrderFare,
      distanceSlabs: parsedDistanceSlabs,
      weightSlabs: parsedWeightSlabs,
      platformSurchargePercentage,
      discountPercentage,
      waitingChargePerMin,
      freeWaitingMinutes,
      returnTripFeePercentage,
      nightSurchargeAmount,
      codHandlingFee,
      loadingCharge,
      offloadingCharge,
      extraHandsCharge,
    };


    const result = await PricingService.CreatePricing(payload);

    if (result.success) {
      return res.status(httpStatusCode.CREATED).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error creating pricing controller catch:", error);
    res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const GetPricingAll = async (req, res) => {
  try {
    const result = await PricingService.GetPricingAll();
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error fetching pricings:", error);
    res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const GetPricingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Pricing ID is required",
      });
    }
    const result = await PricingService.GetPricingById(id);
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const DeletePricingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Pricing ID is required",
      });
    }
    const result = await PricingService.DeletePricingById(id);
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error deleting pricing:", error);
    res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const CalculateFare = async (req, res) => {
  try {
    const payload = req.body;
    const result = await PricingService.CalculateFare(payload);

    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }

    return res.status(httpStatusCode.OK).json(result);

  } catch (error) {
    console.error("Error calculating fare:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const GetFareEstimate = async (req, res) => {
  try {
    const payload = req.body;
    const result = await PricingService.GetFareEstimate(payload);

    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }

    return res.status(httpStatusCode.OK).json(result);

  } catch (error) {
    console.error("Error estimating fare:", error);
    res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const CalculateFareAllVehiclesSuggestions = async (req, res) => {
  try {
    const payload = req.body;
    const result = await PricingService.CalculateFareAllVehiclesSuggestions(payload);

    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }

    return res.status(httpStatusCode.OK).json(result);

  } catch (error) {
    console.error("Error in calculateFareAllVehicles:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

const UpdatePricing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Pricing ID is required",
      });
    }

    const {
      vehicleType,
      vehicleName,
      vehicleBodyDetails,
      vehicleBodyType,
      vehicleFuelType,
      minOrderFare,
      distanceSlabs,
      weightSlabs,
      platformSurchargePercentage,
      discountPercentage,
      waitingChargePerMin,
      freeWaitingMinutes,
      returnTripFeePercentage,
      nightSurchargeAmount,
      codHandlingFee,
      loadingCharge,
      offloadingCharge,
      extraHandsCharge,
      isActive,
    } = req.body;

    let vehicleImageUrl = "";
    if (req.file) {
      vehicleImageUrl = req.file;
    }

    // Parse JSON strings for slabs
    let parsedDistanceSlabs = [];
    let parsedWeightSlabs = [];

    try {
      if (distanceSlabs) {
        parsedDistanceSlabs =
          typeof distanceSlabs === "string"
            ? JSON.parse(distanceSlabs)
            : distanceSlabs;
      }
    } catch (error) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid distanceSlabs JSON format",
        error: error.message,
      });
    }

    try {
      if (weightSlabs) {
        parsedWeightSlabs =
          typeof weightSlabs === "string"
            ? JSON.parse(weightSlabs)
            : weightSlabs;
      }
    } catch (error) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid weightSlabs JSON format",
        error: error.message,
      });
    }

    const payload = {
      vehicleType,
      vehicleName,
      vehicleImageUrl, // will be handled by service
      vehicleBodyDetails:
        vehicleBodyDetails && typeof vehicleBodyDetails === "string"
          ? JSON.parse(vehicleBodyDetails)
          : vehicleBodyDetails,
      vehicleBodyType,
      vehicleFuelType,
      minOrderFare,
      distanceSlabs: parsedDistanceSlabs,
      weightSlabs: parsedWeightSlabs,
      platformSurchargePercentage,
      discountPercentage,
      waitingChargePerMin,
      freeWaitingMinutes,
      returnTripFeePercentage,
      nightSurchargeAmount,
      codHandlingFee,
      loadingCharge,
      offloadingCharge,
      extraHandsCharge,
      isActive,
    };

    const result = await PricingService.UpdatePricing(id, payload);

    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
  } catch (error) {
    console.error("Error updating pricing controller:", error);
    res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  CreatePricing,
  GetPricingAll,
  GetPricingById,
  DeletePricingById,
  CalculateFare,
  GetFareEstimate,
  CalculateFareAllVehiclesSuggestions,
  UpdatePricing,
};
