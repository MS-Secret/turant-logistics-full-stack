const router = require("express").Router();
const authController = require("../controller/auth.controller");
const {
  verifyToken,
  requireRole,
} = require("../middleware/auth.middleware");
const {
  validateLogin,
  validateSendOTP,
  validateVerifyOTP,
  validateUpdateProfile,
  validateUserId,
  validateUserStatus,
  validateUserFilters,
} = require("../middleware/validation.middleware");
const {
  handleGetDriverList,
  handleGetDriverDetails,
  handleUpdateDriverKycStatus,
  handleActiveFindingDrivers,
  handleUpdateDriverWorkingStatus,
  handleGetNearbyDrivers,
  handleSendRideRequest,
  handleUpdateCurrentLocation,
  handleBlockDriver,
  handleUnblockDriver,
  handleDeleteDriver,
  handleGetDriverDashboard
} = require("../controller/driver.controller");
const {
  handleGetConsumerList,
  handleGetConsumerDetails,
  handleDeleteConsumer
} = require("../controller/customer.controller");
const multer = require("multer");
const upload = multer();

// Use multer only when Content-Type is multipart/form-data
const conditionalMulter = (fieldName) => (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    console.log("Applying multer for field:", fieldName);

    return upload.single(fieldName)(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  }
  // Not a multipart request; skip multer so JSON body parsers work
  next();
};

// ==================== PUBLIC ROUTES ====================

// Authentication routes
router.post("/register", authController.register);
router.post("/login", validateLogin, authController.login);

// OTP routes
router.post("/send-otp", validateSendOTP, authController.sendOTP);
router.post("/verify-otp", validateVerifyOTP, authController.verifyOTP);

// Health check
router.get("/health", (req, res) => {
  return res.json({
    success: true,
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
  });
});

// ==================== PROTECTED ROUTES ====================

// User profile routes (authenticated users)
router.get("/profile", verifyToken, authController.getProfile);
router.put(
  "/profile",
  conditionalMulter("profileImage"),
  verifyToken,
  authController.updateProfile
);
router.post("/logout", verifyToken, authController.logout);

// ==================== ADMIN ROUTES ====================

// User management (Admin and Super Admin only)
router.get(
  "/users",
  verifyToken,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validateUserFilters,
  authController.getAllUsers
);


router.get(
  "/users/:userId",
  verifyToken,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validateUserId,
  authController.getUserById
);

router.put(
  "/users/:userId",
  verifyToken,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validateUserId,
  validateUpdateProfile,
  authController.updateUser
);

router.patch(
  "/users/:userId/status",
  verifyToken,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validateUserId,
  validateUserStatus,
  authController.updateUserStatus
);

router.delete(
  "/users/:userId",
  verifyToken,
  requireRole("ADMIN", "SUPER_ADMIN"),
  validateUserId,
  authController.deleteUser
);


// ==================== DRIVER HANDLING ====================
router.get("/driver/dashboard", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleGetDriverDashboard);
router.get("/driver/all", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleGetDriverList);
router.get("/driver/active", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleActiveFindingDrivers);
router.get("/driver/nearby", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleGetNearbyDrivers);
router.post("/driver/update-location", verifyToken, handleUpdateCurrentLocation);
router.post("/driver/status", verifyToken, handleUpdateDriverWorkingStatus);
router.post("/driver/ride-request", verifyToken, handleSendRideRequest);
router.get("/driver/:driverId", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleGetDriverDetails);
router.post("/driver/kyc/:userId", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleUpdateDriverKycStatus);
router.post("/driver/block/:userId", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleBlockDriver);
router.post("/driver/unblock/:userId", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleUnblockDriver);
router.delete("/driver/delete/:userId", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleDeleteDriver);

// ==================== Consumer HANDLING ====================
router.get("/consumer/all", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleGetConsumerList);
router.get("/consumer/:consumerId", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleGetConsumerDetails);
router.delete("/consumer/delete/:userId", verifyToken, requireRole("ADMIN", "SUPER_ADMIN"), handleDeleteConsumer);


// 404 handler for auth routes
router.all("*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Auth route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
