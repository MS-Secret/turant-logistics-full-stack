const Router = require("express").Router();
const { GetActiveDriversLocations, GetDashboardStats } = require("../controller/admin.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Keep consistent API layout (we can skip Token temporarily or use token if admin is authenticated)
Router.get("/tracking/active-drivers", GetActiveDriversLocations);
Router.get("/dashboard/stats", GetDashboardStats);

module.exports = Router;
