const mongoose = require("mongoose");
const { createBaseSchema } = require("./base.model");

const WalletSchema = createBaseSchema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        required: true,
        unique: true, // One wallet per driver
    },
    balance: {
        type: Number,
        default: 0,
        required: true,
    },
    transactions: [
        {
            type: {
                type: String,
                enum: ["CREDIT", "DEBIT"], // CREDIT: Money added, DEBIT: Money deducted
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
            description: {
                type: String,
                required: true,
            },
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order", // Specific order this transaction relates to
                required: false,
            },
            date: {
                type: Date,
                default: Date.now,
            },
            status: {
                type: String,
                enum: ["SUCCESS", "FAILED", "PENDING"],
                default: "SUCCESS",
            },
        },
    ],
});

// Middleware to prevent duplicate wallet creation error if needed, 
// but unique index handles it.

module.exports = mongoose.model("Wallet", WalletSchema);
