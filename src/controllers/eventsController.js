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
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Create a new event
 */
export async function createEvent(req, res) {
  try {
    const { title, description, start_at, location } = req.body;
    console.log("📝 Creating event:", { title, start_at });

    if (!title || !start_at) {
      return res.status(400).json({ error: "title and start_at required" });
    }

    const { data, error } = await supabase
      .from("events")
      .insert([{ title, description, start_at, location }])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Event created:", data);
    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error creating event:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Update an existing event
 */
export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { title, description, start_at, location } = req.body;
    console.log("✏️ Updating event:", id, { title, start_at });

    const { data, error } = await supabase
      .from("events")
      .update({ title, description, start_at, location })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Event not found" });

    console.log("✅ Event updated:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Error updating event:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Delete an existing event
 */
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting event:", id);

    // Add `.select()` to get deleted row and prevent false 404
    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn("⚠️ Event not found for deletion:", id);
      return res.status(404).json({ error: "Event not found" });
    }

    console.log("✅ Event deleted successfully:", id);
    res.json({ success: true, message: "Event deleted successfully", data });
  } catch (err) {
    console.error("❌ Error deleting event:", err);
    res.status(500).json({ error: err.message });
  }
}
