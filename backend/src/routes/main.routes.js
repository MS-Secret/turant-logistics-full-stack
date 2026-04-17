const Router = require("express").Router();
const authRoutes = require("./auth.routes");
const kycRoutes = require("./kyc.routes");
const orderRoutes = require("./order.routes");
const transactionsRoutes = require("./transactions.routes");
const pricingRoutes = require("./pricing.routes");
const notificationRoutes = require("./notification.routes");
const walletRoutes = require("./wallet.routes");
const campaignRoutes = require("./campaign.routes");
const adminRoutes = require("./admin.routes");
const incentiveRoutes = require("./incentive.routes");

Router.use("/auth", authRoutes);
Router.use("/kyc", kycRoutes);
Router.use("/orders", orderRoutes);
Router.use("/pricing", pricingRoutes);
Router.use("/admin", adminRoutes);
Router.use("/transactions", transactionsRoutes);
Router.use("/notification", notificationRoutes);
Router.use("/wallet", walletRoutes);
Router.use("/campaigns", campaignRoutes);
Router.use("/incentive", incentiveRoutes);

// 404 handler for auth routes
Router.all("*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: `APi route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});
module.exports = Router;
