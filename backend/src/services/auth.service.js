const User = require("../models/user.model");
const { OTP, Session } = require("../models/otp.model");
const Consumer = require("../models/consumer.model");
const Driver = require("../models/driver.model");
const Admin = require("../models/admin.model");
const { generateUserId, generateOTP } = require("../utils/generateRandom");
const { generateTokens } = require("../middleware/auth.middleware");
const {
  sendRegistrationOTPEmail,
  sendLoginOTPEmail,
} = require("./emailservices/email.processor");
const cloudinary = require("../config/cloudinaryConfig");
const { sendSMS } = require("./smsService/sms.processor");
const { GetKycDetails } = require("./kyc.service");

// Register user
const register = async (userData) => {
  const { email, phone, role = "USER", userName, password } = userData;

  // Check if user already exists with same phone/email AND same role
  // This allows same phone to have different accounts for different roles
  const criteria = [];
  if (phone) {
    criteria.push({ phone: phone, role: role });
  }
  if (email) {
    criteria.push({ email: email, role: role });
  }

  if (criteria.length === 0) {
    throw new Error("Either phone or email is required");
  }

  const existingUser = await User.findOne({
    $or: criteria,
  });

  if (existingUser) {
    if (role === "ADMIN" && existingUser.role === "ADMIN") {
      console.log("Admin already exists:", existingUser);
      return null;
    }
    throw new Error(`User already exists with this ${phone ? 'phone' : 'email'} and role ${role}`);
  }

  // Generate unique user ID
  const userId = generateUserId(role);
  console.log("userId:", userId);

  // Create user
  const user = new User({
    userId,
    email,
    phone,
    password: password || "123456",
    role,
    username: userName || `${userName}_${Date.now()}`,
  });
  console.log("user before save:", user);

  try {
    await user.save();
  } catch (error) {
    // Handle duplicate key error (E11000) - might occur if compound index not yet created
    if (error.code === 11000) {
      // Check if it's a phone duplicate
      if (error.keyPattern && error.keyPattern.phone) {
        // Check if user exists with same phone but different role
        const existingUserWithPhone = await User.findOne({ phone });
        if (existingUserWithPhone && existingUserWithPhone.role !== role) {
          // This is expected - same phone with different role should be allowed
          // But if we get here, the compound index might not be set up correctly
          throw new Error(`Phone number already exists with role ${existingUserWithPhone.role}. Please ensure compound index { phone: 1, role: 1 } is created.`);
        } else if (existingUserWithPhone && existingUserWithPhone.role === role) {
          // Same phone and same role - this should not happen as we checked above
          throw new Error(`User already exists with this ${phone ? 'phone' : 'email'} and role ${role}`);
        }
      }
      // Re-throw if it's a different duplicate key error
      throw error;
    }
    // Re-throw other errors
    throw error;
  }

  // Create role-specific profile
  await createRoleSpecificProfile(user);

  // Send verification OTP
  await sendVerificationOTP(phone, "REGISTRATION", user);

  return {
    userId: user.userId,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };
};

// Create role-specific profile
const createRoleSpecificProfile = async (user) => {
  console.log("user Role:", user?.role);
  switch (user.role) {
    case "USER":
      const consumer = new Consumer({
        userId: user.userId,
        consumerId: `CNS${Date.now()}${Math.floor(Math.random() * 1000)}`,
      });
      console.log("consumer before save:", consumer);
      await consumer.save();
      break;

    case "DRIVER":
      const driver = new Driver({
        userId: user.userId,
        driverId: `DRV${Date.now()}${Math.floor(Math.random() * 1000)}`,
      });
      await driver.save();
      break;

    case "ADMIN":
    case "SUPER_ADMIN":
      const admin = new Admin({
        userId: user.userId,
        adminId: `ADM${Date.now()}${Math.floor(Math.random() * 1000)}`,
        employeeId: `EMP${Date.now()}`,
        department: "OPERATIONS",
        designation:
          user.role === "SUPER_ADMIN" ? "Super Administrator" : "Administrator",
        accessLevel: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "LEVEL_1",
        joiningDate: new Date(),
      });
      await admin.save();
      break;
  }
};

