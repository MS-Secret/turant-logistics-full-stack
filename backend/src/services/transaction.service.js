const Order = require("../models/order.model");
const transactionsModel = require("../models/transactions.model");
const {
  generateOrderId,
  generateTransactionId,
} = require("../utils/generateRandom");
const cashfreeService = require("./cashfree.service");
const CreateTransaction = async (payload) => {
  try {
    let {
      receiverDetails,
      senderDetails,
      packageDetails,
      vehicleDetails,
      userId,
      payment,
      distance,
    } = payload;
    console.log("Creating transaction payload:", payload);

    if (
      !receiverDetails ||
      !senderDetails ||
      !packageDetails ||
      !vehicleDetails ||
      !payment
    ) {
      return {
        success: false,
        message: "Missing required fields",
      };
    }
    receiverDetails =
      typeof receiverDetails === "string"
        ? JSON.parse(receiverDetails)
        : receiverDetails;
    senderDetails =
      typeof senderDetails === "string"
        ? JSON.parse(senderDetails)
        : senderDetails;
    packageDetails =
      typeof packageDetails === "string"
        ? JSON.parse(packageDetails)
        : packageDetails;
    vehicleDetails =
      typeof vehicleDetails === "string"
        ? JSON.parse(vehicleDetails)
        : vehicleDetails;
    payment = typeof payment === "string" ? JSON.parse(payment) : payment;

    // Clean userId of any extra quotes
    if (typeof userId === "string") {
      userId = userId.replace(/^"(.*)"$/, "$1"); // Remove surrounding quotes if present
    }

    const orderId = generateOrderId();
    console.log("Payload received for creating transaction:", payload);

    const order = await Order.create({
      orderId,
      userId,
      distance,
      receiverDetails: {
        name: receiverDetails.name,
        mobile: receiverDetails.mobile,
        addressType: receiverDetails.addressType,
        location: {
          latitude: receiverDetails.location.latitude,
          longitude: receiverDetails.location.longitude,
          address: receiverDetails.location.address,
        },
      },
      senderDetails: {
        name: senderDetails.name,
        mobile: senderDetails.mobile,
        addressType: senderDetails.addressType,
        location: {
          latitude: senderDetails.location.latitude,
          longitude: senderDetails.location.longitude,
          address: senderDetails.location.address,
        },
      },
      packageDetails: {
        type: packageDetails.type,
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions,
        description: packageDetails.description,
      },
      vehicleDetails: {
        vehicleType: vehicleDetails.vehicleType,
        vehicleId: vehicleDetails.vehicleId,
        vehicleName: vehicleDetails.vehicleName,
        vehicleImageUrl: vehicleDetails.vehicleImageUrl,
      },
      payment: {
        method:
          payment.method === "Online Payment"
            ? "ONLINE"
            : payment.method?.includes("Cash")
              ? "CASH"
              : "WALLET",
        cashCollectionAt: payment.cashCollectionAt || null,
      },
      pricing: {
        totalAmount: payment.amount,
      },
    });
    if (!order) {
      return {
        success: false,
        message: "Failed to create transaction",
      };
    }
    console.log("Order created:", order);

    const transaction = await transactionsModel.create({
      transactionId: generateTransactionId(),
      amount: payment.amount,
      modeOfPayment:
        payment.method === "Online Payment"
          ? "ONLINE"
          : payment.method?.includes("Cash")
            ? "CASH"
            : "WALLET",
      status: "PENDING",
      sender: userId,
      receiver: "",
      metaData: { orderId: order.orderId, userId: userId },
      orderId: order.orderId,
    });
    if (!transaction) {
      return {
        success: false,
        message: "Failed to create transaction record",
      };
    }
    console.log("Transaction record created:", transaction);

    // Handle different payment methods
    let paymentResponse = null;

    if (payment.method === "Wallet") {
      // Integrate wallet service here
      console.log("Wallet payment processing for order:", order.orderId);
    }

    if (payment.method === "Online Payment") {
      // Integrate Cashfree payment gateway
      console.log(
        "Processing online payment with Cashfree for order:",
        order.orderId
      );

      console.log("UserId before processing:", userId, "Type:", typeof userId);

      const cashfreeOrderData = {
        orderId: order.orderId,
        amount: payment.amount,
        currency: "INR",
        customerDetails: {
          customerId: userId.toString(),
          customerName: senderDetails.name,
          customerEmail:
            payment.customerEmail || `${userId}@turantlogistics.com`,
          customerPhone: senderDetails.mobile,
        },
        orderMeta: {
          returnUrl:
            payment.returnUrl ||
            process.env.PAYMENT_RETURN_URL ||
            "https://turantlogistics.com/payment/return",
          notifyUrl:
            payment.notifyUrl ||
            process.env.PAYMENT_NOTIFY_URL ||
            "https://turantlogistics.com/api/webhooks/cashfree",
          senderName: senderDetails.name || "Sender",
          receiverName: receiverDetails.name || "Receiver",
          packageType: packageDetails.type || "Package",
          vehicleType: vehicleDetails.vehicleType || "Vehicle",
        },
      };

      paymentResponse = await cashfreeService.createOrder(cashfreeOrderData);

      if (paymentResponse.success) {
        // Update transaction with Cashfree order details
        await transactionsModel.findOneAndUpdate(
          { transactionId: transaction.transactionId },
          {
            cashfreeOrderId: paymentResponse.data.order_id,
            cashfreePaymentSessionId: paymentResponse.data.payment_session_id,
            status: "PENDING",
          }
        );

        console.log(
          "Cashfree order created successfully:",
          paymentResponse.data
        );
      } else {
        // Update transaction status to failed
        await transactionsModel.findOneAndUpdate(
          { transactionId: transaction.transactionId },
          { status: "FAILED" }
        );

        return {
          success: false,
          message: "Failed to create payment order",
          error: paymentResponse.error,
        };
      }
    }

    if (payment.method?.includes("Cash")) {
      // Handle cash payment logic here
      console.log("Cash payment selected for order:", order.orderId);

      // For cash payments, we might want to keep status as PENDING
      // until delivery is confirmed
      await transactionsModel.findOneAndUpdate(
        { transactionId: transaction.transactionId },
        { status: "PENDING" }
      );
      await Order.findOneAndUpdate(
        { orderId: order.orderId },
        { "payment.transactionId": transaction.transactionId }
      );
    }

    // Prepare response data
    const responseData = {
      order: order,
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status,
        modeOfPayment: transaction.modeOfPayment,
      },
    };

    // Add payment gateway specific data if online payment
    if (
      payment.method === "Online Payment" &&
      paymentResponse &&
      paymentResponse.success
    ) {
      responseData.paymentGateway = {
        provider: "Cashfree",
        orderId: paymentResponse.data.order_id,
        paymentSessionId: paymentResponse.data.payment_session_id,
        orderStatus: paymentResponse.data.order_status,
        // For mobile apps, you'll need these details to initialize payment
        cftoken: paymentResponse.data.cf_order_id, // This might be different based on Cashfree response
        orderAmount: paymentResponse.data.order_amount,
        orderCurrency: paymentResponse.data.order_currency,
      };
    }

    return {
      success: true,
      message: "Transaction created successfully",
      data: responseData,
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return {
      success: false,
      message: "Error creating transaction",
      error: error.message,
    };
  }
};

