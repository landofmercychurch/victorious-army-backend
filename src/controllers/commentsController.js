// src/controllers/commentsController.js
import { supabase } from "../config/supabase.js";

export async function createComment(req, res) {
  try {
    const { post_id, sermon_id, name, content } = req.body;

    if (!post_id && !sermon_id) {
      return res.status(400).json({ error: "post_id or sermon_id is required" });
    }

    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([{ post_id, sermon_id, name, content }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getComments(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.query; // ?type=post or ?type=sermon

    let query = supabase.from("comments").select("*").order("created_at", { ascending: false });

    if (type === "post") query = query.eq("post_id", id);
    else if (type === "sermon") query = query.eq("sermon_id", id);
    else return res.status(400).json({ error: "type must be 'post' or 'sermon'" });

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