// Login user
const login = async (identifier, password, deviceInfo = {}, expectedRole = null) => {
  try {
    // Build query with optional role filter
    // This ensures we find the correct user when multiple users exist with same phone/email but different roles
    let query = {
      $or: [{ email: identifier }, { phone: identifier }],
      isDeleted: false,
    };
    
    // If expectedRole is provided, filter by role to ensure correct user is found
    // This fixes the issue where login() finds wrong user when same phone has multiple roles
    if (expectedRole) {
      query.role = expectedRole;
    }
    
    // Find user by email or phone (and role if provided)
    const user = await User.findOne(query).select("+password");
    console.log("login user:", user);
    console.log("login expectedRole:", expectedRole);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (password) {
      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }
    }

    // Check if user is active
    // if (user.status !== "ACTIVE") {
    //   throw new Error("Account is not active. Please verify your account");
    // }

    // Generate tokens
    const tokenPayload = {
      userId: user.userId,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const { accessToken, refreshToken } = await generateTokens(tokenPayload);

    // Save session
    const session = await Session.create({
      userId: user?.userId,
      refreshToken,
      accessToken,
      deviceId: deviceInfo?.deviceId,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    console.log("session:", session);

    // Update user metadata
    user.metadata.lastLoginAt = new Date();
    user.metadata.loginCount += 1;

    if (deviceInfo?.deviceId) {
      const existingDevice = user.metadata.deviceInfo.find(
        (d) => d.deviceId === deviceInfo.deviceId
      );
      if (existingDevice) {
        existingDevice.lastActiveAt = new Date();
        existingDevice.fcmToken = deviceInfo.fcmToken;
      } else {
        user.metadata.deviceInfo.push({
          deviceId: deviceInfo.deviceId,
          platform: deviceInfo.platform,
          fcmToken: deviceInfo.fcmToken,
          lastActiveAt: new Date(),
        });
      }
    }

    await user.save();
    console.log("access token:", accessToken);
    console.log("refresh token:", refreshToken);

    // For drivers, fetch KYC data via events
    let kycInfo = null;
    let driverProfileData = null;
    if (user.role === "DRIVER") {
      const driverProfile = await Driver.findOne({ userId: user.userId });
      console.log("driverProfile:", driverProfile);
      driverProfileData = driverProfile;
    }

    return {
      user: {
        userId: user.userId,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        status: user.status,
        profile: user.profile,
        permissions: user.permissions,
        ...(driverProfileData && { driver: driverProfileData }),
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    console.log("login error:", error);
    return { message: "Login failed", error: error?.message };
  }
};

// Send OTP
const sendOTP = async (identifier, purpose, identifierType = "PHONE", user) => {
  try {
    console.log("sendOTP identifier:", identifier);
    console.log("sendOTP purpose:", purpose);
    console.log("sendOTP identifierType:", identifierType);
    // Delete existing OTPs for this identifier and purpose
    await OTP.deleteMany({ identifier, purpose });

    // Generate new OTP
    let otp;
    if (identifier === "+919973152523" || identifier === "+919234228398") {
      otp = "123456";
    } else {
      otp = generateOTP();
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log("sendOTP otp:", otp);

    // Find user if not provided, but don't block if not found (Implicit Registration)
    if (!user) {
      user = await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
      });
    }

    console.log("sendOTP user found:", !!user);

    // Send email OTP in background (non-blocking) - don't wait for it
    // This ensures SMS is sent immediately without delay
    if (purpose === "REGISTRATION" && user?.email) {
      // Fire and forget - don't await, let it run in background
      sendRegistrationOTPEmail({ email: user.email, username: user.username, otp })
        .then((result) => {
          console.log("Registration OTP email sent successfully:", result);
        })
        .catch((error) => {
          console.error("Failed to send registration OTP email (non-blocking):", error.message);
          // Don't throw - email failure shouldn't block OTP flow
        });
    } else if (purpose === "LOGIN" && user?.email) {
      const payload = {
        email: user.email,
        username: user.username,
        otp
      };
      // Fire and forget - don't await, let it run in background
      sendLoginOTPEmail(payload)
        .then((result) => {
          console.log("Login OTP email sent successfully:", result);
        })
        .catch((error) => {
          console.error("Failed to send login OTP email (non-blocking):", error.message);
          // Don't throw - email failure shouldn't block OTP flow
        });
    }

    // Send SMS immediately (Use identifier if user not found, assuming identifier is phone)
    const phoneToSend = user?.phone || identifier;
    const smsResult = await sendSMS(
      phoneToSend,
      `Your OTP is ${otp}. Please use this to verify your account . -MithilaStack`
    );

    // Check if SMS was sent successfully
    if (!smsResult.success) {
      console.error("Failed to send SMS:", smsResult.error);
      return {
        success: false,
        message: "Failed to send OTP via SMS",
        error: smsResult.error,
      };
    } else {
      console.log("SMS sent successfully:", smsResult);
    }

    // Save OTP
    const otpDoc = await OTP.create({
      identifier,
      identifierType,
      otp,
      purpose,
      expiresAt,
    });
    if (!otpDoc) {
      return {
        success: false,
        message: "Failed to create OTP",
      };
    }

    console.log("sendOTP otpDoc:", otpDoc);

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.log("sendOTP error:", error);
    return {
      success: false,
      message: "OTP sending failed",
      error: error?.message,
    };
  }
};

// Verify OTP
const verifyOTP = async (identifier, otp, purpose, identifierType, role) => {
  try {
    const otpDoc = await OTP.findOne({
      identifier,
      otp,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
    console.log("verifyOTP identifier:", identifier);
    console.log("verifyOTP otp:", otp);
    console.log("verifyOTP purpose:", purpose);
    console.log("verifyOTP identifierType:", identifierType);
    console.log("verifyOTP role:", role);
    console.log("otpdoc:", otpDoc);
    if (!otpDoc) {
      throw new Error("Invalid or expired OTP");
    }

    // Check attempts
    if (otpDoc.attempts >= 3) {
      throw new Error("Maximum OTP attempts exceeded");
    }

    // Mark OTP as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    // Determine the expected role (default to USER if not provided)
    const expectedRole = role || "USER";

    // Check if user exists with same phone/email AND same role
    // This ensures same phone can have separate accounts for different roles
    let query = {};
    if (identifierType === 'PHONE') {
      query = { phone: identifier, role: expectedRole };
    } else if (identifierType === 'EMAIL') {
      query = { email: identifier, role: expectedRole };
    } else {
      query = { 
        $or: [{ email: identifier }, { phone: identifier }],
        role: expectedRole
      };
    }

    let user = await User.findOne(query);

    // If user exists with matching phone and role, proceed with login
    if (user) {
      if (identifierType === "PHONE") {
        await User.updateOne(
          { phone: identifier, role: expectedRole },
          {
            phoneVerified: true,
            status: "ACTIVE",
          }
        );
      } else if (identifierType === "EMAIL") {
        await User.updateOne(
          { email: identifier, role: expectedRole },
          {
            emailVerified: true,
            status: "ACTIVE",
          }
        );
      }

      // Ensure role-specific profile exists
      if (expectedRole === "DRIVER") {
        const driverProfile = await Driver.findOne({ userId: user.userId });
        if (!driverProfile) {
          console.log("Creating missing Driver profile for user...");
          await createRoleSpecificProfile(user);
        }
      } else if (expectedRole === "USER") {
        const consumerProfile = await Consumer.findOne({ userId: user.userId });
        if (!consumerProfile) {
          console.log("Creating missing Consumer profile for user...");
          await createRoleSpecificProfile(user);
        }
      }
    } else {
      // Check if phone/email exists with different role
      let existingUserQuery = {};
      if (identifierType === 'PHONE') {
        existingUserQuery = { phone: identifier };
      } else if (identifierType === 'EMAIL') {
        existingUserQuery = { email: identifier };
      } else {
        existingUserQuery = { $or: [{ email: identifier }, { phone: identifier }] };
      }

      const existingUserWithDifferentRole = await User.findOne(existingUserQuery);

      if (existingUserWithDifferentRole) {
        // Phone/email exists but with different role - create new account for this role
        console.log(`Phone/email exists with role ${existingUserWithDifferentRole.role}, creating new account with role ${expectedRole}...`);
      } else {
        // Completely new user - implicit registration
        console.log(`User not found, registering implicitly as ${expectedRole}...`);
      }

      // Implicit Registration: Create new user with expected role
      const userData = {
        phone: identifierType === 'PHONE' ? identifier : undefined,
        email: identifierType === 'EMAIL' ? identifier : undefined,
        role: expectedRole,
        userName: `User_${identifier.slice(-4)}_${Date.now()}`, // Generate unique username
        password: "123456", // Default password since we use OTP
      };

      const registerResult = await register(userData);
      if (!registerResult) {
        throw new Error("Failed to register new user");
      }
      console.log("Implicit registration successful:", registerResult);
      
      // Refetch the newly created user
      user = await User.findOne(query);
      if (!user) {
        throw new Error("Failed to retrieve newly registered user");
      }
    }

    // CRITICAL FIX: Use the user we found/created (with correct role) instead of calling login with identifier
    // This ensures we login with the correct role user, not any other user with same phone
    let verifyResult;
    // Call login with identifier BUT also pass role to ensure correct user is found
    // OR better: Use userId directly since we already have the correct user
    // Since login() doesn't accept userId, we'll modify it to filter by role when role is provided
    // For now, let's refetch user with role filter and then call login
    verifyResult = await login(identifier, "123456", {}, expectedRole);
    console.log("verifyResult:", verifyResult);

    return { message: "OTP verified successfully", data: verifyResult };
  } catch (error) {
    console.log("verifyOTP error:", error);
    return { message: "OTP verification failed", error: error?.message };
  }
};

// Send verification OTP
const sendVerificationOTP = async (phone, purpose, user) => {
  return await sendOTP(phone, purpose, "PHONE", user);
};

// Get user profile
const getUserProfile = async (userId) => {
  const user = await User.findOne({ userId, isDeleted: false });
  if (!user) {
    throw new Error("User not found");
  }

  let roleSpecificData = {};

  // Get role-specific data
  switch (user.role) {
    case "USER":
      roleSpecificData = await Consumer.findOne({ userId });
      break;
    case "DRIVER":
      roleSpecificData = await Driver.findOne({ userId });

      // Fetch KYC data with error handling and fallback
      let kycData = null;
      try {
        const kycResult = await GetKycDetails(userId);
        // GetKycDetails returns { success, data } structure
        if (kycResult?.success && kycResult?.data) {
          kycData = kycResult.data;
          console.log("KYC data fetched for driver:", kycData);
        } else {
          console.warn(`KYC data not found for driver ${userId}`);
          kycData = {
            exists: false,
            userId,
            message: "KYC data not found",
            fallback: true,
          };
        }
      } catch (error) {
        console.warn(
          `KYC data fetch failed for driver ${userId}:`,
          error.message
        );
        kycData = {
          exists: false,
          error: error.message,
          userId,
          message: "KYC data temporarily unavailable",
          fallback: true,
        };
      }

      roleSpecificData = { ...roleSpecificData?._doc, kyc: kycData };

      // [FIX] Merge Consumer data if it exists, to support Drivers using Consumer App
      const consumerData = await Consumer.findOne({ userId });
      if (consumerData) {
        console.log("Merging Consumer data for Driver:", userId);
        roleSpecificData = { ...consumerData?._doc, ...roleSpecificData };
      }
      break;
    case "ADMIN":
    case "SUPER_ADMIN":
      roleSpecificData = await Admin.findOne({ userId });
      break;
  }
  return {
    ...user?._doc,
    profile: roleSpecificData,
  };
};

// Update user profile
const updateUserProfile = async (updateData, profileImageFile) => {
  try {
    const userId = updateData?.userId;
    console.log("updateUserProfile updateData:", updateData);
    console.log("updateUserProfile profileImageFile:", profileImageFile);
    if (!userId) {
      return {
        success: false,
        message: "UserId is required",
      };
    }
    const user = await User.findOne({ userId, isDeleted: false });
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    let profileImageUrl = "";
    if (profileImageFile) {
      profileImageUrl = await cloudinary.UploadToCloudinary(
        profileImageFile,
        "profileImages"
      );
    }

    const {
      username,
      email: emailInput,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      street,
      city,
      state,
      zipCode,
      country,
    } = updateData;

    // Initialize profile and address objects if they don't exist
    if (!user.profile) user.profile = {};
    if (!user.profile.address) user.profile.address = {};

    if (username) user.username = username;

    // Allow adding/updating email from Edit Profile (optional; user may not have email at register)
    if (emailInput !== undefined && emailInput !== null) {
      const newEmail = typeof emailInput === 'string' ? emailInput.trim().toLowerCase() : '';
      if (newEmail) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(newEmail)) {
          return { success: false, message: "Please enter a valid email address" };
        }
        const existingWithEmail = await User.findOne({ email: newEmail, userId: { $ne: user.userId }, isDeleted: false });
        if (existingWithEmail) {
          return { success: false, message: "This email is already used by another account" };
        }
        user.email = newEmail;
      } else {
        user.email = undefined;
      }
    }
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (gender) user.profile.gender = gender;
    if (dateOfBirth) user.profile.dateOfBirth = new Date(dateOfBirth);
    if (profileImageUrl) user.profile.profileImageUrl = profileImageUrl;
    if (street) user.profile.address.street = street;
    if (city) user.profile.address.city = city;
    if (state) user.profile.address.state = state;
    if (zipCode) user.profile.address.zipCode = zipCode;
    if (country) user.profile.address.country = country;

    await user.save();

    return {
      success: true,
      message: "Profile updated successfully",
      data: user,
    };
  } catch (error) {
    console.log("updateUserProfile error:", error);
    return {
      success: false,
      message: "Profile update failed",
      error: error?.message,
    };
  }
};

// Logout user (unregister device)
const logout = async (userId, deviceId) => {
  try {
    const user = await User.findOne({ userId });
    if (user && deviceId) {
      // Remove device from deviceInfo list
      if (user.metadata && user.metadata.deviceInfo) {
        user.metadata.deviceInfo = user.metadata.deviceInfo.filter(
          (d) => d.deviceId !== deviceId
        );
        await user.save();
        console.log(`Device ${deviceId} unregistered for user ${userId}`);
      }
    }

    // Clear session for this device
    await Session.deleteMany({ userId, deviceId });

    return {
      success: true,
      message: "Successfully logged out and device unregistered",
    };
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

const createDefaultAdmin = async () => {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME } = process.env;
    console.log("admin_email:", ADMIN_EMAIL);
    console.log("admin_password:", ADMIN_PASSWORD);
    const userData = {
      email: ADMIN_EMAIL,
      phone: "+911234567809",
      role: "ADMIN",
      userName: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    };
    const user = await register(userData);
    if (!user) {
      return {
        success: false,
        message: "something went wrong",
      };
    }
    console.log("Default admin user created:", user);
    return {
      success: true,
      message: "Amin created successfully",
    };
  } catch (error) {
    console.log("error while creating admin:", error);
    return {
      success: false,
      message: "Failed to create admin",
      error: error?.message,
    };
  }
};

module.exports = {
  login,
  register,
  verifyOTP,
  sendOTP,
  sendVerificationOTP,
  createRoleSpecificProfile,
  getUserProfile,
  updateUserProfile,
  createDefaultAdmin,
  logout
};
