import cloudinary from "../config/cloudinary.js";

/**
 * Upload a large video or image buffer to Cloudinary with progress tracking
 * @param {Buffer} buffer
 * @param {Object} options
 * @param {Function} [onProgress] - Optional progress callback (0–100)
 */
export function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
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
      timeout: 1800000, // 30 mins
      eager: [],
    };

    // Handle video
    if (resource_type === "video") {
      uploadOptions.chunk_size = 6_000_000; // 6MB
      const isWebM = originalFormat.toLowerCase().endsWith(".webm");

      uploadOptions.eager.push({
        transformation: isWebM
          ? [] // keep as is
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

    // Handle image
    if (resource_type === "image") {
      uploadOptions.transformation = [{ fetch_format: "auto", quality: "auto" }];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) reject(new Error(`Cloudinary upload failed: ${err.message}`));
        else resolve(result);
      }
    );

    // Track progress
    const CHUNK = 1024 * 256; // 256KB
    let uploaded = 0;

    for (let i = 0; i < buffer.length; i += CHUNK) {
      const chunk = buffer.subarray(i, i + CHUNK);
      uploadStream.write(chunk);
      uploaded += chunk.length;
      if (onProgress) {
        const percent = Math.round((uploaded / buffer.length) * 100);
        onProgress(percent);
      }
    }

    uploadStream.end();
  });
}
