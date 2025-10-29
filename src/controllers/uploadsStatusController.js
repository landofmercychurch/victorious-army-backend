// ✅ src/controllers/uploadsStatusController.js
import { uploadBufferToCloudinary } from "../utils/upload.js";

export async function handleFileUploadSSE(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Transfer-Encoding": "chunked",
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // ✅ Force flush to client immediately
    if (res.flush) res.flush();
  };

  for (const file of req.files) {
    sendEvent({ filename: file.originalname, status: "uploading", progress: 0 });

    try {
      const result = await uploadBufferToCloudinary(
        file.buffer,
        {
          folder: req.body.folder || undefined,
          public_id: req.body.public_id || undefined,
        },
        (percent) => {
          sendEvent({
            filename: file.originalname,
            status: "uploading",
            progress: percent,
          });
        }
      );

      sendEvent({
        filename: file.originalname,
        status: "success",
        url: result.secure_url,
        public_id: result.public_id,
        progress: 100,
      });
    } catch (err) {
      sendEvent({
        filename: file.originalname,
        status: "error",
        error: err.message,
        progress: 0,
      });
    }
  }

  sendEvent({ status: "done" });
  res.end();
}
