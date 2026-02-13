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

    // Check if device ID already exists
    const existingDeviceIndex = User.metadata.deviceInfo?.findIndex(
      (dev) => dev.deviceId === device.id
    );

    if (existingDeviceIndex !== -1) {
      // Device exists - Update token and lastActiveAt
      User.metadata.deviceInfo[existingDeviceIndex].fcmToken = token;
      User.metadata.deviceInfo[existingDeviceIndex].lastActiveAt = new Date();
      User.metadata.deviceInfo[existingDeviceIndex].deviceName = device.name; // Update name in case it changed

      await User.save();

      return {
        success: true,
        message: "Device token updated successfully",
      };
    }

    // New device - Add to list
    console.log("Registering new device:", userId, device);
    const deviceInfo = {
      deviceId: device?.id,
      platform: device?.type,
      fcmToken: token,
      deviceName: device?.name,
      lastActiveAt: new Date(),
    };

    // Initialize array if it doesn't exist
    if (!User.metadata.deviceInfo) {
      User.metadata.deviceInfo = [];
    }

    User.metadata.deviceInfo.push(deviceInfo);
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

module.exports = {
  RegisterFCMToken,
  SendTestNotification,
};
