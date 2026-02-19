const OrderModel = require("../models/order.model");
const transactionsModel = require("../models/transactions.model");
const { getUserById } = require("./user.service");

const getAllOrders = async (payload) => {
  try {
    const { page, limit } = payload;
    if (!page || !limit) {
      return { success: false, message: "Page and limit are required" };
    }
    const orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    console.log(orders);
    if (!orders) {
      return { success: false, message: "No orders found" };
    }
    const totalOrders = await OrderModel.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);
    const currentPage = page;
    const isNextPage = currentPage < totalPages;
    const isPrevPage = currentPage > 1;
    return {
      success: true,
      message: "Orders fetched successfully",
      data: {
        orders,
        pagination: {
          totalOrders,
          totalPages,
          currentPage,
          isNextPage,
          isPrevPage,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const getConsumersOrders = async (payload) => {
  try {
    const { consumerId, page, limit } = payload;
    if (!consumerId) {
      return { success: false, message: "Consumer ID is required" };
    }
    if (!page || !limit) {
      return { success: false, message: "Page and limit are required" };
    }
    const orders = await OrderModel.find({ userId: consumerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    if (!orders) {
      return { success: false, message: "No orders found for this consumer" };
    }
    console.log(orders);
    const totalOrders = await OrderModel.countDocuments({ userId: consumerId });
    const totalPages = Math.ceil(totalOrders / limit);
    const currentPage = page;
    const isNextPage = currentPage < totalPages;
    const isPrevPage = currentPage > 1;
    return {
      success: true,
      message: "Consumer orders fetched successfully",
      data: {
        orders,
        pagination: {
          totalOrders,
          totalPages,
          currentPage,
          isNextPage,
          isPrevPage,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching consumer orders:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const getDriversOrders = async (payload) => {
  try {
    const { driverId, page, limit } = payload;
    if (!driverId) {
      return { success: false, message: "Driver ID is required" };
    }
    if (!page || !limit) {
      return { success: false, message: "Page and limit are required" };
    }
    const orders = await OrderModel.find({ driverId: driverId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    if (!orders || orders.length === 0) {
      return { success: false, message: "No orders found for this driver" };
    }
    const totalOrders = await OrderModel.countDocuments({ driverId });
    const totalPages = Math.ceil(totalOrders / limit);
    const currentPage = page;
    const isNextPage = currentPage < totalPages;
    const isPrevPage = currentPage > 1;
    console.log("total orders:", totalOrders);
    return {
      success: true,
      message: "Driver orders fetched successfully",
      data: {
        orders,
        pagination: {
          totalOrders,
          totalPages,
          currentPage,
          isNextPage,
          isPrevPage,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching driver orders:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const getOrderById = async (payload) => {
  try {
    const { orderId } = payload;
    if (!orderId) {
      return { success: false, message: "Order ID is required" };
    }

    const order = await OrderModel.findOne({ orderId: orderId }).exec();
    if (!order) {
      return { success: false, message: "Order not found" };
    }



    // Wait for all details with timeout
    let customerDetails = null;
    let driverDetails = null;

    if (order.userId) {
      const userData = await getUserById(order.userId);
      customerDetails = userData?.data;
    }

    if (order.driverId) {
      const userData = await getUserById(order?.driverId);
      driverDetails = userData?.data;
    }

    return {
      success: true,
      message: "Order fetched successfully",
      data: {
        ...order.toObject(),
        driverDetails,
        customerDetails,
      },
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const UpdateOrderDetails = async (payload) => {
  try {
    const { orderId, updateData } = payload;
    if (!orderId) {
      return { success: false, message: "Order ID is required" };
    }
    if (!updateData || Object.keys(updateData).length === 0) {
      return { success: false, message: "Update data is required" };
    }
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).exec();
    if (!updatedOrder) {
      return { success: false, message: "Order not found" };
    }
    return {
      success: true,
      message: "Order updated successfully",
      data: updatedOrder,
    };
  } catch (error) {
    console.error("Error updating order details:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const UpdateOrderStatusWithDriver = async (payload) => {
  try {
    const { orderId, status, driverId } = payload;
    console.log("Updating order status with driver:", payload);
    if (!orderId) {
      return { success: false, message: "Order ID is required" };
    }
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { orderId: orderId },
      {
        status: status || "DRIVER_ACCEPTED",
        driverId: driverId,
      }
    );
    if (!updatedOrder) {
      return { success: false, message: "Order not found" };
    }

    return {
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    };
  } catch (error) {
    console.error("Error updating order status with driver:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const UpdateThePaymentOrderStatus = async (payload) => {
  try {
    const { orderId, paymentStatus } = payload;
    if (!orderId) {
      return { success: false, message: "Order ID is required" };
    }
    if (!paymentStatus) {
      return { success: false, message: "Payment status is required" };
    }
    const order = await OrderModel.findOne({ orderId: orderId });
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    order.payment.status = paymentStatus || "COMPLETED";
    order.payment.updatedAt = new Date();
    order.payment.paidAt = new Date();
    await order.save();

    const transaction = await transactionsModel.findOne({ orderId: orderId });
    if (transaction) {
      transaction.status = paymentStatus || "COMPLETED";
      transaction.updatedAt = new Date();
      transaction.receiver = order.driverId || null;
      await transaction.save();
    }
    return {
      success: true,
      message: "Payment order status updated successfully",
      data: order,
    };
  } catch (error) {
    console.error("Error updating payment order status:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const updateRideStatusByOrderId = async (payload) => {
  try {
    const { orderId, status, updateData } = payload;
    if (!orderId) {
      return { success: false, message: "Order ID is required" };
    }

    const query = { orderId: orderId };
    const update = {
      ...updateData,
      ...(status && { status })
    };

    const updatedOrder = await OrderModel.findOneAndUpdate(
      query,
      update,
      { new: true }
    ).exec();

    if (!updatedOrder) {
      return { success: false, message: "Order not found" };
    }

    // Trigger Wallet Processing if status is 'COMPLETED'
    if (status === "COMPLETED") {
      const walletResult = await require("../services/wallet.service").processOrderPayment(updatedOrder._id);
      if (!walletResult.success) {
        console.error("Wallet processing failed for order:", orderId, walletResult.error);
        // Optional: You might want to flag this error, but don't fail the HTTP response for the status update
      }
    }

    return {
      success: true,
      message: "Order updated successfully",
      data: updatedOrder,
    };
  } catch (error) {
    console.error("Error updating ride status:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

module.exports = {
  getAllOrders,
  getConsumersOrders,
  getDriversOrders,
  getOrderById,
  UpdateOrderDetails,
  UpdateOrderStatusWithDriver,
  UpdateThePaymentOrderStatus,
  updateRideStatusByOrderId,
};
