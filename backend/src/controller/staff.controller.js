const Admin = require("../models/admin.model");
const crypto = require("crypto");

// Create Staff
const createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      department,
      designation,
      joiningDate,
      salary,
      workingHours,
    } = req.body;

    if (!department || !designation || !joiningDate) {
      return res.status(400).json({
        success: false,
        message: "Department, designation, and joining date are required.",
      });
    }

    // Generate unique IDs
    const userId = crypto.randomUUID();
    const adminId = `ADM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const employeeId = `EMP-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const newStaff = new Admin({
      userId,
      adminId,
      employeeId,
      department,
      designation,
      joiningDate: new Date(joiningDate),
      salary: {
        basic: salary?.basic || 0,
        allowances: salary?.allowances || 0,
        total: (salary?.basic || 0) + (salary?.allowances || 0),
      },
      workingHours,
      contactDetails: {
        alternateEmail: email,
        officialPhone: phone,
      },
      accessLevel: "LEVEL_1", // Default
      isActive: true,
    });

    await newStaff.save();

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: newStaff,
    });
  } catch (error) {
    console.error("Error in createStaff:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get All Staff
const getAllStaff = async (req, res) => {
  try {
    const staffList = await Admin.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Fetched all staff members",
      data: staffList,
    });
  } catch (error) {
    console.error("Error in getAllStaff:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Staff
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.salary) {
      updateData.salary.total =
        (updateData.salary.basic || 0) + (updateData.salary.allowances || 0);
    }

    const updatedStaff = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    console.error("Error in updateStaff:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Staff
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStaff = await Admin.findByIdAndDelete(id);

    if (!deletedStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteStaff:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
};