const VerifyTransaction = async (payload) => {
  try {
    const { transactionId, orderId, cashfreeOrderId } = payload;
    console.log("Verifying transaction with payload:", payload);

    if (!transactionId && !orderId && !cashfreeOrderId) {
      return {
        success: false,
        message: "Transaction ID, Order ID, or Cashfree Order ID is required",
      };
    }

    // Find transaction record
    let transaction;
    if (transactionId) {
      transaction = await transactionsModel.findOne({ transactionId });
    } else if (cashfreeOrderId) {
      transaction = await transactionsModel.findOne({ cashfreeOrderId });
    } else if (orderId) {
      transaction = await transactionsModel.findOne({
        "metaData.orderId": orderId,
      });
    }

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // If it's an online payment with Cashfree, verify with Cashfree
    if (transaction.modeOfPayment === "ONLINE" && transaction.cashfreeOrderId) {
      console.log(
        "Verifying payment with Cashfree for order:",
        transaction.cashfreeOrderId
      );

      const verificationResponse = await cashfreeService.verifyPayment(
        transaction.cashfreeOrderId
      );
      console.log("Cashfree verification response:", verificationResponse);

      if (!verificationResponse.success) {
        return {
          success: false,
          message: "Failed to verify payment with Cashfree",
          error: verificationResponse.error,
        };
      }

      const paymentData = verificationResponse.data;
      console.log("paymentData:", paymentData);

      // Update transaction status based on Cashfree response
      let newStatus = "PENDING";

      if (
        paymentData.orderStatus === "PAID" ||
        paymentData.paymentStatus === "SUCCESS"
      ) {
        newStatus = "COMPLETED";
      } else if (
        paymentData.orderStatus === "EXPIRED" ||
        paymentData.paymentStatus === "FAILED"
      ) {
        newStatus = "FAILED";
      }

      // Update transaction record
      const updatedTransaction = await transactionsModel.findOneAndUpdate(
        { _id: transaction._id },
        {
          status: newStatus,
          cashfreePaymentId:
            paymentData.paymentId || transaction.cashfreePaymentId,
        },
        { new: true }
      );

      // Synchoronize payment status to the Order Model
      await Order.findOneAndUpdate(
        { orderId: transaction.metaData.orderId },
        {
          "payment.status": newStatus,
          ...(newStatus === "COMPLETED" ? { "payment.paidAt": new Date() } : {})
        }
      );

      return {
        success: true,
        message: "Transaction verification completed",
        data: {
          orderId: transaction.metaData.orderId,
          transaction: updatedTransaction,
          paymentGatewayData: paymentData,
          verified: newStatus === "COMPLETED",
        },
      };
    }

    // For other payment methods, return current transaction status
    return {
      success: true,
      message: "Transaction status retrieved",
      data: {
        orderId: transaction.metaData.orderId,
        transaction: transaction,
        verified: transaction.status === "COMPLETED",
      },
    };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return {
      success: false,
      message: "Error verifying transaction",
      error: error.message,
    };
  }
};

