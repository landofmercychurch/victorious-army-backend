import cloudinary from "../config/cloudinary.js";

/**
 * Upload a file buffer to Cloudinary with smart optimisation and large file support.
 *
 * Handles:
 *  - Large videos (up to ~1GB safely)
 *  - Auto compression and WebM conversion for lightweight playback
 *  - Optional HLS streaming
 *  - Images with smart optimisation
 *
 * Example:
 * await uploadBufferToCloudinary(file.buffer, {
 *   folder: "sermons",
 *   resource_type: "video",
 *   hls: true,
 *   originalFormat: file.mimetype // to detect .webm input
 * });
 */

export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      folder = "uploads",
      resource_type = "auto",
      hls = false, // if true, generate HLS streaming version
      originalFormat = "", // detect if it's already WebM
    } = options;

    // ✅ Setup Cloudinary upload settings
    const uploadOptions = {
      folder,
      resource_type,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      timeout: 1800000, // 30 minutes (for large uploads)
      eager: [],
      eager_async: false,
    };

    // ✅ Handle video uploads
    if (resource_type === "video") {
      uploadOptions.chunk_size = 6_000_000; // ~6MB chunks

      const isWebM =
        originalFormat?.includes("webm") ||
        originalFormat?.toLowerCase().endsWith(".webm");

      if (!isWebM) {
        // 🔄 Convert non-WebM videos to WebM
        uploadOptions.eager.push({
          transformation: [
            { fetch_format: "webm", quality: "auto", vc: "vp9", h: 720 },
          ],
          format: "webm",
        });
      } else {
        // 🚫 Keep original WebM without transformation
        console.log("⚙️ File is already WebM — skipping conversion.");
      }

      if (hls) {
        // 🎞️ Optional HLS adaptive streaming
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

    console.log("☁️ Uploading to Cloudinary:", {
      folder,
      type: resource_type,
      format: originalFormat,
      convertToWebM: resource_type === "video" && !originalFormat.includes("webm"),
    });

    // ✅ Stream upload
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) {
          console.error("[CLOUDINARY ERROR]", err);
          return reject(new Error(`Cloudinary upload failed: ${err.message}`));
        }
        console.log("✅ Cloudinary upload complete:", result.public_id);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}
