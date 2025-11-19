// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { fileTypeFromBuffer } from "file-type";

/**
 * Cloudinary uploader:
 * - Proper MIME fallback (important for compressed MP4s)
 * - No slow eager transformations during upload
 * - Async transformation support (eager_async)
 * - Smaller chunk size for smoother uploads
 */
export async function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
  let detected = await fileTypeFromBuffer(buffer);
  let mime = detected?.mime;

  console.log("🔍 Detected MIME:", mime);

  // ==========================================
  // ⭐ CRITICAL FIX: Cloudinary compressed videos often lose MIME type
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
  // ⭐ FIX 1 — NO eager transformations during upload
  // ⭐ FIX 2 — Use eager_async for later processing
  // ⭐ FIX 3 — Reduce chunk size from 6MB → 2MB
  // ==========================================
  let uploadOptions;

  if (isVideo) {
    console.log("🎥 Treating file as VIDEO upload");

    uploadOptions = {
      resource_type: "video",
      folder: cleanFolder,
      use_filename: true,
      unique_filename: true,
      public_id,

      // ✅ FIX 1: Reduce chunk size
      chunk_size: 2000000, // 2MB

      // ❌ REMOVE eager transforms (slow + blocks database insert)
      eager: [],

      // ✅ FIX 3: Async transformations (optional)
      eager_async: true,
    };
  }

  else if (isAudio) {
    uploadOptions = {
      resource_type: "video",
      folder: cleanFolder,
      public_id,
      use_filename: true,
      unique_filename: true,
      allowed_formats: ["mp3", "wav", "m4a", "aac", "ogg"],
    };
  }

  else if (isPdf) {
    uploadOptions = {
      resource_type: "raw",
      folder: cleanFolder,
      public_id,
      use_filename: true,
      unique_filename: true,
      allowed_formats: ["pdf"],
    };
  }

  else {
    uploadOptions = {
      resource_type: "image",
      folder: cleanFolder,
      public_id,
      use_filename: true,
      unique_filename: true,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    };
  }

  console.log(`📤 UPLOADING AS: ${mime} to '${cleanFolder}'`);

  // ==========================================
  // VIDEO STREAM UPLOAD (with progress)
  // ==========================================
  if (isVideo && onProgress) {
    return new Promise((resolve, reject) => {
      const readStream = streamifier.createReadStream(buffer);
      let uploaded = 0;
      const total = buffer.length;

      readStream.on("data", (chunk) => {
        uploaded += chunk.length;
        const percent = Math.round((uploaded / total) * 100);
        onProgress(percent);
      });

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);

          if (!result?.secure_url || !result?.public_id) {
            return reject(new Error("Cloudinary did not return secure_url/public_id"));
          }

          resolve(result);
        }
      );

      readStream.pipe(uploadStream);
    });
  }

  // ==========================================
  // Non-video direct upload
  // ==========================================
  const result = await cloudinary.uploader.upload(buffer, uploadOptions);

  if (!result?.secure_url || !result?.public_id) {
    throw new Error("Cloudinary returned invalid upload response.");
  }

  return result;
}
