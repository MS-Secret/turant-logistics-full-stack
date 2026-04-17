const mongoose = require('mongoose');
const { createBaseSchema } = require('./base.model');

const incentiveSchema = createBaseSchema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    unique: true
  },
  totalCompletedOrders: {
    type: Number,
    default: 0
  },
  lastIncentiveAt: {
    type: Number,
    default: 0,
    
    
  },
  incentiveHistory: [{
    milestone: Number,
    amount: Number,
    creditedAt: {
      type: Date,
      default: Date.now
    },
    walletTransactionId: String
  }]
});

const IncentiveTracker = mongoose.model('IncentiveTracker', incentiveSchema);

module.exports = IncentiveTracker;
