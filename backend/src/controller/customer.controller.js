const httpStatusCode = require("../constants/httpStatusCode");
const consumerService = require("../services/customer.service");
const handleGetConsumerList = async (req, res) => {
  try {
    console.log("handleGetConsumerList called");
    const { page = 1, limit = 10, search = "" } = req.query;

    const result = await consumerService.GetCustomerList({
      page,
      limit,
      search,
    });
    console.log("customer data:", result);
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.NOT_FOUND).json(result);
    }
  } catch (error) {
    console.error("Error in handleGetConsumerList:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};

const handleGetConsumerDetails = async (req, res) => {
  try {
    const {consumerId}=req.params;
    if(!consumerId){
        return res.status(httpStatusCode.BAD_REQUEST).json({
            success:false,
            message:"Consumer Id not found"
        })
    }

    const result=await consumerService.GetCustomerDetails({
        consumerId
    })
    console.log("consumer details:",result);
    if (result.success) {
      return res.status(httpStatusCode.OK).json(result);
    } else {
      return res.status(httpStatusCode.NOT_FOUND).json(result);
    }
  } catch (error) {
    console.log("Error while getting the consumer details:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    });
  }
};

module.exports = {
  handleGetConsumerList,
  handleGetConsumerDetails
};
