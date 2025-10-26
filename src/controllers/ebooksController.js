// src/controllers/ebooksController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";
import { PDFDocument } from "pdf-lib";
import fetch from "node-fetch";

/**
 * List all ebooks grouped by series
 */
export async function listEbooks(req, res) {
  try {
    const { series: filterSeries } = req.query;

    let query = supabase
      .from("ebooks")
      .select("*")
      .order("series_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (filterSeries) query = query.eq("series", filterSeries);

    const { data, error } = await query;
    if (error) throw error;

    const grouped = data.reduce((acc, ebook) => {
      const seriesKey = ebook.series || "Standalone";
      if (!acc[seriesKey]) acc[seriesKey] = [];
      acc[seriesKey].push(ebook);
      return acc;
    }, {});

    return res.json(grouped);
  } catch (err) {
    console.error("[listEbooks] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Upload a new ebook with optional cover and metadata
 */
export async function uploadEbook(req, res) {
  try {
    const { title, author, series, series_order } = req.body;

    if (!req.files?.pdf?.[0]) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    // Embed metadata
    const pdfBuffer = req.files.pdf[0].buffer;
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pdfDoc.setTitle(title || "Untitled");
    pdfDoc.setAuthor(author || "Unknown");
    pdfDoc.setSubject(series || "Standalone");
    pdfDoc.setKeywords(series_order ? [`Part ${series_order}`] : []);

    const modifiedPdfBuffer = await pdfDoc.save();

    const pdfResult = await uploadBufferToCloudinary(modifiedPdfBuffer, {
      folder: "ebooks",
      resource_type: "raw",
    });

    let cover_url = null;
    if (req.files?.cover?.[0]) {
      try {
        const coverResult = await uploadBufferToCloudinary(req.files.cover[0].buffer, {
          folder: "ebooks/covers",
          resource_type: "image",
        });
        cover_url = coverResult.secure_url;
      } catch (err) {
        console.warn("[uploadEbook] Cover upload failed", err);
      }
    }

    const order = series_order ? parseInt(series_order) : 0;

    const { data, error } = await supabase
      .from("ebooks")
      .insert([{ title, author, series: series || null, series_order: order, pdf_url: pdfResult.secure_url, cover_url }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    console.error("[uploadEbook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Delete ebook by id or series
 */
export async function deleteEbook(req, res) {
  try {
    const { id } = req.params;
    const { series } = req.query;

    if (!id && !series) return res.status(400).json({ error: "Provide an ebook ID or series name" });

    let query = supabase.from("ebooks");
    if (id) query = query.eq("id", id);
    if (series) query = query.eq("series", series);

    const { data, error } = await query.delete().select();
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: "No ebook(s) found" });

    return res.json({ message: `${data.length} ebook(s) deleted`, data });
  } catch (err) {
    console.error("[deleteEbook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Download ebook with correct filename
 */
export async function downloadEbook(req, res) {
  try {
    const { id } = req.params;
    const { data: ebook, error } = await supabase.from("ebooks").select("*").eq("id", id).single();
    if (error || !ebook) return res.status(404).json({ error: "Ebook not found" });

    const response = await fetch(ebook.pdf_url);
    if (!response.ok) throw new Error("Failed to fetch PDF");
    const buffer = await response.arrayBuffer();

    const safeTitle = (ebook.title || "ebook").replace(/[/\\?%*:|"<>]/g, "-").substring(0, 100);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[downloadEbook] Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

