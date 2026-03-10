const cloudinary = require("../config/cloudinaryConfig");
const pricingModel = require("../models/pricing.model");
const {
  isCheckNightTime,
  calculateDistanceFare,
  calculateWeightFare,
} = require("../utils/orderHelper");

const CreatePricing = async (payload) => {
  try {
    const {
      vehicleType,
      vehicleName,
      vehicleImageUrl,
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
    } = payload;

    // Basic validation
    if (!vehicleType || !vehicleName || minOrderFare == null) {
      return {
        success: false,
        message: "Missing required fields",
      };
    }

    let vehicleImageFileUrl = "";
    if (vehicleImageUrl) {
      vehicleImageFileUrl = await cloudinary.UploadToCloudinary(
        vehicleImageUrl,
        "vehicleImages"
      );
    }
    const pricingData = await pricingModel.create({
      vehicleType,
      vehicleName,
      vehicleImageUrl: vehicleImageFileUrl,
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
    });
    if (!pricingData) {
      return {
        success: false,
        message: "Failed to create pricing",
      };
    }
    return {
      success: true,
      message: "Pricing created successfully",
      data: pricingData,
    };
  } catch (error) {
    console.error("Error creating pricing:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const UpdatePricing = async (id, payload) => {
  try {
    const {
      vehicleType,
      vehicleName,
      vehicleImageUrl,
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
    } = payload;

    let updateData = {
      vehicleType,
      vehicleName,
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
    };

    if (isActive !== undefined) updateData.isActive = isActive;

    if (vehicleBodyDetails) {
      updateData.vehicleBodyDetails = vehicleBodyDetails;
    }

    if (vehicleImageUrl) {
      const vehicleImageFileUrl = await cloudinary.UploadToCloudinary(
        vehicleImageUrl,
        "vehicleImages"
      );
      updateData.vehicleImageUrl = vehicleImageFileUrl;
    }

    const pricingData = await pricingModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!pricingData) {
      return {
        success: false,
        message: "Pricing not found or failed to update",
      };
    }

    return {
      success: true,
      message: "Pricing updated successfully",
      data: pricingData,
    };
  } catch (error) {
    console.error("Error updating pricing:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const GetPricingAll = async () => {
  try {
    const pricingData = await pricingModel.find({ isDelete: false });
    if (!pricingData) {
      return {
        success: false,
        message: "No pricing data found",
      };
    }
    return {
      success: true,
      message: "Pricing data fetched successfully",
      data: pricingData,
    };
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const GetPricingById = async (id) => {
  try {
    const pricingData = await pricingModel.findById(id);
    if (!pricingData) {
      return {
        success: false,
        message: "No pricing data found for the given ID",
      };
    }
    return {
      success: true,
      message: "Pricing data fetched successfully",
      data: pricingData,
    };
  } catch (error) {
    console.error("Error fetching pricing by ID:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const DeletePricingById = async (id) => {
  try {
    const pricingData = await pricingModel.findByIdAndUpdate(
      id,
      { isDelete: true },
      { new: true }
    );
    if (!pricingData) {
      return {
        success: false,
        message: "No pricing data found for the given ID",
      };
    }
    return {
      success: true,
      message: "Pricing data deleted successfully",
      data: pricingData,
    };
  } catch (error) {
    console.error("Error deleting pricing by ID:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const CalculateFare = async (payload) => {
  try {
    const {
      distance,
      weight,
      vehicleType,
      vehicleId,
      waitTimeMinutes = 0,
      isReturnTrip = false,
      isNightTime = null, // if null, will auto-detect based on current time
      isCOD = false,
      needExtraHands = false,
      promoCode = null,
      discountAmount = 0, // flat discount amount if any
      orderDateTime = new Date(), // for night time calculation
    } = payload;

    // Auto-detect night time if not explicitly provided
    const nightTime =
      isNightTime !== null ? isNightTime : isCheckNightTime(orderDateTime);

    // Validate required fields
    if (distance == null || weight == null || !vehicleType || !vehicleId) {
      return {
        success: false,
        message:
          "Missing required fields: distance, weight, vehicleType, vehicleId",
      };
    }

    // Get pricing data
    let pricingData = await pricingModel.findOne({
      _id: vehicleId,
      vehicleType,
      isActive: true,
      isDelete: false,
    });

    if (!pricingData) {
      console.warn(`[Pricing Service] No pricing data found for vehicleId: ${vehicleId}, vehicleType: ${vehicleType}. Using default fallbacks.`);
      // Fallback to default rates if vehicle configuration is missing
      pricingData = {
        minOrderFare: 49,
        distanceSlabs: [{ minDistance: 0, farePerKm: 10 }],
        weightSlabs: [{ minWeight: 0, farePerKg: 0 }],
        platformSurchargePercentage: 12,
        freeWaitingMinutes: 5,
        waitingChargePerMin: 2,
        discountPercentage: 0,
        nightSurchargeAmount: 15,
        codHandlingFee: 10,
        loadingCharge: 0,
        offloadingCharge: 0,
        extraHandsCharge: 0,
        returnTripFeePercentage: 70
      };
    }

    // STEP 1: Calculate Base Order Fare
    let baseFare = 0;

    // Calculate distance-based fare using helper function
    const distanceFare = calculateDistanceFare(
      distance,
      pricingData.distanceSlabs
    );

    if (distanceFare === -1) {
      return {
        success: false,
        message: "Distance exceeds the serviceable range for this vehicle.",
      };
    }

    // Calculate weight-based fare using helper function
    const weightFare = calculateWeightFare(weight, pricingData.weightSlabs);

    // Calculate Order Fare = Max(Min Order Fare, Base Fare + Distance Fare + Weight Fare)
    const calculatedFare = baseFare + distanceFare + weightFare;
    let orderFare = Math.max(pricingData.minOrderFare, calculatedFare);

    // STEP 2: Add Platform Surcharge (12% or configured %)
    const platformSurcharge =
      orderFare * (pricingData.platformSurchargePercentage / 100);

    // STEP 3: Apply Discount (based on active promo or flat discount)
    let discount = 0;
    if (discountAmount > 0) {
      discount = discountAmount; // Flat discount
    } else if (pricingData.discountPercentage > 0) {
      discount = orderFare * (pricingData.discountPercentage / 100); // Percentage discount
    }

    // STEP 4: Add Waiting Charge (₹2 × (Wait Minutes - 5))
    let waitingCharge = 0;
    if (waitTimeMinutes > pricingData.freeWaitingMinutes) {
      const chargableWaitTime =
        waitTimeMinutes - pricingData.freeWaitingMinutes;
      waitingCharge = chargableWaitTime * pricingData.waitingChargePerMin;
    }

    // STEP 5: Add Optional Charges
    let optionalCharges = 0;

    // Return Trip Fee (70% of base fare)
    if (isReturnTrip && pricingData.returnTripFeePercentage > 0) {
      optionalCharges +=
        orderFare * (pricingData.returnTripFeePercentage / 100);
    }

    // Night Surcharge (Flat Amount)
    if (nightTime && pricingData.nightSurchargeAmount > 0) {
      optionalCharges += pricingData.nightSurchargeAmount;
    }

    // COD Handling Fee
    if (isCOD && pricingData.codHandlingFee > 0) {
      optionalCharges += pricingData.codHandlingFee;
    }

    // Extra Hands Charge
    if (needExtraHands && pricingData.extraHandsCharge > 0) {
      optionalCharges += pricingData.extraHandsCharge;
    }

    // Loading/Offloading charges
    optionalCharges +=
      (pricingData.loadingCharge || 0) + (pricingData.offloadingCharge || 0);

    // STEP 6: Calculate Total Fare
    let totalFare =
      orderFare +
      platformSurcharge +
      waitingCharge +
      optionalCharges -
      discount;

    // STEP 7: Round Total Fare to nearest ₹1
    const finalFare = Math.round(totalFare);

    // Prepare breakdown for transparency
    const fareBreakdown = {
      orderFare: Math.round(orderFare),
      distanceFare: Math.round(distanceFare),
      weightFare: Math.round(weightFare),
      platformSurcharge: Math.round(platformSurcharge),
      waitingCharge: Math.round(waitingCharge),
      discount: Math.round(discount),
      optionalCharges: {
        returnTripFee: isReturnTrip
          ? Math.round(orderFare * (pricingData.returnTripFeePercentage / 100))
          : 0,
        nightSurcharge: nightTime ? (pricingData.nightSurchargeAmount || 0) : 0,
        codHandlingFee: isCOD ? pricingData.codHandlingFee : 0,
        extraHandsCharge: needExtraHands ? pricingData.extraHandsCharge : 0,
        loadingCharge: pricingData.loadingCharge || 0,
        offloadingCharge: pricingData.offloadingCharge || 0,
        total: Math.round(optionalCharges),
      },
      totalBeforeRounding: totalFare,
      finalFare: finalFare,
    };

    return {
      success: true,
      message: "Fare calculated successfully",
      data: {
        finalFare,
        breakdown: fareBreakdown,
        vehicleInfo: {
          vehicleType: pricingData.vehicleType,
          vehicleName: pricingData.vehicleName,
          vehicleId: pricingData._id,
        },
      },
    };
  } catch (error) {
    console.error("Error calculating fare:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

// Quick fare estimation function (basic calculation without all optional charges)
const GetFareEstimate = async (payload) => {
  try {
    const { distance, weight, vehicleType, vehicleId } = payload;

    if (distance == null || weight == null || !vehicleType || !vehicleId) {
      return {
        success: false,
        message: "Missing required fields for fare estimation",
      };
    }

    const pricingData = await pricingModel.findOne({
      _id: vehicleId,
      vehicleType,
      isActive: true,
      isDelete: false,
    });

    if (!pricingData) {
      return {
        success: false,
        message: "No pricing data found for the given vehicle",
      };
    }

    // Basic calculation
    const distanceFare = calculateDistanceFare(
      distance,
      pricingData.distanceSlabs
    );

    if (distanceFare === -1) {
      return {
        success: false,
        message: "Distance exceeds the serviceable range for this vehicle.",
      };
    }
    const weightFare = calculateWeightFare(weight, pricingData.weightSlabs);
    const orderFare = Math.max(
      pricingData.minOrderFare,
      distanceFare + weightFare
    );
    const platformSurcharge =
      orderFare * (pricingData.platformSurchargePercentage / 100);
    const estimatedFare = Math.round(orderFare + platformSurcharge);

    return {
      success: true,
      message: "Fare estimated successfully",
      data: {
        estimatedFare,
        breakdown: {
          minOrderFare: pricingData.minOrderFare,
          distanceFare: Math.round(distanceFare),
          weightFare: Math.round(weightFare),
          orderFare: Math.round(orderFare),
          platformSurcharge: Math.round(platformSurcharge),
        },
        note: "This is a basic estimate. Actual fare may vary based on waiting time, night charges, and other optional services.",
      },
    };
  } catch (error) {
    console.error("Error estimating fare:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const CalculateFareAllVehiclesSuggestions = async (payload) => {
  try {
    console.log("payload:", payload);
    const {
      distance,
      weight,
      waitTimeMinutes = 0,
      isReturnTrip = false,
      isCOD = false,
      needExtraHands = false,
      promoCode = null,
      discountAmount = 0,
      orderDateTime = new Date(),
    } = payload;

    if (distance == null || weight == null) {
      return {
        success: false,
        message: "Missing required fields: distance, weight",
      };
    }

    // Fetch all active pricing data
    const activePricing = await pricingModel.find({
      isActive: true,
      isDelete: false,
    });

    if (!activePricing || activePricing.length === 0) {
      return {
        success: false,
        message: "No active pricing data found",
      };
    }

    // Calculate fare for each vehicle
    const fareSuggestions = activePricing.map((pricingData) => {
      const distanceFare = calculateDistanceFare(
        distance,
        pricingData.distanceSlabs
      );

      if (distanceFare === -1) {
        return null; // Vehicle does not support this distance
      }

      const weightFare = calculateWeightFare(weight, pricingData.weightSlabs);
      const orderFare = Math.max(
        pricingData.minOrderFare,
        distanceFare + weightFare
      );
      const platformSurcharge =
        orderFare * (pricingData.platformSurchargePercentage / 100);
      const estimatedFare = Math.round(orderFare + platformSurcharge);

      return {
        vehicleId: pricingData._id,
        vehicleType: pricingData.vehicleType,
        vehicleName: pricingData.vehicleName,
        vehicleBodyType: pricingData.vehicleBodyType,
        vehicleFuelType: pricingData.vehicleFuelType,
        vehicleImageUrl: pricingData.vehicleImageUrl,
        estimatedFare,
      };
    }).filter(Boolean); // Remove null entries where distance exceeded limits

    return {
      success: true,
      message: "Fare suggestions calculated successfully",
      data: fareSuggestions,
    };
  } catch (error) {
    console.error("Error calculating fare suggestions:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const PricingService = {
  CreatePricing,
  GetPricingAll,
  GetPricingById,
  DeletePricingById,
  CalculateFare,
  UpdatePricing,
  GetFareEstimate,
  CalculateFareAllVehiclesSuggestions,
};

module.exports = PricingService;
