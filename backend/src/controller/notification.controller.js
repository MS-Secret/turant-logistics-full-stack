const httpStatusCode = require("../constants/httpStatusCode");
const NotificationService = require("../services/notification.service");

const RegisterFCMToken = async (req, res) => {
    try {
        const result = await NotificationService.RegisterFCMToken(req.body);
        if (result.success) {
            return res.status(httpStatusCode.OK).json(result);
        } else {
            return res.status(httpStatusCode.BAD_REQUEST).json(result);
        }
    } catch (error) {
        console.error("Error registering FCM token:", error);
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const TestNotificationSend = async (req, res) => {
    try {
        const result = await NotificationService.SendTestNotification(req.body);
        if (result.success) {
            return res.status(httpStatusCode.OK).json(result);
        } else {
            return res.status(httpStatusCode.BAD_REQUEST).json(result);
        }
    } catch (error) {
        console.error("Error sending test notification:", error);
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const GetUserNotifications = async (req, res) => {
    try {
        const payload = { userId: req.user.userId };
        const result = await NotificationService.GetUserNotifications(payload);
        if (result.success) {
            return res.status(httpStatusCode.OK).json(result);
        } else {
            return res.status(httpStatusCode.BAD_REQUEST).json(result);
        }
    } catch (error) {
        console.error("Error fetching user notifications in controller:", error);
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const MarkNotificationAsRead = async (req, res) => {
    try {
        const payload = { notificationId: req.params.id };
        const result = await NotificationService.MarkNotificationAsRead(payload);
        if (result.success) {
            return res.status(httpStatusCode.OK).json(result);
        } else {
            return res.status(httpStatusCode.BAD_REQUEST).json(result);
        }
    } catch (error) {
        console.error("Error marking notification as read in controller:", error);
        return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = {
    RegisterFCMToken,
    TestNotificationSend,
    GetUserNotifications,
    MarkNotificationAsRead
}