// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { fileTypeFromBuffer } from "file-type"; // ✅ fixed import

/**
 * Universal Cloudinary uploader:
 * - Auto-detects image, video, or audio
 * - Handles transformations automatically
 * - Returns secure Cloudinary URLs
 */
export async function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime || "application/octet-stream";

  const isVideo = mime.startsWith("video/");
  const isImage = mime.startsWith("image/");
  const isAudio = mime.startsWith("audio/");

  if (!isVideo && !isImage && !isAudio) {
    throw new Error(`Unsupported file type: ${mime}`);
  }

  const {
    folder = isVideo ? "videos" : isAudio ? "ambient" : "memorials",
    public_id = undefined,
  } = options;

  // 🔧 Configure upload options by media type
  const uploadOptions = isVideo
    ? {
        folder,
        resource_type: "video",
        use_filename: true,
        unique_filename: true,
        eager: [
          {
            transformation: [{ fetch_format: "mp4", quality: "auto", h: 720 }],
            format: "mp4",
          },
          {
            transformation: [{ fetch_format: "webm", quality: "auto", vc: "vp9", h: 720 }],
            format: "webm",
          },
        ],
      }
    : isAudio
    ? {
        folder,
        resource_type: "video", // Cloudinary treats audio as "video"
        use_filename: true,
        unique_filename: true,
        allowed_formats: ["mp3", "wav", "m4a", "aac", "ogg"],
      }
    : {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      };

  console.log(`📤 Uploading ${mime} to folder '${folder}' (${isVideo ? "video" : isAudio ? "audio" : "image"})`);

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        if (!result?.secure_url) return reject(new Error("Cloudinary returned invalid response."));
        resolve(result);
      });

      const readStream = streamifier.createReadStream(buffer);

      // Optional upload progress tracking
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
