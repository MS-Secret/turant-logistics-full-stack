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

// Admin Approval Routes
router.get("/admin/requests", verifyToken, walletController.GetWithdrawalsAdmin);
router.post("/admin/approve", verifyToken, walletController.ApproveWithdrawalAdmin);
router.post("/admin/reject", verifyToken, walletController.RejectWithdrawalAdmin);

module.exports = router;
