const router=require('express').Router();
const { GetAllOrders, GetOrderById, GetDriversOrders, GetConsumersOrders } = require('../controller/order.controller');
const { verifyToken } = require("../middleware/auth.middleware")

router.get("/health",(req,res)=>{
    return res.json({
        success:true,
        message:"Order service is running",
        timestamp:new Date().toISOString()
    });
});

router.get("/",verifyToken,GetAllOrders);
router.get("/:orderId",verifyToken,GetOrderById);
router.get("/driver/:driverId",verifyToken,GetDriversOrders);
router.get("/consumer/:consumerId",verifyToken,GetConsumersOrders);
module.exports=router;