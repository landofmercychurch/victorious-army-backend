// src/controllers/likesController.js
import { supabase } from "../config/supabase.js";

export async function createLike(req, res) {
  try {
    const { post_id } = req.body;
    if (!post_id) return res.status(400).json({ error: "post_id required" });
    const { data, error } = await supabase.from("likes").insert([{ post_id }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function countLikes(req, res) {
  try {
    const postId = req.params.postId;
    const { count, error } = await supabase.from("likes").select("*", { count: "exact" }).eq("post_id", postId);
    if (error) throw error;
    res.json({ count: count.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
}