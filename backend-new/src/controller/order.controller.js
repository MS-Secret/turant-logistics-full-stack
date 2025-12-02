const httpStatusCode = require("../constants/httpStatusCode");
const OrderService = require("../services/order.service");
const GetAllOrders = async (req, res) => {
  try {
    const { page, limit } = req.query;
    console.log(page, limit);
    const result = await OrderService.getAllOrders({ page, limit });
    console.log(result);
    if (!result?.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};
const GetConsumersOrders = async (req, res) => {
  try {
    const { consumerId } = req.params;
    const { page, limit } = req.query;
    console.log(consumerId, page, limit);
    if (!consumerId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Consumer ID is required",
      });
    }
    const result = await OrderService.getConsumersOrders({
      consumerId,
      page,
      limit,
    });
    console.log("result of consumers order:",result);
    if (!result?.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error fetching consumer orders:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch consumer orders",
      error: error.message,
    });
  }
};

const GetDriversOrders = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { page, limit } = req.query;
    if (!driverId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Driver ID is required",
      });
    }
    const result = await OrderService.getDriversOrders({
      driverId,
      page,
      limit,
    });
    if (!result?.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error fetching driver orders:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch driver orders",
      error: error.message,
    });
  }
};

const GetOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Order ID is required",
      });
    }
    const result = await OrderService.getOrderById({ orderId });
    if (!result?.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch order by ID",
      error: error.message,
    });
  }
};


module.exports = {
  GetAllOrders,
  GetConsumersOrders,
  GetDriversOrders,
  GetOrderById,
};
