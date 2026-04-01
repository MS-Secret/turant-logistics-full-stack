const Router = require("express").Router();
const { GetActiveDriversLocations, GetDashboardStats } = require("../controller/admin.controller");
const { createStaff, getAllStaff, updateStaff, deleteStaff } = require("../controller/staff.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Keep consistent API layout (we can skip Token temporarily or use token if admin is authenticated)
Router.get("/tracking/active-drivers", GetActiveDriversLocations);
Router.get("/dashboard/stats", GetDashboardStats);

// Staff Management Routes
Router.post("/staff", createStaff);
Router.get("/staff", getAllStaff);
Router.put("/staff/:id", updateStaff);
Router.delete("/staff/:id", deleteStaff);

module.exports = Router;
