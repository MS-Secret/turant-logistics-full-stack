const express = require("express");
const {
    handleCreateCampaign,
    handleGetCampaigns,
    handleDeleteCampaign,
} = require("../controller/campaign.controller");
const upload = require("../middleware/multer.middleware");

const router = express.Router();

router.post("/", upload.single("image"), handleCreateCampaign);
router.get("/", handleGetCampaigns);
router.delete("/:id", handleDeleteCampaign);

module.exports = router;
