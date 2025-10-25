import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

/**
 * List all ebooks, optionally filtered by series
 */
export async function listEbooks(req, res) {
  try {
    const { series } = req.query; // optional query ?series=SeriesName

    let query = supabase.from("ebooks").select("*").order("series_order", { ascending: true }).order("created_at", { ascending: false });

    if (series) query = query.eq("series", series);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Upload a new ebook (PDF) with optional cover image
 */
export async function uploadEbook(req, res) {
  try {
    const { title, author, series, series_order } = req.body;

    if (!req.files?.pdf) return res.status(400).json({ error: "PDF file is required" });

    // Upload PDF
    const pdfResult = await uploadBufferToCloudinary(req.files.pdf[0].buffer, { folder: "ebooks", resource_type: "raw" });
    const pdf_url = pdfResult.secure_url;

    let cover_url = null;
    if (req.files?.cover) {
      const coverResult = await uploadBufferToCloudinary(req.files.cover[0].buffer, { folder: "ebooks/covers", resource_type: "image" });
      cover_url = coverResult.secure_url;
    }

    const { data, error } = await supabase
      .from("ebooks")
      .insert([{
        title,
        author,
        series: series || null,
        series_order: series_order ? parseInt(series_order) : null,
        pdf_url,
        cover_url
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
