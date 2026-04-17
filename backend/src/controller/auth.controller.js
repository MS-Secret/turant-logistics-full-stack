const authService = require("../services/auth.service");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const httpStatusCode = require("../constants/httpStatusCode");

// Register new user
const register = async (req, res) => {
  try {
    console.log("req body data:", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const result = await authService.register(req.body);

    console.log("result:", result);
    return res.status(httpStatusCode.CREATED).json({
      success: true,
      message: "User registered successfully. Please verify your phone number",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { identifier, password } = req.body;
    const deviceInfo = {
      deviceId: req.headers["device-id"],
      platform: req.headers["platform"],
      fcmToken: req.headers["fcm-token"],
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

    const result = await authService.login(identifier, password, deviceInfo);
    // if (!result?.success) {
    //   return res.status(401).json(result);
    // }
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};


// Send OTP
const sendOTP = async (req, res) => {
  try {
    const { identifier, purpose, identifierType = "PHONE", appHash } = req.body;

    const result = await authService.sendOTP(
      identifier,
      purpose,
      identifierType,
      null,
      appHash
    );
    if (!result.success) {
      return res.status(httpStatusCode.BAD_REQUEST).json(result);
    }

    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    return res.status(httpStatusCode.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { identifier, otp, purpose, identifierType, role, referralCode } = req.body;

    const result = await authService.verifyOTP(
      identifier,
      otp,
      purpose,
      identifierType,
      role,
      referralCode
    );

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "OTP verified successfully",
      data: result?.data,
    });
  } catch (error) {
    return res.status(httpStatusCode.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await authService.getUserProfile(userId);

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    console.log("Update profile req body:", req.body);
    console.log("Update profile req file:", req.file);


    const result = await authService.updateUserProfile(req.body, req.file);

    res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(httpStatusCode.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      phoneVerified: req.query.phoneVerified,
      emailVerified: req.query.emailVerified,
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const result = await userService.getAllUsers(filters, pagination);

    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await userService.getUserById(userId);
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(httpStatusCode.OK).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await userService.updateUser(userId, req.body);

    res.json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user status (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const result = await userService.updateUserStatus(userId, status);

    res.json({
      success: true,
      message: "User status updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await userService.deleteUser(userId);

    res.json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



// Logout user (unregister device)
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const deviceId = req.headers["device-id"];

    if (!deviceId) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Device-Id header is required for logout",
      });
    }

    const result = await authService.logout(userId, deviceId);
    res.json(result);
  } catch (error) {
    res.status(httpStatusCode.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  sendOTP,
  verifyOTP,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  logout,
};
