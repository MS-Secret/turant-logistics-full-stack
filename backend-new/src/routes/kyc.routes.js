const app = require("express");
const { CreateOwner } = require("../controller/owner.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const Router = app.Router();
const multer = require("multer");
const { CreateVehicleDetails } = require("../controller/vehicle.controller");
const { CreateDriverDetails } = require("../controller/driver.controller");
const { GetKycDetails, UpdateKycStatus } = require("../controller/kyc.controller");
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 50,
  },
});


Router.post("/update-status/:userId", verifyToken,upload.single("document"), UpdateKycStatus);


//getting the kyc details
Router.get("/details/:userId", verifyToken, GetKycDetails);

//health check
Router.get("/health", (req, res) => {
  return res.json({
    success: true,
    message: "KYC service is running",
    timestamp: new Date().toISOString(),
  });
});

//adding the details of owner
Router.post(
  "/owner-details",
  verifyToken,
  upload.fields([
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
  ]),
  CreateOwner
);

//adding the details of vehicle
Router.post(
  "/vehicle-details",
  verifyToken,
  upload.single("vehicleRC"),
  CreateVehicleDetails
);

//adding the details of driver
Router.post(
  "/driver-details",
  verifyToken,
  upload.single("licenseDocument"),
  CreateDriverDetails
);




module.exports = Router;
