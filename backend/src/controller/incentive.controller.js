const incentiveService = require("../services/incentive.service");
const httpStatusCode = require("../constants/httpStatusCode");
 
//Incentive stats for driver
const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await incentiveService.getDriverIncentiveStats(userId);
    
    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "Incentive stats retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("Error in getStats controller:", error);
    return res.status(httpStatusCode.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

// Manual apply refcode
const applyReferral = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { referralCode } = req.body;
    
    if (!referralCode) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Referral code is required"
      });
    }

    await incentiveService.applyReferralCode(userId, referralCode);

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "Referral code applied successfully"
    });
  } catch (error) {
    console.error("Error in applyReferral controller:", error);
    return res.status(httpStatusCode.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getStats,
  applyReferral
};
