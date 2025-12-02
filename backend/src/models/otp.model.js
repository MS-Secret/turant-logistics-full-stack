const { createBaseSchema } = require("./base.model");
const mongoose=require("mongoose");
// OTP Schema
const otpSchema = createBaseSchema({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  identifierType: {
    type: String,
    enum: ['PHONE', 'EMAIL'],
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['LOGIN', 'REGISTRATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION', 'EMAIL_VERIFICATION'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isUsed: {
    type: Boolean,
    default: false
  }
});

// Session Schema for JWT refresh tokens
const sessionSchema = createBaseSchema({
  userId: {
    type: String,
    required: false,
    index: true
  },
  refreshToken: {
    type: String,
    required: false,
  },
  accessToken:{
    type: String,
    required: false,
  },
  deviceId: {
    type: String,
    required: false,
  },
  ipAddress: {
    type: String,
    required: false,
  },
  userAgent: {
    type: String,
    required: false,
  },
  expiresAt: {
    type: Date,
    required: false,
    index: { expireAfterSeconds: 0 }
  },
  isRevoked: {
    type: Boolean,
    default: false
  }
});

const OTP = mongoose.model("OTP", otpSchema);
const Session = mongoose.model('Session', sessionSchema);
module.exports = { OTP, Session };