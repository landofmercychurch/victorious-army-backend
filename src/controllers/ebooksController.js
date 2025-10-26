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

    return res.json(data);
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

    if (!req.files?.pdf) return res.status(400).json({ error: "PDF file is required" });

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

    const { data, error } = await supabase
      .from("ebooks")
      .insert([
        {
          title,
          author,
          series: series || null,
          series_order: series_order ? parseInt(series_order) : null,
          pdf_url,
          cover_url,
        },
      ])
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
    else if (series) query = query.eq("series", series);

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
