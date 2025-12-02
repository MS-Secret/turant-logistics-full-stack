// Role Management APIs

const roleService = require("../services/role.service");

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const filters = {
      isActive: req.query.isActive,
      search: req.query.search,
    };

    const result = await roleService.getAllRoles(filters);

    res.json({
      success: true,
      message: "Roles retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Create role (Super Admin only)
const createRole = async (req, res) => {
  try {
    const result = await roleService.createRole(req.body);

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update role (Super Admin only)
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const result = await roleService.updateRole(roleId, req.body);

    res.json({
      success: true,
      message: "Role updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete role (Super Admin only)
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const result = await roleService.deleteRole(roleId);

    res.json({
      success: true,
      message: "Role deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Initialize default roles
const initializeRoles = async (req, res) => {
  try {
    const result = await roleService.initializeDefaultRoles();

    res.json({
      success: true,
      message: "Default roles initialized successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Check permission
const checkPermission = async (req, res) => {
  try {
    const { userId, module, action } = req.query;

    const result = await roleService.checkUserPermission(
      userId,
      module,
      action
    );

    res.json({
      success: true,
      message: "Permission check completed",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  initializeRoles,
  checkPermission,
};
