const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { Session } = require("../models/otp.model");
const logger = require("../utils/logger");
require("dotenv").config();

const httpStatusCode = require("../constants/httpStatusCode");

// Generate JWT token
async function getToken(user) {
  const token = await jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
  return token;
}

// Generate refresh token
async function getRefreshToken(user) {
  const token = await jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
  return token;
}

// Generate token for forgot password
async function getTokenForgotPassword(user) {
  const token = await jwt.sign(
    {
      userId: user.userId,
      purpose: "PASSWORD_RESET",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  return token;
}

// Verify JWT token middleware
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Token not provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Token not provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug("Decoded token payload", { userId: decoded.userId, role: decoded.role });


    // Find user and check if still exists and is active
    const user = await User.findOne({
      userId: decoded?.userId,
      isDeleted: false,
    });

    if (!user) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: User not found or inactive",
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Password was changed. Please login again",
      });
    }

    logger.debug("Token Verification Success", { 
      userId: decoded.userId,
      iat: new Date(decoded.iat * 1000),
      exp: new Date(decoded.exp * 1000)
    });
    // Sanitize user object for logging
    logger.debug("User found", { user: logger.sanitize(user) });
    // Check if session is still valid (optional - for stricter security)
    const session = await Session.findOne({
      userId: decoded.userId,
      accessToken: token,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Session expired or invalid",
      });
    }

    // Add user to request object
    req.user = {
      userId: user.userId,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      status: user.status,
    };

    next();
  } catch (error) {
    logger.error("Error verifying token", { error: error.message });

    if (error.name === "JsonWebTokenError") {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Token expired",
      });
    }

    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
}

//verify token for socket connections
const VerifyTokenThroughSocket = async (authToken) => {
  try {
    const token = authToken.split(" ")[1];
    if (!token) {
      return {
        success: false,
        message: "Unauthorized: Token not provided",
      };
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug("Decoded socket token payload", { userId: decoded.userId });


    // Find user and check if still exists and is active
    const user = await User.findOne({
      userId: decoded?.userId,
      isDeleted: false,
    });

    if (!user) {
      return {
        success: false,
        message: "Unauthorized: User not found or inactive",
      };
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return {
        success: false,
        message: "Unauthorized: Password was changed. Please login again",
      };
    }

    logger.debug("Socket Token Verification Status", { 
      userId: decoded.userId,
      iat: new Date(decoded.iat * 1000)
    });
    logger.debug("Socket User found", { user: logger.sanitize(user) });
    // Check if session is still valid (optional - for stricter security)
    const session = await Session.findOne({
      userId: decoded.userId,
      accessToken: token,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return {
        success: false,
        message: "Unauthorized: Session expired or invalid",
      };
    }


    return {
      success: true,
      data: {
        userId: user?.userId,
        email: user?.email,
        phone: user?.phone,
        username: user?.username,
        role: user?.role,
        permissions: user?.permissions,
        status: user?.status,
      },
    };
  } catch (error) {
    logger.error("Error verifying socket token", { error: error.message });
    return {
      success: false,
      message: "Unauthorized: Invalid token",
    };
  }
}


// Check if user has specific role
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(httpStatusCode.FORBIDDEN).json({
        success: false,
        message: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
}

// Check if user has specific permission
function requirePermission(module, action) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: User not authenticated",
        });
      }

      const user = await User.findOne({ userId: req.user.userId });
      if (!user) {
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: User not found",
        });
      }

      // Check user permissions
      const hasPermission = user.permissions.some(
        (permission) =>
          permission.module === module && permission.actions.includes(action)
      );

      if (!hasPermission) {
        return res.status(httpStatusCode.FORBIDDEN).json({
          success: false,
          message: `Forbidden: Missing ${action} permission for ${module} module`,
        });
      }

      next();
    } catch (error) {
      console.error("Error checking permission:", error);
      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

// Optional authentication (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      userId: decoded.userId,
      isDeleted: false,
      status: "ACTIVE",
    });

    if (user && !user.changedPasswordAfter(decoded.iat)) {
      req.user = {
        userId: user.userId,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
}

// Generate JWT tokens
const generateTokens = async (payload) => {
  try {
    logger.debug("Generating tokens for user", { userId: payload.userId });
    const accessToken = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    });

    const refreshToken = await jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      }
    );
    const tokens = { accessToken, refreshToken };
    return tokens;
  } catch (error) {
    console.log("error while generating tokens:", error);
  }
};

// Verify JWT token
const verifyTokenWithSecret = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

module.exports = {
  getToken,
  getRefreshToken,
  getTokenForgotPassword,
  verifyToken,
  generateTokens,
  verifyTokenWithSecret,
  requireRole,
  requirePermission,
  optionalAuth,
  VerifyTokenThroughSocket
};
