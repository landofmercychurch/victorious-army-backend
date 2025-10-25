// src/utils/upload.js
import cloudinary from "../config/cloudinary.js";

/**
 * Upload a buffer to Cloudinary with smart optimisation.
 *
 * Supports:
 *  - Videos (auto compression + optional HLS streaming)
 *  - Images (auto format + compression)
 *
 * Example usage:
 * await uploadBufferToCloudinary(file.buffer, { folder: "sermons", resource_type: "video", hls: true });
 */

export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      folder = "uploads",
      resource_type = "auto",
      hls = false, // if true, generate HLS stream too
    } = options;

    const uploadOptions = {
      folder,
      resource_type,
      eager: [],
      eager_async: false,
    };

    if (resource_type === "video") {
      // --- Video Transformations ---
      uploadOptions.eager.push({
        // ✅ Optimised MP4 for web
        transformation: [
          { fetch_format: "auto", quality: "auto", vc: "auto", h: 720 },
        ],
        format: "mp4",
      });

      if (hls) {
        // ✅ HLS adaptive streaming
        uploadOptions.eager.push({
          streaming_profile: "auto",
          format: "m3u8",
        });
      }
    } else if (resource_type === "image") {
      // --- Image Optimisation ---
      uploadOptions.transformation = [{ fetch_format: "auto", quality: "auto" }];
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}
