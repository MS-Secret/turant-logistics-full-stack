const { createBaseSchema } = require('./base.model');
const mongoose = require('mongoose');

// Order Schema
const orderSchema = createBaseSchema({
  orderId: {
    type: String,
    required: false,
    unique: false,
    index: false
  },
  userId: {
    type: String,
    required: false,
    index: false
  },
  driverId: {
    type: String,
    index: false
  },
  status: {
    type: String,
    enum: [
      'CREATED',
      'QUOTE_GENERATED',
      'CONFIRMED',
      'MATCHING',
      'DRIVER_ASSIGNED',
      'DRIVER_ACCEPTED',
      'PICKUP_SCHEDULED',
      'DRIVER_ARRIVED',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
      'REFUND_INITIATED',
      'REFUND_FAILED',
      'REFUNDED'
    ],
    default: 'CREATED'
  },
  receiverDetails: {
    name: {
      type: String,
      required: false,
    },
    mobile: {
      type: String,
      required: false,
    },
    addressType: {
      type: String,
      // enum: ['home', 'work', 'other'],
      default: 'home'
    },
    location: {
      latitude: {
        type: Number,
        required: false,
      },
      longitude: {
        type: Number,
        required: false,
      },
      address: {
        type: String,
        required: false,
      },
    }
  },
  senderDetails: {
    name: {
      type: String,
      required: false,
    },
    mobile: {
      type: String,
      required: false,
    },
    addressType: {
      type: String,
      // enum: ['home', 'work', 'other'],
      default: 'home'
    },
    location: {
      latitude: {
        type: Number,
        required: false,
      },
      longitude: {
        type: Number,
        required: false,
      },
      address: {
        type: String,
        required: false,
      },
    }
  },
  vehicleDetails: {
    vehicleId: {
      type: String,
      required: false,
    },
    vehicleType: {
      type: String,
      required: false,
    },
    vehicleName: {
      type: String,
      required: false,
    },
    vehicleImageUrl: {
      type: String,
      required: false,
    },
  },
  packageDetails: {
    height: {
      type: String,
      required: false,
    },
    width: {
      type: String,
      required: false,
    },
    length: {
      type: String,
      required: false,
    },
    weight: {
      type: String,
      required: false,
    },
    packageImage: {
      type: String,
      required: false,
    }
  },
  pricing: {
    totalAmount: {
      type: Number,
      required: false,
    },
    waitingCharge: {
      type: Number,
      required: false,
      default: 0
    },
    platformSurcharge: {
      type: Number,
      required: false,
      default: 0
    },
    discount: {
      type: Number,
      required: false,
      default: 0
    }
  },
  distance: {
    type: Number,
    required: false,
  },
  payment: {
    method: {
      type: String,
      enum: ['CASH', 'ONLINE', 'WALLET'],
      required: false
    },
    cashCollectionAt: {
      type: String,
      enum: ['PICKUP', 'DROP'],
      required: false
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUND_INITIATED', 'REFUND_FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentIntentId: String,
    transactionId: String,
    paidAmount: Number,
    paidAt: Date
  },
  timeline: {
    createdAt: Date,
    confirmedAt: Date,
    driverAssignedAt: Date,
    driverArrivedAt: Date,
    pickupScheduledAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    completedAt: Date,
    cancelledAt: Date
  },
  tracking: {
    pickupCode: String,
    deliveryCode: String,
    pickupImages: [String],
    deliveryImages: [String],
    driverNotes: String,
    customerNotes: String,
    rideOtp: String // OTP for starting the ride
  },
  waitingInfo: {
    startTime: Date, // When driver arrived
    endTime: Date,   // When ride started (OTP verified)
    duration: Number, // In minutes
    cost: Number,
    paid: { type: Boolean, default: false }
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['USER', 'DRIVER', 'SYSTEM', 'ADMIN']
    },
    reason: String,
    refundAmount: Number,
    cancellationFee: Number,
    cancelledAt: Date
  },
  rating: {
    userRating: {
      rating: Number,
      review: String,
      ratedAt: Date
    },
    driverRating: {
      rating: Number,
      review: String,
      ratedAt: Date
    }
  },
  invoiceUrl: {
    type: String,
    required: false
  }
});



const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
