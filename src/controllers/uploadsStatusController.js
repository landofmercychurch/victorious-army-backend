// src/controllers/uploadsStatusController.js
import { uploadBufferToCloudinary } from "../utils/upload.js";

/**
 * Generic file upload handler
 */
export async function handleFileUpload(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedResults = [];

    for (const file of req.files) {
      try {
        const result = await uploadBufferToCloudinary(file.buffer, {
          folder: req.body.folder || undefined,
          public_id: req.body.public_id || undefined,
        });
        uploadedResults.push({
          filename: file.originalname,
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (err) {
        // Return error for this file without crashing whole upload
        uploadedResults.push({
          filename: file.originalname,
          error: err.message,
        });
      }
    }

    // If all failed
    const allFailed = uploadedResults.every(r => r.error);
    if (allFailed) {
      return res.status(500).json({ error: "All files failed to upload", details: uploadedResults });
    }

    res.status(200).json({ success: true, files: uploadedResults });
  } catch (err) {
    console.error("Upload handler error:", err);
    res.status(500).json({ error: err.message });
  }
}
