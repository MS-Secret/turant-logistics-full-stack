const { createPayment, verifyPayment, getAllTransactions, getTransactionsById, getConsumersTransactions, getDriversTransactions } = require('../controller/transaction.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router=require('express').Router();
const multer=require('multer');
const upload=multer();

router.get("/health",(req,res)=>{
    return res.json({
        success:true,
        message:"Transactions service is running",
        timestamp:new Date().toISOString()
    });
});

router.post("/create",verifyToken,upload.single("paymentData"),createPayment);
router.post("/verify",verifyToken,upload.single("paymentData"),verifyPayment);

router.get("/all",verifyToken,getAllTransactions);
router.get("/consumer/:consumerId",verifyToken,getConsumersTransactions);
router.get("/driver/:driverId",verifyToken,getDriversTransactions);
router.get("/:transactionId",verifyToken,getTransactionsById);

module.exports=router;