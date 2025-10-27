// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

/**
 * Upload a video buffer to Cloudinary quickly, generate HLS URL manually,
 * and return MP4/MOV/WebM fallback URLs.
 * @param {Buffer} buffer - The file buffer from multer.memoryStorage().
 * @param {Object} options - { folder, resource_type, originalFormat, public_id }
 * @param {Function} [onProgress] - Optional progress callback(percent)
 * @returns {Promise<Object>} - { original_url, mp4_url, mov_url, webm_url, hls_url, public_id }
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
  };

  // Only create lightweight eager transforms for fallback formats
  if (resource_type === "video") {
    uploadOptions.eager = [
      { transformation: [{ fetch_format: "webm", quality: "auto", vc: "vp9", h: 720 }], format: "webm" },
      { transformation: [{ fetch_format: "mp4", quality: "auto", h: 720 }], format: "mp4" },
      { transformation: [{ fetch_format: "mov", quality: "auto", h: 720 }], format: "mov" },
    ];
    uploadOptions.chunk_size = 10_000_000; // 10 MB per chunk
  }

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        if (!result || !result.secure_url) return reject(new Error("Cloudinary returned invalid response."));

        // Construct HLS URL manually from public_id
        const publicId = result.public_id;
        const cloudName = cloudinary.config().cloud_name;
        const hls_url = `https://res.cloudinary.com/${cloudName}/video/upload/fl_streaming:auto/${publicId}.m3u8`;

        // Collect fallback URLs
        const urls = {
          original_url: result.secure_url,
          hls_url,
          mp4_url: "",
          mov_url: "",
          webm_url: "",
        };

        if (Array.isArray(result.eager)) {
          result.eager.forEach(e => {
            if (e.format === "mp4") urls.mp4_url = e.secure_url;
            else if (e.format === "mov") urls.mov_url = e.secure_url;
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
