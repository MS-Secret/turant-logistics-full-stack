const cloudinary = require("../config/cloudinaryConfig");
const KYCModel = require("../models/kyc.model");
const CreateOwner = async (payload) => {
  try {
    console.log("Payload in service:", payload);
    const { name, userId,documents } = payload;
    if (!name || !userId) {
      return {
        success: false,
        message: "Name and UserId are required",
      };
    }
    let aadharFrontImageUrl;
    let aadharBackImageUrl;
    let panCardImageUrl;
    let ownerPhotoUrl;

    if (documents && typeof documents === 'object') {
      const uploadPromises = [];
      
      // Using Object.entries to get both key and file object
      for (const [key, file] of Object.entries(documents)) {
        console.log("Processing file:", key, file);
        switch (key) {
          case "aadharFront":
            uploadPromises.push(
              cloudinary.UploadToCloudinary(file, "aadharFront")
                .then(url => { aadharFrontImageUrl = url; })
            );
            break;
          case "aadharBack":
            uploadPromises.push(
              cloudinary.UploadToCloudinary(file, "aadharBack")
                .then(url => { aadharBackImageUrl = url; })
            );
            break;
          case "panCard":
            uploadPromises.push(
              cloudinary.UploadToCloudinary(file, "panCard")
                .then(url => { panCardImageUrl = url; })
            );
            break;
          case "ownerPhoto":
            uploadPromises.push(
              cloudinary.UploadToCloudinary(file, "ownerPhoto")
                .then(url => { ownerPhotoUrl = url; })
            );
            break;
          default:
            break;
        }
      }
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
    }

    const KYCApplication=await KYCModel.create({
        userId,
        owner:{
            name,
            aadhaarCard:{
                frontImageUrl:aadharFrontImageUrl,
                backImageUrl:aadharBackImageUrl,
            },
            panCard:{
                imageUrl:panCardImageUrl,
            },
            ownerPhotoUrl:ownerPhotoUrl,
        },
        stepCompleted:1,
    });
    console.log("KYC Application created:", KYCApplication);
    return {
      success: true,
      message: "Owner created successfully",
      data: KYCApplication,
    };
  } catch (error) {
    console.error("Error in CreateOwner:", error);
    return {
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    };
  }
};

const ownerService = { CreateOwner };
module.exports = ownerService;
