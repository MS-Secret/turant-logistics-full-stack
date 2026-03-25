const Driver = require("../models/driver.model");
const User = require("../models/user.model");
const Order = require("../models/order.model");

const GetActiveDriversLocations = async (req, res) => {
  try {
    const activeDrivers = await Driver.find({
      workingStatus: { $in: ["ONLINE", "BUSY"] },
    }).populate("kycDetailsId");

    if (!activeDrivers || activeDrivers.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const payload = [];
    for (const driver of activeDrivers) {
      if (driver.currentLocation && driver.currentLocation.latitude !== 0) {
        // Fetch User information for real name and mobile
        const user = await User.findOne({ userId: driver.userId }).select("profile phone");
        const fullName = user?.profile ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() : "Driver";

        payload.push({
          driverId: driver.userId,
          name: fullName || "Driver",
          mobile: user?.phone || "N/A",
          vehicleType: driver.kycDetailsId?.vehicle?.vehicleType || "Vehicle",
          location: driver.currentLocation,
          status: driver.workingStatus,
          lastUpdated: Date.now(),
          orderId: null // Optional logic to find active order if BUSY
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Fetched active driver locations",
      data: payload,
    });
  } catch (error) {
    console.log("Error in GetActiveDriversLocations:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const GetDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    // Calculate total revenue from completed/delivered orders
    const completedOrders = await Order.find({ status: { $in: ["DELIVERED", "COMPLETED"] } }).select("pricing.totalAmount");
    const totalRevenue = completedOrders.reduce((acc, order) => {
      return acc + (order.pricing && order.pricing.totalAmount ? order.pricing.totalAmount : 0);
    }, 0);

    // Active Drivers
    const activeDrivers = await Driver.countDocuments({
      workingStatus: { $in: ["ONLINE", "BUSY"] },
    });

    // Total Consumers
    const totalConsumers = await User.countDocuments({ role: "USER" });

    // Recent 5 Orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId senderDetails.name status pricing.totalAmount createdAt");

    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.orderId || "N/A",
      customer: order.senderDetails?.name || "Unknown User",
      status: order.status || "CREATED",
      amount: `₹${order.pricing?.totalAmount || 0}`,
      createdAt: order.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenue,
          activeDrivers,
          totalConsumers,
        },
        recentOrders: formattedRecentOrders
      }
    });

  } catch (error) {
    console.log("Error in GetDashboardStats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  GetActiveDriversLocations,
  GetDashboardStats
};
