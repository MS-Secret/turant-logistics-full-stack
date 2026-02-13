const KYCModel = require("../models/kyc.model");
const GetKycDetails = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: "UserId is required",
      };
    }
    const kycDetails = await KYCModel.findOne({ userId });
    if (!kycDetails) {
      return {
        success: false,
        message: "KYC details not found for the given UserId",
      };
    }
    return {
      success: true,
      message: "KYC details fetched successfully",
      data: kycDetails,
    };
  } catch (error) {
    console.error("Error in GetKycDetails:", error);
    return {
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    };
  }
};

const UpdateKycStatus = async (userId, status) => {
  try {
    console.log(
      `UpdateKycStatus service called with userId: ${userId}, status: ${status}`
    );

    if (!userId) {
      console.log("UserId is required but was not provided");
      return {
        success: false,
        message: "UserId is required",
      };
    }
    if (!status) {
      console.log("Status is required but was not provided");
      return {
        success: false,
        message: "Status is required",
      };
    }

    console.log(`Attempting to update KYC document for userId: ${userId}`);
    const kycDetails = await KYCModel.findOneAndUpdate(
      { userId },
      { status: status },
      { new: true }
    );

    console.log(`KYC update result:`, kycDetails);

    if (!kycDetails) {
      console.log(`No KYC details found for userId: ${userId}`);
      return {
        success: false,
        message: "Failed to update KYC status, no matching KYC record found",
      };
    }

    let driverStatus = "";
    if (status === "pending") {
      driverStatus = "PENDING";
    } else if (status === "approved") {
      driverStatus = "VERIFIED";
    } else if (status === "rejected") {
      driverStatus = "REJECTED";
    } else {
      driverStatus = "NOT_STARTED";
    }

    console.log(
      `Sending update to auth service for userId: ${userId}, driverStatus: ${driverStatus}`
    );
    // FIX: Lazy load driverService to avoid circular dependency
    const driverService = require("./driver.service");
    const updatedData = await driverService.UpdateKycStatus({ userId, status: driverStatus });
    console.log("KYC Auth Service response:", updatedData);

    return {
      success: true,
      message: "KYC status updated successfully",
      data: kycDetails,
    };
  } catch (error) {
    console.error("Error in UpdateKycStatus:", error);
    return {
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    };
  }
};

module.exports = { GetKycDetails, UpdateKycStatus };