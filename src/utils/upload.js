// src/utils/upload.js
import cloudinary from "../config/cloudinary.js";

/**
 * Upload buffer to Cloudinary via upload_stream (for memoryStorage from multer)
 * options: { folder, resource_type }
 */
export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}