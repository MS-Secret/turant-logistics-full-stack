const mongoose = require('mongoose');
const { createBaseSchema } = require('./base.model');

const consumerSchema = createBaseSchema({
  userId: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  consumerId: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  addresses: [{
    type: {
      type: String,
      enum: ['HOME', 'WORK', 'OTHER'],
      default: 'HOME'
    },
    label: String,
    street: {
      type: String,
      required: false
    },
    landmark: String,
    city: {
      type: String,
      required: false
    },
    state: {
      type: String,
      required: false
    },
    zipCode: {
      type: String,
      required: false
    },
    country: {
      type: String,
      default: 'India'
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  orderHistory: {
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
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    preferredLanguage: {
      type: String,
      default: 'en'
    },
    preferredCurrency: {
      type: String,
      default: 'INR'
    },
    notifications: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false }
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'WALLET', 'UPI'],
      default: 'CASH'
    }
  },
  loyaltyPoints: {
    current: {
      type: Number,
      default: 0
    },
    lifetime: {
      type: Number,
      default: 0
    },
    tier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE'
    }
  },
  ratings: {
    averageRating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    relation: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastOrderAt: Date,
  registrationSource: {
    type: String,
    enum: ['MOBILE_APP', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA'],
    default: 'MOBILE_APP'
  }
});

const Consumer = mongoose.model('Consumer', consumerSchema);

module.exports = Consumer;