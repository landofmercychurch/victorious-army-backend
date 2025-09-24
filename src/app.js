// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import dailyVerseRoutes from "./routes/dailyVerseRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import memorialsRoutes from "./routes/memorialsRoutes.js";
import sermonsRoutes from "./routes/sermonsRoutes.js";
import picturePostsRoutes from "./routes/picturePostsRoutes.js";
import ebooksRoutes from "./routes/ebooksRoutes.js";
import commentsRoutes from "./routes/commentsRoutes.js";
import likesRoutes from "./routes/likesRoutes.js";

const app = express();

const allowedOrigins = [
  // add your frontends
  "https://victoriousarmyrevivalmovementchurch.netlify.app",
  "http://localhost:5173"
];

app.use(cors({ origin: (origin, cb) => { if(!origin || allowedOrigins.includes(origin)) cb(null, true); else cb(new Error("CORS blocked")); }, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/api/daily-verse", dailyVerseRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/memorials", memorialsRoutes);
app.use("/api/sermons", sermonsRoutes);
app.use("/api/picture-posts", picturePostsRoutes);
app.use("/api/ebooks", ebooksRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/likes", likesRoutes);

// basic health
app.get("/", (req, res) => res.json({ ok: true, message: "Church backend running" }));

export default app;
