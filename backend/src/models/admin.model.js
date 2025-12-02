const mongoose = require('mongoose');
const { createBaseSchema } = require('./base.model');

const adminSchema = createBaseSchema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  adminId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    enum: ['OPERATIONS', 'CUSTOMER_SERVICE', 'FINANCE', 'MARKETING', 'HR', 'IT', 'LOGISTICS'],
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  permissions: [{
    module: {
      type: String,
      required: true,
      enum: ['USER', 'DRIVER', 'ORDER', 'PAYMENT', 'LOCATION', 'NOTIFICATION', 'KYC', 'INVOICE', 'DISPATCH', 'PRICING', 'WALLET', 'ADMIN']
    },
    actions: [{
      type: String,
      enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ASSIGN']
    }]
  }],
  accessLevel: {
    type: String,
    enum: ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'SUPER_ADMIN'],
    default: 'LEVEL_1'
  },
  reportingTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  workingHours: {
    startTime: String,
    endTime: String,
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  contactDetails: {
    emergencyContact: String,
    alternateEmail: String,
    officialPhone: String
  },
  joiningDate: {
    type: Date,
    required: true
  },
  salary: {
    basic: Number,
    allowances: Number,
    total: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
adminSchema.index({ userId: 1 });
adminSchema.index({ adminId: 1 });
adminSchema.index({ employeeId: 1 });
adminSchema.index({ department: 1 });
adminSchema.index({ accessLevel: 1 });
adminSchema.index({ isActive: 1 });

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;