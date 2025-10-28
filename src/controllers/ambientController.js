// src/controllers/ambientController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

/**
 * Upload a single ambient sound (looped background audio)
 */
export async function uploadAmbient(req, res) {
  try {
    console.log("🎵 Received ambient upload request...");

    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided." });
    }

    const { title = "Ambient Sound" } = req.body;

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "ambient",
    });

    console.log("✅ Ambient uploaded:", result.secure_url);

    // Optional: Save it in Supabase (you can skip this if you only need the URL)
    const { data, error } = await supabase
      .from("ambient_sounds")
      .insert([{ title, url: result.secure_url }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Ambient sound uploaded successfully", data });
  } catch (err) {
    console.error("❌ Ambient upload error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * List all ambient sounds
 */
export async function listAmbients(req, res) {
  try {
    const { data, error } = await supabase
      .from("ambient_sounds")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
