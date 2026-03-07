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
    console.log("result of consumers order:", result);
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


const RateRide = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;

    if (!orderId || !rating) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Order ID and rating are required",
      });
    }

    const result = await OrderService.SubmitRideRating({
      orderId,
      rating,
      review,
    });

    if (!result?.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error rating ride:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to submit rating",
      error: error.message,
    });
  }
};

const CancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const result = await OrderService.cancelOrderWithRefund(orderId);

    if (!result?.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

const GetOrderInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const result = await OrderService.getOrderInvoice(orderId);
    if (!result?.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error("Error fetching order invoice:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch order invoice",
      error: error.message,
    });
  }
};

const AdminForceCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    // In a real app, you would exact adminId from req.user
    const adminId = req.user ? req.user.id : "ADMIN";

    if (!orderId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const io = req.app.get("io");
    const result = await OrderService.adminForceCancelRide(orderId, adminId, reason, io);

    if (!result?.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }
    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Error in AdminForceCancelOrder:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to force cancel order",
      error: error.message,
    });
  }
};

module.exports = {
  GetAllOrders,
  GetConsumersOrders,
  GetDriversOrders,
  GetOrderById,
  RateRide,
  CancelOrder,
  GetOrderInvoice,
  AdminForceCancelOrder,
};
