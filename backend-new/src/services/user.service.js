const User = require("../models/user.model");
const Consumer = require("../models/consumer.model");
const Driver = require("../models/driver.model");
const Admin = require("../models/admin.model");
const Role = require("../models/role.model");

// Get all users with filters
const getAllUsers = async (filters = {}, pagination = {}) => {
  const {
    role,
    status,
    search,
    startDate,
    endDate,
    phoneVerified,
    emailVerified,
  } = filters;

  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = pagination;

  // Build query
  const query = { isDeleted: false };

  if (role) query.role = role;
  if (status) query.status = status;
  if (phoneVerified !== undefined) query.phoneVerified = phoneVerified;
  if (emailVerified !== undefined) query.emailVerified = emailVerified;

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { "profile.firstName": { $regex: search, $options: "i" } },
      { "profile.lastName": { $regex: search, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [users, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Get user by ID
const getUserById = async (userId) => {
  const user = await User.findOne({ userId, isDeleted: false }).lean();
  if (!user) {
    return {
      success: false,
      message: "User not found",
    };
  }

  // Get role-specific data
  let roleSpecificData = {};
  switch (user.role) {
    case "USER":
      roleSpecificData = await Consumer.findOne({ userId }).lean();
      break;
    case "DRIVER":
      roleSpecificData = await Driver.findOne({ userId }).lean();
      break;
    case "ADMIN":
    case "SUPER_ADMIN":
      roleSpecificData = await Admin.findOne({ userId }).lean();
      break;
  }
  if (!roleSpecificData) {
    return {
      success: false,
      message: "Role specific data not found",
    };
  }

  return {
    success: true,
    data: {
      ...user,
      roleSpecificData,
    },
    message: "User fetched successfully",
  };
};

// Update user
const updateUser = async (userId, updateData) => {
  const user = await User.findOneAndUpdate(
    { userId, isDeleted: false },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// Update user status
const updateUserStatus = async (userId, status) => {
  const validStatuses = [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "PENDING_VERIFICATION",
  ];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const user = await User.findOneAndUpdate(
    { userId, isDeleted: false },
    { status },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// Soft delete user
const deleteUser = async (userId) => {
  const user = await User.findOneAndUpdate(
    { userId, isDeleted: false },
    {
      isDeleted: true,
      status: "INACTIVE",
      deletedAt: new Date(),
    },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return { message: "User deleted successfully" };
};

// Update user permissions
const updateUserPermissions = async (userId, permissions) => {
  const user = await User.findOneAndUpdate(
    { userId, isDeleted: false },
    { permissions },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// Get user statistics
const getUserStatistics = async () => {
  const stats = await User.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
        },
        pendingUsers: {
          $sum: { $cond: [{ $eq: ["$status", "PENDING_VERIFICATION"] }, 1, 0] },
        },
        suspendedUsers: {
          $sum: { $cond: [{ $eq: ["$status", "SUSPENDED"] }, 1, 0] },
        },
        verifiedUsers: {
          $sum: { $cond: ["$phoneVerified", 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalUsers: 1,
        activeUsers: 1,
        pendingUsers: 1,
        suspendedUsers: 1,
        verifiedUsers: 1,
      },
    },
  ]);

  const roleStats = await User.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    overview: stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      pendingUsers: 0,
      suspendedUsers: 0,
      verifiedUsers: 0,
    },
    roleDistribution: roleStats,
  };
};

// Search users
const searchUsers = async (searchQuery, filters = {}) => {
  const query = {
    isDeleted: false,
    $or: [
      { username: { $regex: searchQuery, $options: "i" } },
      { email: { $regex: searchQuery, $options: "i" } },
      { phone: { $regex: searchQuery, $options: "i" } },
      { "profile.firstName": { $regex: searchQuery, $options: "i" } },
      { "profile.lastName": { $regex: searchQuery, $options: "i" } },
      { userId: { $regex: searchQuery, $options: "i" } },
    ],
  };

  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;

  const users = await User.find(query).limit(20).sort({ createdAt: -1 }).lean();

  return users;
};

// Get user activity
const getUserActivity = async (userId) => {
  const user = await User.findOne({ userId, isDeleted: false });
  if (!user) {
    throw new Error("User not found");
  }

  return {
    userId: user.userId,
    lastLoginAt: user.metadata.lastLoginAt,
    loginCount: user.metadata.loginCount,
    deviceInfo: user.metadata.deviceInfo,
    status: user.status,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
  };
};

// Bulk update users
const bulkUpdateUsers = async (userIds, updateData) => {
  const result = await User.updateMany(
    {
      userId: { $in: userIds },
      isDeleted: false,
    },
    { $set: updateData }
  );

  return {
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount,
  };
};

// Export users data
const exportUsers = async (filters = {}) => {
  const query = { isDeleted: false };

  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const users = await User.find(query)
    .select(
      "userId username email phone role status phoneVerified emailVerified profile createdAt"
    )
    .lean();

  return users;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  updateUserPermissions,
  getUserStatistics,
  searchUsers,
  getUserActivity,
  bulkUpdateUsers,
  exportUsers,
};
