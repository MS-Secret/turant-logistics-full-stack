const  cloudinary = require("../config/cloudinaryConfig");
const KYCModel = require("../models/kyc.model");
const AddVehicleDetails = async (payload) => {
  try {
    console.log("Payload in service:", payload);
    const {
      vehicleNumber,
      userId,
      operationCity,
      vehicleType,
      vehicleBodyDetails,
      vehicleBodyType,
      vehicleFuelType,
      VehicleRc,
    } = payload;

    if (!vehicleNumber || !userId) {
      return {
        success: false,
        message: "VehicleNumber and UserId are required",
      };
    }
    let vehicleRCImgUrl = await cloudinary.UploadToCloudinary(
      VehicleRc,
      "vehicleRC"
    );
    const KYCApplication = await KYCModel.findOneAndUpdate(
      { userId },
      {
        vehicle: {
          vehicleNumber,
          vehicleRCImgUrl,
          operationCity,
          vehicleType: vehicleType || "truck",
          vehicleBodyDetails: {
            ...vehicleBodyDetails,
          },
          vehicleBodyType,
          vehicleFuelType,
        },
        stepCompleted: 2,
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
      message: "Vehicle details added successfully",
      data: KYCApplication,
    };
  } catch (error) {
    console.error("Error in AddVehicleDetails:", error);
    return {
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    };
  }
};

module.exports = {
  AddVehicleDetails,
};
