// src/routes/eventsRoutes.js
import express from "express";
import { listEvents, createEvent, updateEvent } from "../controllers/eventsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// GET all events
router.get("/", listEvents);

// Admin: create event
router.post("/", requireAdmin, createEvent);

// Admin: update event
router.put("/:id", requireAdmin, updateEvent);

export default router;
