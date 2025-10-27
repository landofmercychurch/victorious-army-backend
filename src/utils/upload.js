// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

/**
 * Uploads a video or image buffer to Cloudinary safely, with progress tracking.
 * Supports large files via streaming (no 413 or JSON errors).
 *
 * @param {Buffer} buffer - The file buffer (from multer.memoryStorage()).
 * @param {Object} options - Upload options (folder, resource_type, etc.).
 * @param {Function} [onProgress] - Optional callback(percent) for upload progress.
 * @returns {Promise<Object>} - Resolves with Cloudinary upload result.
 */
export async function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const {
      folder = "uploads",
      resource_type = "auto",
      hls = false,
      originalFormat = "",
    } = options;

    const uploadOptions = {
      folder,
      resource_type,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      timeout: 1800000, // 30 minutes
      eager: [],
    };

    // Configure video transformation options
    if (resource_type === "video") {
      uploadOptions.chunk_size = 10_000_000; // 10MB chunks (safe size)
      const isWebM = originalFormat.toLowerCase().endsWith(".webm");

      uploadOptions.eager.push({
        transformation: isWebM
          ? []
          : [{ fetch_format: "webm", quality: "auto", vc: "vp9", h: 720 }],
        format: "webm",
      });

      if (hls) {
        uploadOptions.eager.push({
          streaming_profile: "auto",
          format: "m3u8",
        });
      }
    }

    // Configure image optimization
    if (resource_type === "image") {
      uploadOptions.transformation = [{ fetch_format: "auto", quality: "auto" }];
    }

    try {
      // ✅ Create Cloudinary upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary error:", error);
            return reject(
              new Error(`Cloudinary upload failed: ${error.message}`)
            );
          }
          if (!result || !result.secure_url) {
            return reject(
              new Error("Cloudinary returned invalid or empty response.")
            );
          }
          resolve(result);
        }
      );

      // ✅ Convert buffer to stream and pipe it directly
      const readStream = streamifier.createReadStream(buffer);

      // Track upload progress if callback is provided
      if (onProgress) {
        let uploaded = 0;
        const total = buffer.length;

        readStream.on("data", (chunk) => {
          uploaded += chunk.length;
          const percent = Math.round((uploaded / total) * 100);
          onProgress(percent);
        });
      }

      // Start streaming to Cloudinary
      readStream.pipe(uploadStream);
    } catch (err) {
      console.error("❌ Unexpected error in uploadBufferToCloudinary:", err);
      reject(err);
    }
  });
}
