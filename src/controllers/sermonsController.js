// src/controllers/sermonsController.js
import { supabase } from "../config/supabase.js";
import cloudinary from "../config/cloudinary.js";

export async function listSermons(req, res) {
  try {
    const { data, error } = await supabase
      .from("sermons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createSermon(req, res) {
  try {
    const { title, description } = req.body;
    let video_url = null;
    let thumbnail_url = null;

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "video", folder: "sermons" },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      video_url = result.secure_url;

      // Auto-generate thumbnail from Cloudinary (snapshot at 5 seconds)
      if (result.public_id) {
        thumbnail_url = cloudinary.url(result.public_id + ".jpg", {
          resource_type: "video",
          format: "jpg",
          transformation: [{ start_offset: "5", width: 640, height: 360, crop: "fill" }],
        });
      }
    }

    const { data, error } = await supabase
      .from("sermons")
      .insert([{ title, description, video_url, thumbnail_url }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