const getAllTransactions = async ({ page = 1, limit = 10 }) => {
  try {
    const skip = (page - 1) * limit;
    const transactions = await transactionsModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await transactionsModel.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const currentPage = page;
    const isNextPage = currentPage < totalPages;
    const isPrevPage = currentPage > 1;
    return {
      success: true,
      message: "Transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          total,
          totalPages,
          currentPage,
          isNextPage,
          isPrevPage,
          limit,
          skip,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    return {
      success: false,
      message: "Error fetching transactions",
      error: error.message,
    };
  }
};

const getConsumersTransactions = async ({
  consumerId,
  page = 1,
  limit = 10,
}) => {
  try {
    const skip = (page - 1) * limit;
    const transactions = await transactionsModel
      .find({ "metaData.userId": consumerId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await transactionsModel.countDocuments({
      "metaData.userId": consumerId,
    });
    const totalPages = Math.ceil(total / limit);
    const currentPage = page;
    const isNextPage = currentPage < totalPages;
    const isPrevPage = currentPage > 1;
    return {
      success: true,
      message: "Consumer transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          total,
          totalPages,
          currentPage,
          isNextPage,
          isPrevPage,
          limit,
          skip,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching consumer transactions:", error);
    return {
      success: false,
      message: "Error fetching consumer transactions",
      error: error.message,
    };
  }
};

const getDriversTransactions = async ({ driverId, page = 1, limit = 10 }) => {
  try {
    const skip = (page - 1) * limit;
    const transactions = await transactionsModel
      .find({ "metaData.driverId": driverId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await transactionsModel.countDocuments({
      "metaData.driverId": driverId,
    });
    const totalPages = Math.ceil(total / limit);
    const currentPage = page;
    const isNextPage = currentPage < totalPages;
    const isPrevPage = currentPage > 1;
    return {
      success: true,
      message: "Driver transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          total,
          totalPages,
          currentPage,
          isNextPage,
          isPrevPage,
          limit,
          skip,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching driver transactions:", error);
    return {
      success: false,
      message: "Error fetching driver transactions",
      error: error.message,
    };
  }
};
const getTransactionsById = async (transactionId) => {
  try {
    console.log("Fetching transaction by ID:", transactionId);
    const transaction = await transactionsModel.findOne({
      transactionId: transactionId,
    });
    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }
    return {
      success: true,
      message: "Transaction retrieved successfully",
      data: transaction,
    };
  } catch (error) {
    console.error("Error fetching transaction by ID:", error);
    return {
      success: false,
      message: "Error fetching transaction",
      error: error.message,
    };
  }
};

module.exports = {
  CreateTransaction,
  VerifyTransaction,
  getAllTransactions,
  getConsumersTransactions,
  getDriversTransactions,
  getTransactionsById,
};
