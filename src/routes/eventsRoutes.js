// src/routes/eventsRoutes.js
import express from "express";
import { 
  listEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from "../controllers/eventsController.js";
import { authenticateJWT } from "../middleware/adminAuth.js";

const router = express.Router();

/**
 * ===============================
 * Public Routes
 * ===============================
 */

// GET /api/events - List all events (public)
router.get("/", listEvents);

/**
 * ===============================
 * Admin Routes (require JWT)
 * ===============================
 */

// POST /api/events - Create a new event
router.post("/", authenticateJWT, createEvent);

// PUT /api/events/:id - Update an existing event
router.put("/:id", authenticateJWT, updateEvent);

// DELETE /api/events/:id - Delete an existing event
router.delete("/:id", authenticateJWT, deleteEvent);

export default router;
