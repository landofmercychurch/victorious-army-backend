// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { fileTypeFromBuffer } from "file-type";

/**
 * Universal Cloudinary uploader with:
 * - Safe fallback for MP4 videos whose MIME cannot be detected
 * - Reliable URL + public_id return for ALL videos (compressed/uncompressed)
 * - Progress tracking for video uploads
 */
export async function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
  let detected = await fileTypeFromBuffer(buffer);
  let mime = detected?.mime;

  console.log("🔍 Detected MIME:", mime);

  // ==========================================
  // ⭐ CRITICAL FIX: When detection fails
  // ==========================================
  if (!mime || mime === "application/octet-stream") {
    console.log("⚠️ MIME detection failed — forcing video/mp4 fallback.");
    mime = "video/mp4";
  }

  const isVideo = mime.startsWith("video/");
  const isImage = mime.startsWith("image/");
  const isAudio = mime.startsWith("audio/");
  const isPdf = mime === "application/pdf";

  const {
    folder = isVideo
      ? "videos"
      : isAudio
      ? "ambient"
      : isPdf
      ? "ebooks"
      : "memorials",
    public_id = undefined,
  } = options;

  const cleanFolder = folder.trim();

  // ==========================================
  // Configure upload-type specific options
  // ==========================================
  let uploadOptions;
  if (isVideo) {
    console.log("🎥 Treating file as VIDEO upload (Cloudinary resource_type=video)");

    uploadOptions = {
      resource_type: "video",
      folder: cleanFolder,
      use_filename: true,
      unique_filename: true,
      public_id,
      chunk_size: 6000000, // 6MB
      eager: [
        { transformation: [{ fetch_format: "mp4", quality: "auto", h: 720 }] },
        { transformation: [{ fetch_format: "webm", quality: "auto", vc: "vp9", h: 720 }] },
      ],
    };
  } else if (isAudio) {
    uploadOptions = {
      resource_type: "video",
      folder: cleanFolder,
      use_filename: true,
      unique_filename: true,
      allowed_formats: ["mp3", "wav", "m4a", "aac", "ogg"],
      public_id,
    };
  } else if (isPdf) {
    uploadOptions = {
      resource_type: "raw",
      folder: cleanFolder,
      use_filename: true,
      unique_filename: true,
      allowed_formats: ["pdf"],
      public_id,
    };
  } else {
    uploadOptions = {
      resource_type: "image",
      folder: cleanFolder,
      use_filename: true,
      unique_filename: true,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id,
    };
  }

  console.log(
    `📤 Uploading file as: ${isVideo ? "VIDEO" : isImage ? "IMAGE" : isAudio ? "AUDIO" : "PDF"} to '${cleanFolder}'`
  );

  // ==========================================
  // VIDEO STREAM UPLOAD WITH PROGRESS
  // ==========================================
  if (isVideo && onProgress) {
    return new Promise((resolve, reject) => {
      const readStream = streamifier.createReadStream(buffer);
      let uploaded = 0;
      const total = buffer.length;

      readStream.on("data", (chunk) => {
        uploaded += chunk.length;
        onProgress(Math.round((uploaded / total) * 100));
      });

      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));

        if (!result?.secure_url || !result?.public_id) {
          console.error("❌ CLOUDINARY RETURNED INVALID VIDEO RESPONSE:", result);
          return reject(new Error("Cloudinary failed to return secure_url or public_id."));
        }

        resolve(result);
      });

      readStream.pipe(uploadStream);
    });
  }

  // ==========================================
  // Non-video upload (or video without progress)
  // ==========================================
  const result = await cloudinary.uploader.upload(buffer, uploadOptions);

  if (!result?.secure_url || !result?.public_id) {
    throw new Error("❌ Cloudinary returned invalid response for non-progress upload.");
  }

  return result;
}
