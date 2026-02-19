const WalletService = require("../services/wallet.service");
const Driver = require("../models/driver.model"); // To resolve userId to driverId if needed

const GetBalance = async (req, res) => {
    try {
        // Assuming middleware puts userId in req.user
        // We need to find the Driver profile associated with this User
        const driver = await Driver.findOne({ userId: req.user.uid });

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
        const driver = await Driver.findOne({ userId: req.user.uid });
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

// Internal testing endpoint to force process a completed order
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
}

module.exports = {
    GetBalance,
    GetHistory,
    ProcessOrderTest
};
