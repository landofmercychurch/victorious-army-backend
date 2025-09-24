// src/controllers/ebooksController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

export async function listEbooks(req, res) {
  try {
    const { data, error } = await supabase.from("ebooks").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function uploadEbook(req, res) {
  try {
    const { title, author } = req.body;
    if (!req.file) return res.status(400).json({ error: "PDF required" });

    const result = await uploadBufferToCloudinary(req.file.buffer, { folder: "ebooks", resource_type: "raw" });
    const pdf_url = result.secure_url;

    const { data, error } = await supabase.from("ebooks").insert([{ title, author, pdf_url }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}