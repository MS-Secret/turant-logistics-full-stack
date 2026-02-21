const mongoose = require("mongoose");
const { createBaseSchema } = require("./base.model");

const CampaignSchema = createBaseSchema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        default: null,
    },
    targetAudience: {
        type: String,
        enum: ['ALL_USERS', 'ALL_DRIVERS', 'INACTIVE_USERS', 'SPECIFIC_USERS'],
        required: true,
    },
    scheduledTime: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SCHEDULED', 'COMPLETED', 'FAILED'],
        default: 'DRAFT',
    },
    sentCount: {
        type: Number,
        default: 0,
    }
});

const CampaignModel = mongoose.model("Campaign", CampaignSchema);

module.exports = CampaignModel;
