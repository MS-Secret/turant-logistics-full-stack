const router = require('express').Router();
const { GetAllOrders, GetOrderById, GetDriversOrders, GetConsumersOrders, RateRide, CancelOrder } = require('../controller/order.controller');
const { verifyToken } = require("../middleware/auth.middleware")

router.get("/health", (req, res) => {
    return res.json({
        success: true,
        message: "Order service is running",
        timestamp: new Date().toISOString()
    });
});

router.get("/", verifyToken, GetAllOrders);
router.get("/:orderId", verifyToken, GetOrderById);
router.get("/driver/:driverId", verifyToken, GetDriversOrders);
router.get("/consumer/:consumerId", verifyToken, GetConsumersOrders);
router.post("/:orderId/rate", verifyToken, RateRide);
router.post("/:orderId/cancel", verifyToken, CancelOrder);
module.exports = router;