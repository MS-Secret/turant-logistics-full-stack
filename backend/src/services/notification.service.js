const UserModel = require("../models/user.model");
const NotificationModel = require("../models/notification.model");
const { sendToMultipleDevices } = require("../config/firebase.config")
const RegisterFCMToken = async (payload) => {
  try {
    const { userId, token, device } = payload;
    if (!userId || !token || !device) {
      return {
        success: false,
        message: "Missing required fields: userId, token, device",
      };
    }
    const User = await UserModel.findOne({ userId });
    if (!User) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Initialize array if it doesn't exist
    if (!User.metadata.deviceInfo) {
      User.metadata.deviceInfo = [];
    }

    // Check if device ID or Token already exists
    const existingDeviceIndex = User.metadata.deviceInfo.findIndex(
      (dev) => dev.deviceId === device.id || dev.fcmToken === token
    );

    if (existingDeviceIndex !== -1) {
      // Device exists - Update token and lastActiveAt
      User.metadata.deviceInfo[existingDeviceIndex].fcmToken = token;
      User.metadata.deviceInfo[existingDeviceIndex].lastActiveAt = new Date();
      User.metadata.deviceInfo[existingDeviceIndex].deviceId = device.id; // ensure ID is synced if match was by token
      User.metadata.deviceInfo[existingDeviceIndex].deviceName = device.name;
    } else {
      // New device - Add to list
      console.log("Registering new device:", userId, device);
      const deviceInfo = {
        deviceId: device?.id,
        platform: device?.type,
        fcmToken: token,
        deviceName: device?.name,
        lastActiveAt: new Date(),
      };
      User.metadata.deviceInfo.push(deviceInfo);
    }

    // Sort by last active (newest first) and keep only the top 3 to prevent accumulation
    User.metadata.deviceInfo.sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));
    if (User.metadata.deviceInfo.length > 3) {
      User.metadata.deviceInfo = User.metadata.deviceInfo.slice(0, 3);
    }

    await User.save();

    return {
      success: true,
      message: "Token Registered Successfully!",
    };
  } catch (error) {
    console.error("Error in notification.service RegisterFCMToken:", error);
    return {
      success: false,
      message: "Internal service error",
      error: error.message,
    };
  }
};

const SendTestNotification = async (payload) => {
  try {
    console.log("SendTestNotification payload:", payload);
    const { userId, title, body } = payload;
    if (!userId || !title || !body) {
      return {
        success: false,
        message: "Missing required fields: userId, title, body",
      };
    }
    const User = await UserModel.findOne({ userId });
    if (!User) {
      return {
        success: false,
        message: "User not found",
      };
    }
    const fcmTokens = User.metadata.deviceInfo?.map((device) => device.fcmToken);
    if (!fcmTokens || fcmTokens.length === 0) {
      return {
        success: false,
        message: "No FCM tokens found for user",
      };
    }
    console.log("Sending test notification to tokens:", fcmTokens, title, body);
    await sendToMultipleDevices(fcmTokens, { title, body }, { userId });
    return {
      success: true,
      message: "Test notification sent successfully (simulated)",
    };
  } catch (error) {
    console.error("Error in notification.service SendTestNotification:", error);
    return {
      success: false,
      message: "Internal service error",
      error: error.message,
    };
  }
};

const GetUserNotifications = async (payload) => {
  try {
    const { userId, page = 1, limit = 10 } = payload;
    if (!userId) {
      return { success: false, message: "Missing required field: userId" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      NotificationModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      NotificationModel.countDocuments({ userId })
    ]);

    // Map to frontend expected format
    const formattedNotifications = notifications.map(n => ({
      id: n._id.toString(),
      type: n.type || 'general',
      title: n.title,
      message: n.message,
      time: n.createdAt,
      read: n.read
    }));

    return {
      success: true,
      message: "Notifications fetched successfully",
      data: formattedNotifications,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return { success: false, message: "Internal service error", error: error.message };
  }
};

const MarkNotificationAsRead = async (payload) => {
  try {
    const { notificationId } = payload;
    if (!notificationId) {
      return { success: false, message: "Missing required field: notificationId" };
    }

    const notification = await NotificationModel.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return { success: false, message: "Notification not found" };
    }

    return {
      success: true,
      message: "Notification marked as read"
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, message: "Internal service error", error: error.message };
  }
};

module.exports = {
  RegisterFCMToken,
  SendTestNotification,
  GetUserNotifications,
  MarkNotificationAsRead
};
