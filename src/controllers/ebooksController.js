// src/controllers/ebooksController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

/**
 * List all ebooks, grouped by series
 */
export async function listEbooks(req, res) {
  try {
    const { series: filterSeries } = req.query;

    // Fetch ebooks from Supabase
    let query = supabase
      .from("ebooks")
      .select("*")
      .order("series_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (filterSeries) query = query.eq("series", filterSeries);

    const { data, error } = await query;
    if (error) throw error;

    // Group by series, "Standalone" if no series
    const grouped = data.reduce((acc, ebook) => {
      const key = ebook.series || "Standalone";
      if (!acc[key]) acc[key] = [];
      acc[key].push(ebook);
      return acc;
    }, {});

    return res.json(grouped);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Upload a new ebook with optional cover image and series
 */
export async function uploadEbook(req, res) {
  try {
    const { title, author, series, series_order } = req.body;

    if (!req.files?.pdf?.[0]) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    // Upload PDF
    const pdfResult = await uploadBufferToCloudinary(req.files.pdf[0].buffer, {
      folder: "ebooks",
      resource_type: "raw",
    });

    let cover_url = null;
    if (req.files?.cover?.[0]) {
      const coverResult = await uploadBufferToCloudinary(req.files.cover[0].buffer, {
        folder: "ebooks/covers",
        resource_type: "image",
      });
      cover_url = coverResult.secure_url;
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("ebooks")
      .insert([{
        title,
        author,
        series: series || null,
        series_order: series_order ? parseInt(series_order) : null,
        pdf_url: pdfResult.secure_url,
        cover_url,
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Delete a single ebook by id OR all ebooks in a series
 */
export async function deleteEbook(req, res) {
  try {
    const { id } = req.params;
    const { series } = req.query;

    if (!id && !series) {
      return res.status(400).json({ error: "Provide an ebook ID or a series name to delete" });
    }

    let query = supabase.from("ebooks");
    if (id) query = query.eq("id", id);
    if (series) query = query.eq("series", series);

    const { data, error } = await query.delete().select();
    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No ebook(s) found to delete" });
    }

    return res.json({ message: `${data.length} ebook(s) deleted successfully`, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
