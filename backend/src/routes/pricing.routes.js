const router = require("express").Router();
const pricingController = require("../controller/pricing.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const multer = require("multer");
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 50,
  },
});
router.get("/health", (req, res) => {
  return res.json({
    success: true,
    message: "Payment service is running",
    timestamp: new Date().toISOString(),
  });
});

router.post(
  "/",
  verifyToken,
  upload.single("vehicleImage"),
  pricingController.CreatePricing
);
router.get("/", verifyToken, pricingController.GetPricingAll);
router.get("/:id", verifyToken, pricingController.GetPricingById);
router.delete("/:id", verifyToken, pricingController.DeletePricingById);
router.put(
  "/:id",
  verifyToken,
  upload.single("vehicleImage"),
  pricingController.UpdatePricing
);
router.post("/calculate-fare", verifyToken, pricingController.CalculateFare);
router.post("/fare-estimate", verifyToken, pricingController.GetFareEstimate);
router.post("/fare-all-vehicles", verifyToken, upload.single("x"), pricingController.CalculateFareAllVehiclesSuggestions);
module.exports = router;
