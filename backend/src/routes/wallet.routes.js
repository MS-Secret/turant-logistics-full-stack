const router = require("express").Router();
const walletController = require("../controller/wallet.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.get("/balance", verifyToken, walletController.GetBalance);
router.get("/history", verifyToken, walletController.GetHistory);

// Internal/Admin route - typically you'd protect this more, but for dev:
router.post("/process-order", verifyToken, walletController.ProcessOrderTest);

module.exports = router;
