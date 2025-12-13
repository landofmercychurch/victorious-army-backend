// src/scripts/generate-ebooks.js

import fs from "fs";
import path from "path";
import { supabase } from "../config/supabase.js";

// ------------------ CONFIG ------------------
const SITE_URL = process.env.SITE_URL || "";
const OUTPUT_DIR = path.join(process.cwd(), "public", "ebooks");

// ------------------ INIT ------------------
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ------------------ HELPERS ------------------
function slugify(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}

// ------------------ FETCH BOOKS ------------------
async function fetchBooks() {
  const { data, error } = await supabase
    .from("ebooks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// ------------------ BOOK PAGE ------------------
function generateBookHTML(book) {
  const slug = book.slug || slugify(book.title);
  const url = `${SITE_URL}/ebooks/${slug}.html`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHTML(book.title)} | Church eBook</title>

  <meta name="description" content="${escapeHTML(
    book.description || `Read ${book.title} church ebook`
  )}">
  <meta name="author" content="${escapeHTML(book.author || "")}">

  <meta property="og:type" content="book">
  <meta property="og:title" content="${escapeHTML(book.title)}">
  <meta property="og:description" content="${escapeHTML(book.description || "")}">
  <meta property="og:image" content="${book.cover_url || ""}">
  <meta property="og:url" content="${url}">

  <link rel="canonical" href="${url}">
</head>

<body>
  <main>
    <h1>${escapeHTML(book.title)}</h1>

    ${book.cover_url ? `
      <img src="${book.cover_url}" alt="${escapeHTML(book.title)} cover" />
    ` : ""}

    ${book.author ? `<p><strong>Author:</strong> ${escapeHTML(book.author)}</p>` : ""}
    ${book.series ? `<p><strong>Series:</strong> ${escapeHTML(book.series)}</p>` : ""}
    ${book.description ? `<p>${escapeHTML(book.description)}</p>` : ""}

    <p>
      <a href="${book.pdf_url}" target="_blank" rel="noopener">
        Read / Download PDF
      </a>
    </p>

    <p><a href="/ebooks/index.html">← Back to all books</a></p>
  </main>
</body>
</html>`;
}

// ------------------ INDEX PAGE ------------------
function generateIndexHTML(books) {
  const items = books.map((book) => {
    const slug = book.slug || slugify(book.title);
    return `
      <li>
        <a href="/ebooks/${slug}.html">
          ${escapeHTML(book.title)}
        </a>
        ${book.author ? ` – ${escapeHTML(book.author)}` : ""}
      </li>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Church eBooks Library</title>

  <meta name="description" content="Browse all church ebooks, sermons, and spiritual resources.">
  <meta property="og:title" content="Church eBooks Library">
  <meta property="og:type" content="website">
</head>

<body>
  <main>
    <h1>Church eBooks</h1>
    <ul>${items}</ul>
  </main>
</body>
</html>`;
}

// ------------------ MAIN ------------------
(async function build() {
  console.log("Generating ebook pages...");

  const books = await fetchBooks();

  for (const book of books) {
    const slug = book.slug || slugify(book.title);
    const filePath = path.join(OUTPUT_DIR, `${slug}.html`);
    const html = generateBookHTML(book);
    fs.writeFileSync(filePath, html);
  }

  const indexHTML = generateIndexHTML(books);
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), indexHTML);

  console.log(`Generated ${books.length} ebook pages`);
})();