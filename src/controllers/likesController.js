// src/controllers/likesController.js
import { supabase } from "../config/supabase.js";

export async function createLike(req, res) {
  try {
    const { post_id, sermon_id } = req.body;

    if (!post_id && !sermon_id) {
      return res.status(400).json({ error: "post_id or sermon_id is required" });
    }

    const { data, error } = await supabase
      .from("likes")
      .insert([{ post_id, sermon_id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function countLikes(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.query; // ?type=post or ?type=sermon

    let query = supabase.from("likes").select("*", { count: "exact", head: true });

    if (type === "post") query = query.eq("post_id", id);
    else if (type === "sermon") query = query.eq("sermon_id", id);
    else return res.status(400).json({ error: "type must be 'post' or 'sermon'" });

    const { count, error } = await query;

    if (error) throw error;

    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
