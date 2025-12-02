const UserModel = require("../models/user.model");
const NotificationModel = require("../models/notification.model");
const {sendToMultipleDevices}=require("../config/firebase.config")
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
    const isExistingToken = User.metadata.deviceInfo?.some(
      (device) => device.fcmToken === token
    );
    const isExistingDevice = User.metadata.deviceInfo?.some(
      (dev) => dev.deviceId === device.id
    );
    if (isExistingToken) {
      return {
        success: true,
        message: "Token already registered",
      };
    }
    if (isExistingDevice) {
      return {
        success: false,
        message: "Device already registered with a different token",
      };
    }
    console.log("userId,device", userId, device);
    const deviceInfo = {
      deviceId: device?.id,
      platform: device?.type,
      fcmToken: token,
      deviceName: device?.name,
      lastActiveAt: new Date(),
    };
    User.metadata.deviceInfo?.push(deviceInfo);
    await User.save();

    return {
      success: true,
      message: "Token Register Successfully!",
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
