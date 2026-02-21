const router = require("express").Router();
const walletController = require("../controller/wallet.controller");
const { verifyToken } = require("../middleware/auth.middleware");

router.get("/balance", verifyToken, walletController.GetBalance);
router.get("/history", verifyToken, walletController.GetHistory);

router.post("/recharge/initiate", verifyToken, walletController.InitiateRecharge);
router.post("/recharge/verify", verifyToken, walletController.VerifyRecharge);
router.post("/withdraw", verifyToken, walletController.ProcessWithdrawal);

// Internal/Admin route - typically you'd protect this more, but for dev:
router.post("/process-order", verifyToken, walletController.ProcessOrderTest);

module.exports = router;
