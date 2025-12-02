const httpStatusCode = require("../constants/httpStatusCode");
const kycService = require("../services/kyc.service");
const GetKycDetails = async (req, res) => {
  try {
    console.log("Params in controller:", req.params);
    const { userId } = req.params;
    if (!userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "UserId is required",
        timestamp: new Date().toISOString(),
      });
    }

    const result = await kycService.GetKycDetails(userId);
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error in GetKycDetails:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};

const UpdateKycStatus = async (req, res) => {
  try{
    console.log("UpdateKycStatus controller called");
    console.log("Params in controller:", req.params);
    console.log("Body in controller:", req.body);
    
    const { userId } = req.params;
    const { status } = req.body;

    console.log(`Processing UpdateKycStatus for userId: ${userId}, status: ${status}`);

    if (!userId) {
      console.log("UserId is missing in request parameters");
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "UserId is required",
        timestamp: new Date().toISOString(),
      });
    }
    if (!status) {
      console.log("Status is missing in request body");
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Status is required",
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Calling kycService.UpdateKycStatus with userId: ${userId}, status: ${status}`);
    const result = await kycService.UpdateKycStatus(userId, status);
    console.log("UpdateKycStatus service result:", result);
    
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  }catch(error){
    console.error("Error in UpdateKycStatus:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
}


module.exports = { GetKycDetails, UpdateKycStatus };