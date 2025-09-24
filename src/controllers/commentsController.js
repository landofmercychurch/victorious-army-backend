// src/controllers/commentsController.js
import { supabase } from "../config/supabase.js";

export async function listCommentsForPost(req, res) {
  try {
    const postId = req.params.postId;
    const { data, error } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createComment(req, res) {
  try {
    const { post_id, name, content } = req.body;
    if (!post_id || !content) return res.status(400).json({ error: "post_id and content required" });

    const payload = { post_id, name, content, is_guest: true };
    const { data, error } = await supabase.from("comments").insert([payload]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("comments").delete().eq("id", id).select().single();
    if (error) throw error;
    res.json({ message: "deleted", data });
  } catch (err) { res.status(500).json({ error: err.message }); }
}