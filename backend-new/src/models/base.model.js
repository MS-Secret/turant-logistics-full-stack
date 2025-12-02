// Base model with common fields for all services
const mongoose = require('mongoose');

const baseSchema = {
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: false
  },
  updatedBy: {
    type: String,
    required: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  }
};

const createBaseSchema = (schemaDefinition, options = {}) => {
  const schema = new mongoose.Schema({
    ...schemaDefinition,
    ...baseSchema
  }, {
    timestamps: true,
    versionKey: false,
    ...options
  });

  // Pre-save middleware to update version
  schema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
      this.version += 1;
      this.updatedAt = new Date();
    }
    next();
  });

  return schema;
};

module.exports = { baseSchema, createBaseSchema };
