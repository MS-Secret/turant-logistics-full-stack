const mongoose = require('mongoose');
const { createBaseSchema } = require('./base.model');

const driverSchema = createBaseSchema({
  userId: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  driverId: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  workingStatus: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'BUSY'],
    default: 'OFFLINE'
  },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
    default: 'PENDING'
  },
  currentLocation: {
    latitude: {
      type: Number,
      required:false,
      default: 0,
    },
    longitude: {
      type: Number,
      required:false,
      default: 0,
    }
  },
  ratings: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  earnings: {
    totalEarnings: {
      type: Number,
      default: 0
    },
    todayEarnings: {
      type: Number,
      default: 0
    },
    weeklyEarnings: {
      type: Number,
      default: 0
    },
    monthlyEarnings: {
      type: Number,
      default: 0
    }
  },
  statistics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
    cancelledOrders: {
      type: Number,
      default: 0
    },
    totalDistance: {
      type: Number,
      default: 0
    },
    onlineHours: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  kycStatus:{
    type: String,
    enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'],
    default: 'NOT_STARTED'
  },
  kycDetailsId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KYCApplication',
    required: false
  }
});

// Indexes
driverSchema.index({ userId: 1 });
driverSchema.index({ driverId: 1 });

const Driver = mongoose.model('Driver', driverSchema);


module.exports = Driver;