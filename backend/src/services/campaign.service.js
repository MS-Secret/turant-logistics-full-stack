const CampaignModel = require("../models/campaign.model");
const UserModel = require("../models/user.model");
const Driver = require("../models/driver.model");
const { sendToMultipleDevices } = require("../config/firebase.config");
const { UploadToCloudinary } = require("../config/cloudinaryConfig");

const CreateCampaign = async (payload) => {
    try {
        const { title, message, targetAudience, scheduledTime, imageFile } = payload;

        let imageUrl = null;
        if (imageFile) {
            imageUrl = await UploadToCloudinary(imageFile, "campaigns");
        }

        const campaign = await CampaignModel.create({
            title,
            message,
            targetAudience,
            scheduledTime,
            imageUrl,
            status: new Date(scheduledTime) <= new Date() ? 'DRAFT' : 'SCHEDULED'
        });

        // If scheduled time is in the past or now, we might want to dispatch immediately.
        // For simplicity, we just set to SCHEDULED if future, else DRAFT (admin can manually trigger or cron will pick).
        // Actually, if it's "now", we can set to SCHEDULED, the cron will pick it up on the next minute.

        // Let's force SCHEDULED so cron picks it up.
        campaign.status = 'SCHEDULED';
        await campaign.save();

        return { success: true, message: "Campaign created successfully", data: campaign };
    } catch (error) {
        console.error("Error creating campaign:", error);
        return { success: false, message: "Internal server error", error: error.message };
    }
};

const GetCampaigns = async () => {
    try {
        const campaigns = await CampaignModel.find().sort({ createdAt: -1 });
        return { success: true, message: "Campaigns fetched successfully", data: campaigns };
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return { success: false, message: "Internal server error", error: error.message };
    }
};

const DeleteCampaign = async (id) => {
    try {
        const campaign = await CampaignModel.findByIdAndDelete(id);
        if (!campaign) return { success: false, message: "Campaign not found" };
        return { success: true, message: "Campaign deleted successfully" };
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return { success: false, message: "Internal server error", error: error.message };
    }
};

const DispatchScheduledCampaigns = async () => {
    try {
        const now = new Date();
        const pendingCampaigns = await CampaignModel.find({
            status: 'SCHEDULED',
            scheduledTime: { $lte: now }
        });

        if (pendingCampaigns.length === 0) return;

        console.log(`Found ${pendingCampaigns.length} scheduled campaigns to dispatch.`);

        for (const campaign of pendingCampaigns) {
            try {
                let userIds = [];
                let tokens = [];

                if (campaign.targetAudience === 'ALL_USERS') {
                    const users = await UserModel.find({ role: 'USER' });
                    userIds = users.map(u => u.userId);
                    tokens = users.flatMap(u => u.metadata?.deviceInfo?.map(d => d.fcmToken) || []);
                } else if (campaign.targetAudience === 'ALL_DRIVERS') {
                    const drivers = await Driver.find({ isActive: true });
                    const driverUserIds = drivers.map(d => d.userId);
                    const users = await UserModel.find({ userId: { $in: driverUserIds } });
                    userIds = users.map(u => u.userId);
                    tokens = users.flatMap(u => u.metadata?.deviceInfo?.map(d => d.fcmToken) || []);
                } else if (campaign.targetAudience === 'INACTIVE_USERS') {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const users = await UserModel.find({
                        role: 'USER',
                        'metadata.lastLoginAt': { $lt: thirtyDaysAgo }
                    });
                    userIds = users.map(u => u.userId);
                    tokens = users.flatMap(u => u.metadata?.deviceInfo?.map(d => d.fcmToken) || []);
                }

                // Filter out empty tokens
                tokens = tokens.filter(t => t);

                if (tokens.length > 0) {
                    await sendToMultipleDevices(
                        tokens,
                        { title: campaign.title, body: campaign.message },
                        { type: 'CAMPAIGN', campaignId: campaign._id.toString(), imageUrl: campaign.imageUrl || '' }
                    );
                }

                campaign.status = 'COMPLETED';
                campaign.sentCount = tokens.length;
                await campaign.save();
                console.log(`Campaign ${campaign._id} dispatched to ${tokens.length} devices.`);
            } catch (innerError) {
                console.error(`Failed to dispatch campaign ${campaign._id}:`, innerError);
                campaign.status = 'FAILED';
                await campaign.save();
            }
        }
    } catch (error) {
        console.error("Error dispatching scheduled campaigns:", error);
    }
};

module.exports = {
    CreateCampaign,
    GetCampaigns,
    DeleteCampaign,
    DispatchScheduledCampaigns
};
