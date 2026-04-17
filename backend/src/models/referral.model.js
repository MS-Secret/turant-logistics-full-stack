const mongoose = require('mongoose');
const { createBaseSchema } = require('./base.model');

const referralSchema = createBaseSchema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    unique: true 
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED'],
    default: 'ACTIVE'
  },
  milestones: {
    fiveOrders: {
      completed: { type: Boolean , default: false },
      completedAt: Date,
      amount: { type: Number, default: 50 },
      walletTransactionId: String
    },
    twentyFiveOrders: {
      completed: { type: Boolean, default: false },
      completedAt: Date,
      amount: { type: Number, default: 200 },
      walletTransactionId: String
    },

  }
});

referralSchema.index({ referrer: 1 });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
