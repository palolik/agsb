#!/usr/bin/env node
// Writes <out>/sitemap.xml and <out>/robots.txt after `vite build`.
//
//   node scripts/generate-sitemap.mjs [--out dist] [--mode production]
//
// Reads VITE_SITE_URL and VITE_API_BASE_URL from the environment, falling
// back to .env.[mode].local, .env.[mode], .env.local and .env (Vite's order).
// Detail URLs come from the live API (/districts, /plans, /blog). This script
// never fails the build: if the site URL is missing it skips the sitemap, and
// if the API can't be reached it writes the static routes only. Both cases
// print a warning and exit 0.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/districts", priority: "0.9", changefreq: "weekly" },
  { path: "/map", priority: "0.7", changefreq: "monthly" },
  { path: "/plans", priority: "0.8", changefreq: "weekly" },
  { path: "/blog", priority: "0.8", changefreq: "daily" },
  { path: "/frames", priority: "0.6", changefreq: "monthly" },
  { path: "/membership", priority: "0.5", changefreq: "monthly" },
  { path: "/partners", priority: "0.5", changefreq: "monthly" },
  { path: "/about", priority: "0.4", changefreq: "yearly" },
  { path: "/contact", priority: "0.4", changefreq: "yearly" },
];

const COLLECTIONS = [
  { endpoint: "/districts", prefix: "/districts", priority: "0.8", changefreq: "monthly" },
  { endpoint: "/plans", prefix: "/plans", priority: "0.7", changefreq: "weekly" },
  { endpoint: "/blog", prefix: "/blog", priority: "0.7", changefreq: "monthly" },
];

const warn = (msg) => console.warn(`[sitemap] warning: ${msg}`);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : fallback;
}

// Minimal .env parser: KEY=value, optional quotes, # comments.
function parseEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    out[m[1]] = value;
  }
  return out;
}

function loadEnv(mode) {
  const root = process.cwd();
  const files = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];
  const merged = {};
  for (const f of files) Object.assign(merged, parseEnvFile(resolve(root, f)));
  return { ...merged, ...process.env };
}

function listFrom(body) {
  if (Array.isArray(body)) return body;
  for (const key of ["data", "items", "results", "docs"]) {
    if (body && Array.isArray(body[key])) return body[key];
  }
  return [];
}

const xmlEscape = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

function lastmod(item) {
  const raw = item.updatedAt || item.updated_at || item.createdAt || item.created_at;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}

async function fetchCollection(apiBase, { endpoint, prefix, priority, changefreq }) {
  try {
    const res = await fetch(`${apiBase}${endpoint}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = listFrom(await res.json());
    return items
      .filter((item) => item && typeof item.slug === "string" && item.slug.trim())
      .map((item) => ({
        path: `${prefix}/${encodeURIComponent(item.slug.trim())}`,
        priority,
        changefreq,
        lastmod: lastmod(item),
      }));
  } catch (err) {
    warn(`could not load ${apiBase}${endpoint} (${err.cause?.code || err.message}); its detail pages are left out.`);
    return null;
  }
}

function sitemapXml(siteUrl, entries) {
  const urls = entries.map((e) => [
    "  <url>",
    `    <loc>${xmlEscape(siteUrl + e.path)}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    `    <changefreq>${e.changefreq}</changefreq>`,
    `    <priority>${e.priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n"));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function robotsTxt(siteUrl) {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /profile",
    "Disallow: /bookings/",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

async function main() {
  const outDir = resolve(arg("out", "dist"));
  const env = loadEnv(arg("mode", "production"));
  const siteUrl = (env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");
  const apiBase = (env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

  if (!existsSync(outDir)) {
    warn(`output directory ${outDir} does not exist; run vite build first. Skipping.`);
    return;
  }
  if (!/^https?:\/\//.test(siteUrl)) {
    warn("VITE_SITE_URL is not set (e.g. https://example.com); sitemap.xml was not generated and robots.txt has no Sitemap line.");
    return;
  }

  const entries = STATIC_ROUTES.map((r) => ({ ...r }));
  let failed = 0;
  if (!apiBase) {
    warn("VITE_API_BASE_URL is not set; only static routes are included.");
  } else {
    const results = await Promise.all(COLLECTIONS.map((c) => fetchCollection(apiBase, c)));
    for (const list of results) {
      if (list === null) failed += 1;
      else entries.push(...list);
    }
  }

  const seen = new Set();
  const unique = entries.filter((e) => (seen.has(e.path) ? false : seen.add(e.path)));
  writeFileSync(resolve(outDir, "sitemap.xml"), sitemapXml(siteUrl, unique));
  writeFileSync(resolve(outDir, "robots.txt"), robotsTxt(siteUrl));
  console.log(`[sitemap] wrote ${unique.length} URLs to ${resolve(outDir, "sitemap.xml")} (+ robots.txt)${failed ? `; ${failed} collection(s) skipped` : ""}.`);
}

main().catch((err) => {
  warn(`unexpected error: ${err.stack || err.message}`);
}).finally(() => {
  process.exitCode = 0;
});
