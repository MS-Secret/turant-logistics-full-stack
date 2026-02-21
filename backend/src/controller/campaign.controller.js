const { CreateCampaign, GetCampaigns, DeleteCampaign } = require("../services/campaign.service");

const handleCreateCampaign = async (req, res) => {
    try {
        const payload = {
            title: req.body.title,
            message: req.body.message,
            targetAudience: req.body.targetAudience,
            scheduledTime: req.body.scheduledTime,
            imageFile: req.files ? req.files.image : null
        };

        if (req.files && req.files.image && Array.isArray(req.files.image)) {
            payload.imageFile = req.files.image[0];
        } else if (req.file) {
            payload.imageFile = req.file;
        }

        const result = await CreateCampaign(payload);
        if (result.success) {
            return res.status(201).json(result);
        }
        return res.status(400).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const handleGetCampaigns = async (req, res) => {
    try {
        const result = await GetCampaigns();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const handleDeleteCampaign = async (req, res) => {
    try {
        const result = await DeleteCampaign(req.params.id);
        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    handleCreateCampaign,
    handleGetCampaigns,
    handleDeleteCampaign
};
