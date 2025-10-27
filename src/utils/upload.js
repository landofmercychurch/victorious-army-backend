// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

/**
 * Safely uploads a video (or image) buffer to Cloudinary via stream.
 * Supports short and medium uploads, avoids malformed JSON and client disconnect errors.
 *
 * @param {Buffer} buffer - The file buffer from multer.memoryStorage().
 * @param {Object} options - Upload options (folder, resource_type, etc.).
 * @param {Function} [onProgress] - Optional callback(percent) for upload progress.
 * @returns {Promise<Object>} Cloudinary upload result (secure_url, public_id, etc.).
 */
export async function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const {
      folder = "uploads",
      resource_type = "video", // explicitly default to video for sermons
      originalFormat = "",
    } = options;

    const uploadOptions = {
      folder,
      resource_type,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      timeout: 600000, // 10 minutes max
      eager: [],
    };

    // ✅ Configure video streaming upload safely
    if (resource_type === "video") {
      uploadOptions.chunk_size = 10_000_000; // 10 MB chunks (safe and efficient)
      const isWebM = originalFormat.toLowerCase().endsWith(".webm");

      // Convert video to webm for web optimisation (non-HLS)
      uploadOptions.eager.push({
        transformation: isWebM
          ? []
          : [{ fetch_format: "webm", quality: "auto", vc: "vp9", h: 720 }],
        format: "webm",
      });

      // ❌ Removed HLS eager transform to avoid "#EXTM3U" JSON parsing issue
      // ✅ You can manually create the HLS URL later using:
      // const hls_url = `https://res.cloudinary.com/${cloudName}/video/upload/fl_streaming:auto/${public_id}.m3u8`;
    }

    // ✅ Image optimisation (not needed for sermons but kept safe)
    if (resource_type === "image") {
      uploadOptions.transformation = [{ fetch_format: "auto", quality: "auto" }];
    }

    try {
      // ✅ Create upload stream to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("❌ Cloudinary error:", error);
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }

        // ✅ Defensive: verify Cloudinary returned a valid JSON response
        if (!result || typeof result !== "object" || !result.secure_url) {
          console.error("⚠️ Unexpected Cloudinary response:", result);
          return reject(new Error("Cloudinary returned invalid or non-JSON response."));
        }

        resolve(result);
      });

      // ✅ Convert buffer to readable stream
      const readStream = streamifier.createReadStream(buffer);

      // ✅ Track progress for frontend feedback
      if (onProgress) {
        let uploaded = 0;
        const total = buffer.length;

        readStream.on("data", (chunk) => {
          uploaded += chunk.length;
          const percent = Math.round((uploaded / total) * 100);
          onProgress(percent);
        });
      }

      // ✅ Pipe stream to Cloudinary
      readStream.pipe(uploadStream);
    } catch (err) {
      console.error("❌ Unexpected error in uploadBufferToCloudinary:", err);
      reject(err);
    }
  });
}

