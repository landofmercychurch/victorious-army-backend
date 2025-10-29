// src/controllers/uploadsStatusController.js
import { uploadBufferToCloudinary } from "../utils/upload.js";

/**
 * File upload with real-time progress using SSE
 */
export async function handleFileUploadSSE(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Set headers for SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  for (const file of req.files) {
    try {
      sendEvent({ filename: file.originalname, status: "uploading", progress: 0 });

      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: req.body.folder || undefined,
        public_id: req.body.public_id || undefined,
      }, (percent) => {
        sendEvent({ filename: file.originalname, status: "uploading", progress: percent });
      });

      sendEvent({ filename: file.originalname, status: "success", url: result.secure_url, progress: 100 });
    } catch (err) {
      sendEvent({ filename: file.originalname, status: "error", error: err.message, progress: 0 });
    }
  }

  // All files processed
  sendEvent({ status: "done" });
  res.end();
}
