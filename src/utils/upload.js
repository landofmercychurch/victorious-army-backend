// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

/**
 * Upload a video buffer to Cloudinary with:
 * - Automatic HLS streaming (via sp_auto)
 * - MP4/WebM fallback for browsers
 * @param {Buffer} buffer - File buffer from multer.memoryStorage()
 * @param {Object} options - { folder, resource_type, originalFormat, public_id }
 * @param {Function} [onProgress] - Optional progress callback(percent)
 * @returns {Promise<Object>} - { original_url, hls_url, mp4_url, webm_url, public_id }
 */
export async function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
  const {
    folder = "uploads",
    resource_type = "video",
    originalFormat = "",
    public_id = undefined,
  } = options;

  const uploadOptions = {
    folder,
    resource_type,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    timeout: 600000, // 10 min
    public_id,
    // Only generate fallback formats eagerly
    eager: [
      { transformation: [{ fetch_format: "webm", quality: "auto", vc: "vp9", h: 720 }], format: "webm" },
      { transformation: [{ fetch_format: "mp4", quality: "auto", h: 720 }], format: "mp4" },
    ],
    chunk_size: 10_000_000, // 10 MB
  };

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        if (!result || !result.secure_url) return reject(new Error("Cloudinary returned invalid response."));

        // HLS URL (auto-generated, free-plan compatible)
        const cloudName = cloudinary.config().cloud_name;
        const hls_url = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/${result.public_id}.m3u8`;

        // Collect fallback URLs
        const urls = {
          original_url: result.secure_url,
          hls_url,
          mp4_url: "",
          webm_url: "",
        };

        if (Array.isArray(result.eager)) {
          result.eager.forEach(e => {
            if (e.format === "mp4") urls.mp4_url = e.secure_url;
            else if (e.format === "webm") urls.webm_url = e.secure_url;
          });
        }

        resolve({ ...result, urls });
      });

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
      reject(err);
    }
  });
}
