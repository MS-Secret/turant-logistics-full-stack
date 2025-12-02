const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const { createBaseSchema } = require('./base.model');

const UserSchema = createBaseSchema({
  userId: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: false,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    match: [/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code (e.g., +919876543210)']
  },
  password: {
    type: String,
    required: false,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ["USER", "DRIVER", "ADMIN", "SUPER_ADMIN"],
    default: "USER",
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
    default: 'PENDING_VERIFICATION'
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  profile: {
    firstName: {
      type: String,
      required: false,
      trim: true
    },
    lastName: {
      type: String,
      required: false,
      trim: true
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER']
    },
    dateOfBirth: Date,
    profileImageUrl: String,
    address: {
      street:{
        type: String,
        required: false,
        trim: true
      },
      city: {
        type: String,
        required: false,
        trim: true
      },
      state: {
        type: String,
        required: false,
        trim: true
      },
      zipCode: {
        type: String,
        required: false,
        trim: true
      },
      country: { type: String, default: 'India' }
    }
  },
  permissions: [{
    module: {
      type: String,
      required: false,
    },
    actions: [{
      type: String,
      enum: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "REJECT", "ASSIGN"]
    }]
  }],
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true }
    }
  },
  metadata: {
    lastLoginAt: Date,
    loginCount: { type: Number, default: 0 },
    passwordChangedAt: Date,
    deviceInfo: [{
      deviceId: String,
      platform: String,
      fcmToken: String,
      deviceName:String,
      lastActiveAt: Date
    }]
  }
});

// Indexes for better performance
UserSchema.index({ email: 1 });


// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set password changed timestamp
    if (!this.isNew) {
      this.metadata.passwordChangedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.metadata.passwordChangedAt) {
    const changedTimestamp = parseInt(this.metadata.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;
