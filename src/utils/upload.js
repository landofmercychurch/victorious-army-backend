// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

/**
 * Upload a video buffer to Cloudinary with multiple formats (HLS, MP4, MOV, WebM) and optional progress tracking.
 * @param {Buffer} buffer - The file buffer from multer.memoryStorage().
 * @param {Object} options - Upload options (folder, resource_type, originalFormat, etc.)
 * @param {Function} [onProgress] - Optional callback(percent) for upload progress.
 * @returns {Promise<Object>} Cloudinary upload result including URLs for HLS, MP4, MOV, WebM.
 */
export async function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const {
      folder = "uploads",
      resource_type = "video",
      originalFormat = "",
    } = options;

    const uploadOptions = {
      folder,
      resource_type,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      timeout: 600000, // 10 min
      eager: [],
    };

    // ✅ Video transforms
    if (resource_type === "video") {
      uploadOptions.chunk_size = 10_000_000; // 10 MB

      // WebM fallback
      uploadOptions.eager.push({
        transformation: [{ fetch_format: "webm", quality: "auto", vc: "vp9", h: 720 }],
        format: "webm",
      });

      // MP4 fallback
      uploadOptions.eager.push({
        transformation: [{ fetch_format: "mp4", quality: "auto", h: 720 }],
        format: "mp4",
      });

      // MOV fallback
      uploadOptions.eager.push({
        transformation: [{ fetch_format: "mov", quality: "auto", h: 720 }],
        format: "mov",
      });

      // HLS streaming
      uploadOptions.eager.push({
        transformation: [],
        format: "m3u8",
        flags: "streaming",
      });
    }

    try {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }

        // Defensive check
        if (!result || typeof result !== "object" || !result.secure_url) {
          console.error("⚠️ Unexpected Cloudinary response:", result);
          return reject(new Error("Cloudinary returned invalid response."));
        }

        // Extract URLs
        const urls = {
          original_url: result.secure_url,
          hls_url: "",
          mp4_url: "",
          mov_url: "",
          webm_url: "",
        };

        if (Array.isArray(result.eager)) {
          result.eager.forEach(e => {
            if (e.format === "m3u8") urls.hls_url = e.secure_url;
            else if (e.format === "mp4") urls.mp4_url = e.secure_url;
            else if (e.format === "mov") urls.mov_url = e.secure_url;
            else if (e.format === "webm") urls.webm_url = e.secure_url;
          });
        }

        resolve({ ...result, urls });
      });

      // Stream buffer
      const readStream = streamifier.createReadStream(buffer);

      if (onProgress) {
        let uploaded = 0;
        const total = buffer.length;
        readStream.on("data", chunk => {
          uploaded += chunk.length;
          onProgress(Math.round((uploaded / total) * 100));
        });
      }

      readStream.pipe(uploadStream);
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      reject(err);
    }
  });
}
