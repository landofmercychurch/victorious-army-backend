// src/controllers/dailyVerseController.js
import { supabase } from "../config/supabase.js";

/**
 * Public: GET latest verse
 * Admin: POST/PUT to create/update
 */
export async function getLatestVerse(req, res) {
  try {
    const { data, error } = await supabase
      .from("daily_verses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return res.json(data[0] || null);
  } catch (err) {
    console.error("getLatestVerse error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function createVerse(req, res) {
  try {
    const { reference, text } = req.body;
    if (!reference || !text) return res.status(400).json({ error: "reference and text required" });

    const { data, error } = await supabase
      .from("daily_verses")
      .insert([{ reference, text }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("createVerse error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateVerse(req, res) {
  try {
    const { id } = req.params;
    const { reference, text } = req.body;
    const { data, error } = await supabase
      .from("daily_verses")
      .update({ reference, text })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("updateVerse error:", err);
    res.status(500).json({ error: err.message });
  }
}