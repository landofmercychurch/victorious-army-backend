// src/routes/eventsRoutes.js
import express from "express";
import { listEvents, createEvent, updateEvent } from "../controllers/eventsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", listEvents);
router.post("/", requireAdmin, createEvent);
router.put("/:id", requireAdmin, updateEvent);

export default router;