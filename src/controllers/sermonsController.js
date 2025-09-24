// src/controllers/sermonsController.js
import { supabase } from "../config/supabase.js";
import cloudinary from "../config/cloudinary.js";

export async function listSermons(req, res) {
  try {
    const { data, error } = await supabase.from("sermons").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createSermon(req, res) {
  try {
    const { title, description } = req.body;
    let video_url = null;

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: "video", folder: "sermons" }, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
        stream.end(req.file.buffer);
      });
      video_url = result.secure_url;
    }

    const { data, error } = await supabase.from("sermons").insert([{ title, description, video_url }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}