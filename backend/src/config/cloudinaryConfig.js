const cloudinary = require("cloudinary").v2;
require("dotenv").config();

//config cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UploadToCloudinary = async (file, folder) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder || "turant_logistics",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(new Error("Error uploading file"));
          }
          resolve(result?.secure_url);
        }
      );
      stream?.end(file.buffer);
    });
    console.log("Cloudinary Upload Result:", result);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = { cloudinary, UploadToCloudinary };
