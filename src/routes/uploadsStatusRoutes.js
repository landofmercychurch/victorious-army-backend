// src/routes/uploadsStatusRoutes.js
import express from "express";
import multer from "multer";
import { handleFileUpload } from "../controllers/uploadsStatusController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload
// Accept multiple files from admin with real-time status
router.post("/", upload.array("files"), handleFileUpload);

export default router;
