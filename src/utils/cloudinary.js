import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { apiError } from "./apiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? "Exists" : "Missing",
});

const uploadOnCloudinary = async (localFilePath) => {
  try { 
    if (!localFilePath) {
      //return null;
      throw new apiError(400, "File path is required");
    }
    if (!fs.existsSync(localFilePath)) {
      throw new apiError(400, `File does not exist at path: ${localFilePath}`);
    }
    console.log("Uploading file at path:", localFilePath);

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically determine the resource type (image, video, etc.)
    });
    //file has been successfully uploaded
    console.log("file is uploaded on cloudinary", response.url);
   // fs.unlinkSync(localFilePath);//Delete the local file after upload
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary", error);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation gor failed
    //return null;
    throw new apiError(500, "Failed to upload to Cloudinary")
  }
};



export {uploadOnCloudinary}
