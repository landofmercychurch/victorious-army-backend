import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer"; // ✅ For file uploads
dotenv.config();

import dailyVerseRoutes from "./routes/dailyVerseRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import memorialsRoutes from "./routes/memorialsRoutes.js";
import sermonsRoutes from "./routes/sermonsRoutes.js";
import postsRoutes from "./routes/postsRoutes.js";
import adminPostsRoutes from "./routes/adminPostsRoutes.js";
import postsPreviewRoutes from "./routes/postsPreviewRoutes.js";
import ebooksRoutes from "./routes/ebooksRoutes.js";
import commentsRoutes from "./routes/commentsRoutes.js";
import adminCommentsRoutes from "./routes/adminCommentsRoutes.js";
import likesRoutes from "./routes/likesRoutes.js";

const app = express();

// ==========================================
// 🌐 CORS Configuration
// ==========================================
const allowedOrigins = [
  "https://victoriousarmyrevivalmovementchurch.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("CORS blocked"));
    },
    credentials: true,
  })
);

// ==========================================
// ⚙️ Body Parser Limits — allow large form uploads
// ==========================================
app.use(express.json({ limit: "1gb" })); // handle large JSON if ever needed
app.use(express.urlencoded({ limit: "1gb", extended: true }));

// ==========================================
// 📂 Multer Configuration (for Cloudinary uploads)
// ==========================================

// Use in-memory storage for direct Cloudinary streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024, // 1GB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/mkv", "video/quicktime"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file format. Use MP4 or WebM."));
    }
    cb(null, true);
  },
});

// Make the upload middleware available globally (for example, sermons route)
app.set("upload", upload);

// ==========================================
// 🛤️ Routes
// ==========================================
app.use("/api/daily-verse", dailyVerseRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/memorials", memorialsRoutes);
app.use("/api/sermons", sermonsRoutes); // sermonsRoutes will use multer memory upload
app.use("/api/posts", postsRoutes);
app.use("/api/admin/posts", adminPostsRoutes);
app.use("/posts/preview", postsPreviewRoutes);
app.use("/api/ebooks", ebooksRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/admin/comments", adminCommentsRoutes);
app.use("/api/likes", likesRoutes);

// ==========================================
// ❤️ Health Check
// ==========================================
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Church backend running" });
});

// ==========================================
// 🚨 Global Error Handler (useful for multer errors)
// ==========================================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  if (err.message.includes("file too large")) {
    return res.status(413).json({ error: "Uploaded file exceeds 1GB limit" });
  }
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

export default app;
