const WalletService = require("../services/wallet.service");
const Driver = require("../models/driver.model"); // To resolve userId to driverId if needed

const GetBalance = async (req, res) => {
    try {
        // Assuming middleware puts userId in req.user
        // We need to find the Driver profile associated with this User
        const driver = await Driver.findOne({ userId: req.user.userId });

        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver profile not found" });
        }

        const balance = await WalletService.getWalletBalance(driver._id);
        return res.status(200).json({ success: true, balance });
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const GetHistory = async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user.userId });
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver profile not found" });
        }

        const history = await WalletService.getHistory(driver._id);
        return res.status(200).json({ success: true, history });
    } catch (error) {
        console.error("Error fetching wallet history:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const ProcessOrderTest = async (req, res) => {
    try {
        const { orderId } = req.body;
        const result = await WalletService.processOrderPayment(orderId);
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const InitiateRecharge = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Valid amount required" });
        const driver = await Driver.findOne({ userId: req.user.userId });
        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

        const result = await WalletService.initiateRecharge(driver._id, amount, driver);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const VerifyRecharge = async (req, res) => {
    try {
        const { orderId } = req.body; // Cashfree order ID
        if (!orderId) return res.status(400).json({ success: false, message: "orderId required" });
        const driver = await Driver.findOne({ userId: req.user.userId });
        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

        const result = await WalletService.verifyRecharge(driver._id, orderId);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const ProcessWithdrawal = async (req, res) => {
    try {
        const { amount, method, bankDetails, upiDetails } = req.body;
        if (amount == null || amount <= 0) return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
        const driver = await Driver.findOne({ userId: req.user.userId });
        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

        const result = await WalletService.processWithdrawal(driver._id, amount, method, bankDetails, upiDetails);
        return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    GetBalance,
    GetHistory,
    ProcessOrderTest,
    InitiateRecharge,
    VerifyRecharge,
    ProcessWithdrawal
};
