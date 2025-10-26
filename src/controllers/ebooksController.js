import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

/**
 * List all ebooks, optionally filtered by series
 */
export async function listEbooks(req, res) {
  try {
    const { series } = req.query;

    let query = supabase
      .from("ebooks")
      .select("*")
      .order("series_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (series) query = query.eq("series", series);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Upload a new ebook (PDF required) with optional cover image and series
 */
export async function uploadEbook(req, res) {
  try {
    const { title, author, series, series_order } = req.body;

    if (!title || !req.files?.pdf) {
      return res.status(400).json({ error: "Title and PDF file are required" });
    }

    // Upload PDF
    const pdfResult = await uploadBufferToCloudinary(req.files.pdf[0].buffer, {
      folder: "ebooks",
      resource_type: "raw",
    });
    const pdf_url = pdfResult.secure_url;

    // Optional cover upload
    let cover_url = null;
    if (req.files?.cover) {
      const coverResult = await uploadBufferToCloudinary(req.files.cover[0].buffer, {
        folder: "ebooks/covers",
        resource_type: "image",
      });
      cover_url = coverResult.secure_url;
    }

    const order = series_order ? parseInt(series_order) : null;

    const { data, error } = await supabase
      .from("ebooks")
      .insert([
        {
          title,
          author: author || null,
          series: series || null,
          series_order: isNaN(order) ? null : order,
          pdf_url,
          cover_url,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete a single ebook by ID
 */
export async function deleteEbook(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Ebook ID is required" });

    const { error } = await supabase.from("ebooks").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Ebook deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete all ebooks in a series
 */
export async function deleteEbookSeries(req, res) {
  try {
    const { series } = req.params;
    if (!series) return res.status(400).json({ error: "Series name is required" });

    const { error } = await supabase.from("ebooks").delete().eq("series", series);
    if (error) throw error;

    res.json({ message: `All ebooks in series "${series}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
