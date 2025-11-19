// src/controllers/eventsController.js
import { supabase } from "../config/supabase.js";

/**
 * Public: List all events
 */
export async function listEvents(req, res) {
  try {
    console.log("📖 Fetching all events...");
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_at", { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data.length} events`);
    return res.json(data);
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Create a new event
 */
export async function createEvent(req, res) {
  try {
    const { title, description, start_at, location } = req.body;
    const created_by = req.user.id; // RLS ownership

    console.log("📝 Creating event:", { title, start_at, created_by });

    if (!title || !start_at) {
      return res.status(400).json({ error: "Title and start_at are required" });
    }

    const { data, error } = await supabase
      .from("events")
      .insert([{ title, description, start_at, location, created_by }])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Event created:", data);
    return res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error creating event:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Update an existing event
 */
export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { title, description, start_at, location } = req.body;
    const adminId = req.user.id;

    console.log("✏️ Updating event:", id, { title, start_at, adminId });

    const { data, error } = await supabase
      .from("events")
      .update({ title, description, start_at, location })
      .eq("id", id)
      .eq("created_by", adminId) // RLS: only update own events
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Event not found or unauthorized" });

    console.log("✅ Event updated:", data);
    return res.json(data);
  } catch (err) {
    console.error("❌ Error updating event:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Delete an existing event
 */
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    console.log("🗑️ Deleting event:", id, { adminId });

    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("created_by", adminId) // RLS: only delete own events
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn("⚠️ Event not found or unauthorized for deletion:", id);
      return res.status(404).json({ error: "Event not found or unauthorized" });
    }

    console.log("✅ Event deleted successfully:", id);
    return res.json({ success: true, message: "Event deleted successfully", data });
  } catch (err) {
    console.error("❌ Error deleting event:", err);
    return res.status(500).json({ error: err.message });
  }
}
