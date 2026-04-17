const router = require("express").Router();
const incentiveController = require("../controller/incentive.controller");
const { verifyToken, requireRole } = require("../middleware/auth.middleware");

router.get("/stats", verifyToken, incentiveController.getStats);

router.post("/apply-referral", verifyToken, incentiveController.applyReferral);

module.exports = router;
