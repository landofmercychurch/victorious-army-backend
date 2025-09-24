// src/controllers/memorialsController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

export async function listMemorials(req, res) {
  try {
    const { data, error } = await supabase.from("memorials").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createMemorial(req, res) {
  try {
    // req.files is array from multer
    const { title, description } = req.body;
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "At least one image required." });

    const uploaded = [];
    for (const file of req.files) {
      const result = await uploadBufferToCloudinary(file.buffer, { folder: `memorials` });
      uploaded.push({ url: result.secure_url, public_id: result.public_id });
    }

    // store one record with images array
    const { data, error } = await supabase
      .from("memorials")
      .insert([{ title, description, images: uploaded }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}