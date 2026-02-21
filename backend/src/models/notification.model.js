const { createBaseSchema } = require("./base.model");
const mongoose = require("mongoose");

const NotificationSchema = createBaseSchema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['order', 'offer', 'account', 'general'],
    default: 'general'
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const NotificationModel = mongoose.model("Notification", NotificationSchema);

module.exports = NotificationModel

