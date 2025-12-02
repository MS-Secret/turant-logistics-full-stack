const mongoose = require('mongoose');
const { createBaseSchema } = require('./base.model');

const roleSchema = createBaseSchema({
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    enum: ['USER', 'DRIVER', 'ADMIN', 'SUPER_ADMIN']
  },
  description: {
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
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for efficient queries
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
