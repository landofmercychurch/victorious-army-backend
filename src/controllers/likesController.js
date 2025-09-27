// src/controllers/likesController.js
import { supabase } from "../config/supabase.js";

/**
 * Create a like for a sermon or post
 */
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

/**
 * Count likes for a sermon or post
 * Accepts query parameters:
 *  ?type=sermon&sermon_id=<id>
 *  ?type=post&post_id=<id>
 */
export async function countLikes(req, res) {
  try {
    const { type } = req.query;
    const { sermon_id, post_id } = req.query; // ids passed in query

    let query = supabase.from("likes").select("*", { count: "exact", head: true });

    if (type === "post" && post_id) {
      query = query.eq("post_id", post_id);
    } else if (type === "sermon" && sermon_id) {
      query = query.eq("sermon_id", sermon_id);
    } else {
      return res.status(400).json({ error: "type must be 'post' or 'sermon' with a valid id" });
    }

    const { count, error } = await query;
    if (error) throw error;

    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
