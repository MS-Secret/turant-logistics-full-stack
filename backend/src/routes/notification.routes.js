const { RegisterFCMToken, TestNotificationSend, GetUserNotifications, MarkNotificationAsRead } = require('../controller/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const Router = require('express').Router();

Router.post("/registerFCMToken", verifyToken, RegisterFCMToken);
Router.post("/sendTestNotification", verifyToken, TestNotificationSend);
Router.get("/", verifyToken, GetUserNotifications);
Router.put("/read/:id", verifyToken, MarkNotificationAsRead);

module.exports = Router;