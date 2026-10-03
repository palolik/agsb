import DOMPurify from "dompurify";
import { API_ORIGIN } from "./config";

const hasTags = (str) => /<[a-z][\s\S]*>/i.test(str);

const escapeHtml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Older entries were plain text; keep their line breaks as paragraphs.
const plainToHtml = (str) =>
  str.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");

// Admin rich text stores uploaded images as relative /uploads/... paths.
export function renderRichText(html) {
  if (typeof html !== "string" || !html.trim()) return "";
  const source = hasTags(html) ? html : plainToHtml(html);
  return DOMPurify.sanitize(source).replace(/(src|href)="\/uploads\//g, `$1="${API_ORIGIN}/uploads/`);
}

// For card previews: rich text reduced to a single line of text.
export function toPlainText(html) {
  if (typeof html !== "string" || !html) return "";
  const text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value.replace(/\s+/g, " ").trim();
}
