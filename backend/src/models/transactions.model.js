const { createBaseSchema } = require("./base.model");
const mongoose = require("mongoose");

const TransactionSchema = createBaseSchema({
  transactionId: {
    type: String,
    required: true,

    index: true,
  },
  orderId:{
    type: String,
    required: false,
  },
  amount: {
    type: Number,
    required: true,
  },
  modeOfPayment: {
    type: String,
    required: true,
    enum: ["ONLINE", "CASH", "WALLET"],
    default: "CASH",
  },
  razorpayPaymentId: {
    type: String,
    required: false,
  },
  razorpayOrderId: {
    type: String,
    required: false,
  },
  cashfreeOrderId: {
    type: String,
    required: false,
  },
  cashfreePaymentId: {
    type: String,
    required: false,
  },
  cashfreePaymentSessionId: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: true,
    enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
    default: "PENDING",
  },
  sender: {
    type: String,
    required: false,
  },
  receiver: {
    type: String,
    required: false,
  },
  metaData: {
    type: Object,
    required: false,
  },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
