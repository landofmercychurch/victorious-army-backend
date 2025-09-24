// src/controllers/eventsController.js
import { supabase } from "../config/supabase.js";

export async function listEvents(req, res) {
  try {
    const { data, error } = await supabase.from("events").select("*").order("start_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function createEvent(req, res) {
  try {
    const { title, description, start_at, location } = req.body;
    if (!title || !start_at) return res.status(400).json({ error: "title and start_at required" });
    const { data, error } = await supabase.from("events").insert([{ title, description, start_at, location }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { title, description, start_at, location } = req.body;
    const { data, error } = await supabase.from("events").update({ title, description, start_at, location }).eq("id", id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
}