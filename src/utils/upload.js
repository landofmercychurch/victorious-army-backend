import cloudinary from "../config/cloudinary.js";

/**
 * Upload a file buffer to Cloudinary with smart optimisation and large file support.
 *
 * Handles:
 *  - Large videos (up to ~1GB safely)
 *  - Auto compression and HLS streaming for adaptive playback
 *  - Images with smart optimisation
 *
 * Example:
 * await uploadBufferToCloudinary(file.buffer, {
 *   folder: "sermons",
 *   resource_type: "video",
 *   hls: true
 * });
 */

export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      folder = "uploads",
      resource_type = "auto",
      hls = false, // if true, generate HLS streaming version
    } = options;

    // ✅ Cloudinary upload settings
    const uploadOptions = {
      folder,
      resource_type,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      timeout: 1800000, // 30 minutes (for large videos)
      eager: [],
      eager_async: false,
    };

    // ✅ Handle video uploads
    if (resource_type === "video") {
      uploadOptions.chunk_size = 6_000_000; // ~6MB chunks for large uploads

      // Convert and optimise to MP4 for playback
      uploadOptions.eager.push({
        transformation: [
          { fetch_format: "auto", quality: "auto", vc: "auto", h: 720 },
        ],
        format: "mp4",
      });

      // Add HLS streaming if requested
      if (hls) {
        uploadOptions.eager.push({
          streaming_profile: "auto",
          format: "m3u8",
        });
      }
    }

    // ✅ Handle image uploads
    if (resource_type === "image") {
      uploadOptions.transformation = [
        { fetch_format: "auto", quality: "auto" },
      ];
    }

    // ✅ Upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) {
          console.error("[CLOUDINARY ERROR]", err);
          reject(new Error(`Cloudinary upload failed: ${err.message}`));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}
