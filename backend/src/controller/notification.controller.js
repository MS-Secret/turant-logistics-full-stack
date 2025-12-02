const httpStatusCode = require("../constants/httpStatusCode");
const NotificationService = require("../services/notification.service");

const RegisterFCMToken=async(req,res)=>{
    try{
        const result=await NotificationService.RegisterFCMToken(req.body);
        if(result.success){
            return res.status(httpStatusCode.OK).json(result);
        }else{
            return res.status(httpStatusCode.BAD_REQUEST).json(result);
        }
    }catch(error){
        console.error("Error registering FCM token:",error);
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Internal server error",
            error:error.message
        });
    }
}

const TestNotificationSend=async(req,res)=>{
    try{
        const result=await NotificationService.SendTestNotification(req.body);
        if(result.success){
            return res.status(httpStatusCode.OK).json(result);
        }else{
            return res.status(httpStatusCode.BAD_REQUEST).json(result);
        }
    }catch(error){
        console.error("Error sending test notification:",error);
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Internal server error",
            error:error.message
        });
    }
}

module.exports={
    RegisterFCMToken,
    TestNotificationSend

}