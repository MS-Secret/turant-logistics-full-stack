const { RegisterFCMToken, TestNotificationSend } = require('../controller/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const Router=require('express').Router();

Router.post("/registerFCMToken",verifyToken,RegisterFCMToken);
Router.post("/sendTestNotification",verifyToken,TestNotificationSend);

module.exports=Router;