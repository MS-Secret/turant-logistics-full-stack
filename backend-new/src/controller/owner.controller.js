const httpStatusCode = require("../constants/httpStatusCode");
const ownerService = require("../services/owner.service");

const CreateOwner = async (req, res) => {
   console.log("Request body:", req.body);
  try {
    const { name, userId } = req.body;
    console.log("Request body:", req.body);
    console.log("Uploaded files:", req.files);
    if (!name || !userId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Name and UserId are required",
        timestamp: new Date().toISOString()
      });
    }

    // Initialize payload with basic info
    let payload = { 
      name, 
      userId,
      documents: {}
    };

    // Process uploaded files
    if (req.files) {
      // Expected file fields
      const expectedFields = ['aadharFront', 'aadharBack', 'panCard', 'ownerPhoto'];
      
      // Process each expected field
      expectedFields.forEach(fieldName => {
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          payload.documents[fieldName] =file;
        }
      });
    }

    const result = await ownerService.CreateOwner(payload);
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        ...result,
        timestamp: new Date().toISOString()
      });
    }
    return res.status(httpStatusCode.OK).json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in CreateOwner:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};



module.exports = { CreateOwner };
