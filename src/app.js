import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { handleFileUpload } from "./controllers/uploadsStatusController.js";

dotenv.config();

// ===== ROUTES =====
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
import ambientRoutes from "./routes/ambientRoutes.js";
import uploadsStatusRoutes from "./routes/uploadsStatusRoutes.js";



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
      // Allow requests with no origin (like Postman, SSR, etc.)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      console.warn(`🚫 CORS blocked request from: ${origin}`);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ==========================================
// ⚙️ Body Parser Limits — allow large JSON payloads
// ==========================================
// These limits apply to JSON/text data only, not video uploads handled by Multer
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ==========================================
// 🛤️ Routes
// ==========================================
app.use("/api/daily-verse", dailyVerseRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/memorials", memorialsRoutes);
app.use("/api/sermons", sermonsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/admin/posts", adminPostsRoutes);
app.use("/posts/preview", postsPreviewRoutes);
app.use("/api/ebooks", ebooksRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/admin/comments", adminCommentsRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/ambient", ambientRoutes);
app.use("/api/uploadsStatus", uploadsStatusRoutes);
// ==========================================
// ❤️ Health Check Route
// ==========================================
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Church backend running ✅" });
});

// ==========================================
// 🚫 404 Not Found Handler
// ==========================================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ==========================================
// 🚨 Global Error Handler (including Multer & CORS)
// ==========================================
app.use((err, req, res, next) => {
  // Handle blocked CORS origin
  if (err.message === "Not allowed by CORS") {
    console.warn("🚫 Blocked by CORS policy:", req.headers.origin);
    return res.status(403).json({ error: "CORS: Access denied" });
  }

  console.error("❌ Server error:", err.message);

  if (err.message.includes("file too large")) {
    return res.status(413).json({ error: "Uploaded file exceeds 1GB limit" });
  }

  res.status(500).json({ error: err.message || "Internal Server Error" });
});

export default app;
