// src/controllers/picturePostsController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

export async function listPicturePosts(req, res) {
  try {
    const { data, error } = await supabase.from("picture_posts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createPicturePost(req, res) {
  try {
    const { caption } = req.body;
    let image_url = null;
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer, { folder: "picture_posts" });
      image_url = result.secure_url;
    }
    const { data, error } = await supabase.from("picture_posts").insert([{ caption, image_url }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}