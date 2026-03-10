const OrderModel = require("../models/order.model");
const transactionsModel = require("../models/transactions.model");
const User = require("../models/user.model");
const NotificationModel = require("../models/notification.model");
const { sendToMultipleDevices } = require("../config/firebase.config");
const { getUserById } = require("./user.service");
const cashfreeService = require("./cashfree.service");
const { generateAndUploadInvoice } = require("../utils/pdfGenerator");

const sendRideEventNotification = async (userId, title, body, orderId) => {
  try {
    const user = await User.findOne({ userId });
    if (!user) return;

    let fcmTokens = [];
    if (user.metadata && user.metadata.deviceInfo) {
      user.metadata.deviceInfo.forEach(device => {
        if (device.fcmToken) {
          fcmTokens.push(device.fcmToken);
        }
      });
    }

    if (fcmTokens.length > 0) {
      await NotificationModel.create({
        userId,
        title,
        message: body,
        type: "order",
        read: false
      });

      const payload = {
        title,
        body,
        data: {
          type: "order",
          orderId: orderId?.toString() || "",
          timestamp: new Date().toISOString()
        }
      };
      await sendToMultipleDevices(fcmTokens, payload);
      console.log(`Notification sent to User ${userId}: ${title}`);
    }
  } catch (err) {
    console.error("Error sending ride event notification:", err);
  }
};

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
      },
      { new: true }
    );
    if (!updatedOrder) {
      return { success: false, message: "Order not found" };
    }

    try {
      const currentStatus = status || updatedOrder.status || "DRIVER_ACCEPTED";
      if (currentStatus === "DRIVER_ACCEPTED" || currentStatus === "ACCEPTED") {
        const driver = await getUserById(driverId);
        const driverName = driver?.data?.firstName ? `${driver.data.firstName} ${driver.data.lastName || ''}`.trim() : "A driver";

        await sendRideEventNotification(
          updatedOrder.userId,
          "Ride Confirmed! 🏍️",
          `${driverName} is on the way to pick up your order.`,
          orderId
        );
      } else if (currentStatus === "CANCELLED") {
        await sendRideEventNotification(
          updatedOrder.userId,
          "Ride Cancelled ❌",
          "Sorry, the driver had to cancel. We are searching for a new driver immediately.",
          orderId
        );
      }
    } catch (notifErr) {
      console.error("Error sending order status notification:", notifErr);
    }

    // Auto-complete payment for CASH/COD orders when ride is completed
    if (status === "COMPLETED" && (updatedOrder.payment?.method === "CASH" || updatedOrder.payment?.method === "COD")) {
      updatedOrder.payment.status = "COMPLETED";
      updatedOrder.payment.paidAt = new Date();
      await updatedOrder.save();
    }

    // Trigger Wallet Processing if status is 'COMPLETED'
    if (status === "COMPLETED") {
      const walletResult = await require("../services/wallet.service").processOrderPayment(updatedOrder._id);
      if (!walletResult.success) {
        console.error("Wallet processing failed for order:", orderId, walletResult.error);
      }
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

    try {
      const currentStatus = status ? status.toUpperCase() : updatedOrder.status.toUpperCase();
      if (currentStatus === "ARRIVED") {
        await sendRideEventNotification(
          updatedOrder.userId,
          "Driver is Here! 📍",
          `Your driver has arrived! Please share the OTP ${updatedOrder.otp || ''} with them to start.`,
          orderId
        );
      } else if (currentStatus === "STARTED" || currentStatus === "IN_PROGRESS") {
        await sendRideEventNotification(
          updatedOrder.userId,
          "Delivery Started! 🟢",
          "Your delivery is on the way! Track it live.",
          orderId
        );
      } else if (currentStatus === "COMPLETED") {
        await sendRideEventNotification(
          updatedOrder.userId,
          "Delivery Completed! ✅",
          `Your delivery is complete. The final fare is ₹${updatedOrder.estimatedFare || updatedOrder.finalFare || ''}. Thank you for using Turant Logistics!`,
          orderId
        );
      } else if (currentStatus === "CANCELLED") {
        await sendRideEventNotification(
          updatedOrder.userId,
          "Ride Cancelled ❌",
          "We're sorry, your ride has been cancelled.",
          orderId
        );
      }
    } catch (notifErr) {
      console.error("Error sending ride status notification:", notifErr);
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

const SubmitRideRating = async (payload) => {
  try {
    const { orderId, rating, review } = payload;
    if (!orderId || !rating) {
      return { success: false, message: "Order ID and rating are required" };
    }

    const order = await OrderModel.findOne({ orderId });
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    if (order.rating && order.rating.userRating && order.rating.userRating.rating) {
      return { success: false, message: "Order is already rated" };
    }

    // Update Order Model
    if (!order.rating) order.rating = {};
    order.rating.userRating = {
      rating: Number(rating),
      review: review || ""
    };
    await order.save();

    // Update Driver Model
    if (order.driverId) {
      const driver = await require("../models/driver.model").findOne({ userId: order.driverId });
      if (driver) {
        if (!driver.ratings) driver.ratings = { averageRating: 0, totalRatings: 0 };

        const currentTotal = driver.ratings.totalRatings || 0;
        const currentAverage = driver.ratings.averageRating || 0;

        const newTotal = currentTotal + 1;
        const newAverage = ((currentAverage * currentTotal) + Number(rating)) / newTotal;

        driver.ratings.totalRatings = newTotal;
        driver.ratings.averageRating = Math.round(newAverage * 10) / 10;

        await driver.save();
      }

      const userDoc = await User.findOne({ userId: order.driverId });
      if (userDoc) {
        if (!userDoc.ratings) userDoc.ratings = { averageRating: 0, totalRatings: 0 };
        userDoc.ratings.averageRating = driver ? driver.ratings.averageRating : Number(rating);
        userDoc.ratings.totalRatings = driver ? driver.ratings.totalRatings : 1;
        await userDoc.save();
      }
    }

    return {
      success: true,
      message: "Rating submitted successfully",
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const cancelOrderWithRefund = async (orderId) => {
  try {
    const order = await OrderModel.findOne({ orderId });
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    if (order.status === "CANCELLED") {
      return { success: false, message: "Order is already cancelled" };
    }

    // Check if there was an online payment that succeeded
    let refundMessage = "Order cancelled successfully.";
    if (order.paymentDetails?.status === "SUCCESS" && order.paymentDetails?.transaction?.modeOfPayment === "ONLINE") {
      const transactionId = order.paymentDetails.transaction.transactionId;
      const amount = order.paymentDetails.transaction.amount;

      // We need cashfreeOrderId if possible, but transaction model might have it
      const transaction = await transactionsModel.findOne({ transactionId });
      let cashfreeOrderId = transaction?.cashfreeOrderId || orderId; // fallback

      if (amount && amount > 0) {
        const refundResponse = await cashfreeService.createRefund(
          cashfreeOrderId,
          amount,
          `REF_${orderId}_${Date.now()}`
        );

        if (refundResponse.success) {
          order.paymentDetails.status = "REFUND_INITIATED";
          order.refundAmount = amount;
          refundMessage = "Order cancelled and refund initiated successfully.";
        } else {
          console.error("Refund failed:", refundResponse.error);
          refundMessage = "Order cancelled, but refund failed to initiate. Please contact support.";
        }
      }
    }

    order.status = "CANCELLED";
    await order.save();

    return {
      success: true,
      message: refundMessage,
      data: order,
    };
  } catch (error) {
    console.error("Error in cancelOrderWithRefund:", error);
    return {
      success: false,
      message: "Internal server error during cancellation",
      error: error.message,
    };
  }
};

const getOrderInvoice = async (orderId) => {
  try {
    const orderDoc = await OrderModel.findOne({ orderId }).exec();
    if (!orderDoc) {
      return { success: false, message: "Order not found" };
    }

    if (orderDoc.invoiceUrl) {
      return {
        success: true,
        message: "Invoice retrieved successfully",
        data: { invoiceUrl: orderDoc.invoiceUrl }
      };
    }

    // Invoice doesn't exist yet, we generate it
    if (orderDoc.status !== "COMPLETED") {
      // We can still generate it, but ideally it's for completed 
    }

    const { data: orderDetails } = await getOrderById({ orderId });

    if (!orderDetails) {
      return { success: false, message: "Could not fetch full order details for invoice" };
    }

    const newInvoiceUrl = await generateAndUploadInvoice(orderDetails);

    orderDoc.invoiceUrl = newInvoiceUrl;
    await orderDoc.save();

    return {
      success: true,
      message: "Invoice generated successfully",
      data: { invoiceUrl: newInvoiceUrl }
    };
  } catch (error) {
    console.error("Error generating/fetching invoice:", error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const adminForceCancelRide = async (orderId, adminId, reason = "USER_NO_SHOW", io) => {
  try {
    const order = await OrderModel.findOne({ orderId });
    if (!order) {
      return { success: false, message: "Order not found" };
    }

    if (order.status === "CANCELLED" || order.status === "COMPLETED") {
      return { success: false, message: `Order cannot be force cancelled because it is already ${order.status}` };
    }

    const assignedDriverId = order.driverId;

    // Optional: Issue a refund if requested/applicable via cashfree
    let refundMessage = "Admin Force Cancelled.";
    if (order.paymentDetails?.status === "SUCCESS" && order.paymentDetails?.transaction?.modeOfPayment === "ONLINE") {
      const transactionId = order.paymentDetails.transaction.transactionId;
      const amount = order.paymentDetails.transaction.amount;

      const transaction = await transactionsModel.findOne({ transactionId });
      let cashfreeOrderId = transaction?.cashfreeOrderId || orderId;

      if (amount && amount > 0) {
        const refundResponse = await cashfreeService.createRefund(
          cashfreeOrderId,
          amount,
          `ADMIN_REF_${orderId}_${Date.now()}`
        );
        if (refundResponse.success) {
          order.paymentDetails.status = "REFUND_INITIATED";
          order.refundAmount = amount;
          refundMessage = "Admin force cancelled and refund initiated.";
        } else {
          refundMessage = "Admin force cancelled, but online refund failed.";
        }
      }
    }

    // Set order properties
    order.status = "CANCELLED";
    order.cancellationReason = reason;
    order.cancelledBy = adminId || "ADMIN";

    await order.save();

    // Reset Driver availability if there was a driver assigned
    if (assignedDriverId) {
      const driver = await require("../models/driver.model").findOne({ userId: assignedDriverId });
      if (driver) {
        driver.workingStatus = "ONLINE";
        await driver.save();
      }

      // Emit socket event to instantly clear the active ride on the driver app
      if (io) {
        io.to(`user_${assignedDriverId}`).emit("ride_cancelled_by_admin", {
          orderId,
          message: "The support team has cancelled your current ride. You are now free to accept new orders."
        });
      }

      // Notify Driver about Admin cancellation via FCM
      await sendRideEventNotification(
        assignedDriverId,
        "Ride Cancelled by Admin 🛠️",
        "The support team has cancelled your current ride. You are now available for new orders.",
        orderId
      );
    }

    // Notify Customer about Admin cancellation
    if (order.userId) {
      await sendRideEventNotification(
        order.userId,
        "Ride Cancelled by Support 📞",
        "Your ride was cancelled by our support team because the driver could not reach you at the pickup location.",
        orderId
      );
    }

    return {
      success: true,
      message: refundMessage,
      data: order,
    };
  } catch (error) {
    console.error("Error in adminForceCancelRide:", error);
    return {
      success: false,
      message: "Internal server error during admin force cancellation",
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
  SubmitRideRating,
  cancelOrderWithRefund,
  getOrderInvoice,
  adminForceCancelRide,
};
