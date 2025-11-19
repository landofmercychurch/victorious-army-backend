// src/utils/upload.js
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { fileTypeFromBuffer } from "file-type";

/**
 * Universal Cloudinary uploader with progress tracking:
 * - Auto-detects image, video, audio, or PDF
 * - Handles transformations automatically
 * - Returns secure Cloudinary URLs
 * - Reports progress for video uploads
 */
export async function uploadBufferToCloudinary(buffer, options = {}, onProgress) {
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime || "application/octet-stream";

  const isVideo = mime.startsWith("video/");
  const isImage = mime.startsWith("image/");
  const isAudio = mime.startsWith("audio/");
  const isPdf = mime === "application/pdf";

  if (!isVideo && !isImage && !isAudio && !isPdf) {
    throw new Error(`Unsupported file type: ${mime}`);
  }

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

  // Configure upload options by type
  let uploadOptions;
  if (isVideo) {
    uploadOptions = {
      resource_type: "video",
      folder: cleanFolder,
      use_filename: true,
      unique_filename: true,
      public_id,
      chunk_size: 6000000, // 6 MB per chunk
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
    `📤 Uploading ${mime} to folder '${cleanFolder}' (${
      isVideo ? "video" : isAudio ? "audio" : isPdf ? "PDF" : "image"
    })`
  );

  // --- Video upload with progress ---
  if (isVideo && onProgress) {
    return new Promise((resolve, reject) => {
      const readStream = streamifier.createReadStream(buffer);
      let uploaded = 0;
      const total = buffer.length;

      // Track progress as data flows
      readStream.on("data", (chunk) => {
        uploaded += chunk.length;
        onProgress(Math.round((uploaded / total) * 100));
      });

      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        if (!result?.secure_url) return reject(new Error("Cloudinary returned invalid response."));
        resolve(result);
      });

      readStream.pipe(uploadStream);
    });
  }

  // --- Non-video files or videos without progress ---
  return cloudinary.uploader.upload(buffer, uploadOptions);
}
