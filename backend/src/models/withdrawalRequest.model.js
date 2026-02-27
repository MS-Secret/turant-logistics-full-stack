const mongoose = require("mongoose");
const { createBaseSchema } = require("./base.model");

const WithdrawalRequestSchema = createBaseSchema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    method: {
        type: String,
        enum: ["BANK", "UPI"],
        required: true,
    },
    bankDetails: {
        accountNumber: { type: String },
        ifsc: { type: String },
        accountHolderName: { type: String },
    },
    upiDetails: {
        upiId: { type: String },
    },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "FAILED"],
        default: "PENDING",
    },
    adminNote: {
        type: String,
    },
    transferId: {
        type: String, // from cashfree
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("WithdrawalRequest", WithdrawalRequestSchema);
