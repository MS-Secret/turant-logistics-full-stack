const httpStatusCode = require("../constants/httpStatusCode");
const TransactionService = require("../services/transaction.service");
const createPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    console.log("Received payment creation request:", paymentData);
    const result = await TransactionService.CreateTransaction(paymentData);
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const verificationData = req.body;
    const result = await TransactionService.VerifyTransaction(verificationData);
    if (!result.success) {
        return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getAllTransactions = async (req, res) => {
  try{
    const { page, limit } = req.query;
    const result = await TransactionService.getAllTransactions({ page: parseInt(page), limit: parseInt(limit) });
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  }catch(error){
    console.log(error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getConsumersTransactions = async (req, res) => {
  try{
    const { consumerId } = req.params;
    const { page, limit } = req.query;
    const result = await TransactionService.getConsumersTransactions({ consumerId, page: parseInt(page), limit: parseInt(limit) });
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  }catch(error){
    console.log(error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getDriversTransactions = async (req, res) => {
  try{
    const { driverId } = req.params;
    const { page, limit } = req.query;
    const result = await TransactionService.getDriversTransactions({ driverId, page: parseInt(page), limit: parseInt(limit) });
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  }catch(error){
    console.log(error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getTransactionsById = async (req, res) => {
  try{
    console.log("getTransactionsById called with params:", req.params);
    const { transactionId } = req.params;
    const result = await TransactionService.getTransactionsById(transactionId);
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  }catch(error){
    console.log(error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


module.exports = { 
  createPayment, 
  verifyPayment, 
  getAllTransactions,
  getConsumersTransactions,
  getDriversTransactions,
  getTransactionsById
};
