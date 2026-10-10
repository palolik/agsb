#!/usr/bin/env node
// Runs after `vite build`. Writes into <out>:
//   - sitemap.xml and robots.txt
//   - one prerendered HTML file per public page (home.html, districts.html,
//     districts/sylhet.html, …) with that page's title, description,
//     canonical URL, Open Graph tags, schema.org JSON-LD and a plain-HTML copy
//     of its main content, so search engines and link previews get the real
//     page without running JavaScript. public/.htaccess serves these files;
//     React replaces the plain content as soon as the app starts.
//
//   node scripts/build-seo.mjs [--out dist] [--mode production]
//
// Reads VITE_SITE_URL and VITE_API_BASE_URL from the environment, falling
// back to .env.[mode].local, .env.[mode], .env.local and .env (Vite's order).
// Never fails the build: without a site URL it skips everything, and if the
// API can't be reached it writes the static pages only. Both print a warning.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  BRAND, HOME_TITLE, DEFAULT_DESCRIPTION, plainText,
  districtSeo, attractionSeo, planSeo, postSeo, productSeo,
} from "../src/lib/seo.js";
import { districtName } from "../src/lib/districtNames.js";

// Bangla title / description of each static page, as set by its <PageMeta>.
const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily", h1: HOME_TITLE, description: "ট্রিপ প্ল্যান করুন, অজানা সব জায়গা খুঁজে নিন, জেলা ব্যাজ সংগ্রহ করুন আর জেলা থেকে জেলায় ঘুরে হয়ে উঠুন বাংলাদেশের সত্যিকারের অভিযাত্রী।" },
  { path: "/districts", priority: "0.9", changefreq: "weekly", title: "৬৪ জেলা", description: "বাংলাদেশের প্রতিটি জেলা ঘুরে দেখুন: দর্শনীয় স্থান, খাবার, যাতায়াত, বাজেট আর ভ্রমণের সেরা সময়।" },
  { path: "/plans", priority: "0.8", changefreq: "weekly", title: "ট্রাভেল প্ল্যান", description: "সব বাজেটের জন্য তৈরি ভ্রমণ পরিকল্পনা — উইকেন্ড ট্রিপ থেকে একাধিক জেলার ট্যুর পর্যন্ত।" },
  { path: "/blog", priority: "0.8", changefreq: "daily", title: "ট্রাভেল ব্লগ", description: "সারা বাংলাদেশের গাইড, গল্প আর স্থানীয় অভিজ্ঞতা।" },
  { path: "/map", priority: "0.7", changefreq: "monthly", title: "মানচিত্র", description: "বাংলাদেশের ইন্টারঅ্যাকটিভ মানচিত্রে ট্রাভেল গাইডসহ জেলাগুলো খুঁজে নিন।" },
  { path: "/shop", priority: "0.7", changefreq: "weekly", title: "শপ", description: "পরের ট্রিপের জন্য তাঁবু, ব্যাকপ্যাকসহ ট্রাভেল গিয়ার কিনুন বা ভাড়া নিন — বাংলাদেশের যেকোনো প্রান্তে।" },
  { path: "/frames", priority: "0.6", changefreq: "monthly", title: "ফটো ফ্রেম", description: "জেলার ফটো ফ্রেম ডাউনলোড করুন আর শেয়ার করুন আপনার “আমি ঘুরেছি” স্মৃতি।" },
  { path: "/membership", priority: "0.5", changefreq: "monthly", title: "মেম্বারশিপ", description: "ঘোরা জেলাগুলোর হিসাব রাখুন, ফ্রেম সংগ্রহ করুন, পার্টনার ডিসকাউন্ট পান এবং সার্টিফায়েড 64-জেলা এক্সপ্লোরার হয়ে উঠুন।" },
  { path: "/partners", priority: "0.5", changefreq: "monthly", title: "পার্টনার", description: "সারা বাংলাদেশে যেসব হোটেল, পরিবহন ও গাইডের সঙ্গে আমরা কাজ করি।" },
  { path: "/about", priority: "0.4", changefreq: "yearly", title: "আমাদের সম্পর্কে", description: "বাংলাদেশের ৬৪টি জেলার জন্য বাংলা-প্রথম একটি পূর্ণাঙ্গ ভ্রমণসঙ্গী কেন আমরা তৈরি করছি।" },
  { path: "/contact", priority: "0.4", changefreq: "yearly", title: "যোগাযোগ", description: "ট্রিপ প্ল্যান, কোনো জেলা বা মেম্বারশিপ নিয়ে প্রশ্ন আছে? আমাদের মেসেজ পাঠান।" },
];

const NAV = [
  ["/districts", "৬৪ জেলা"], ["/map", "মানচিত্র"], ["/plans", "ট্রাভেল প্ল্যান"],
  ["/shop", "শপ"], ["/blog", "ট্রাভেল ব্লগ"], ["/frames", "ফটো ফ্রেম"], ["/about", "আমাদের সম্পর্কে"],
];

const warn = (msg) => console.warn(`[seo] warning: ${msg}`);

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
  const files = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];
  const merged = {};
  for (const f of files) Object.assign(merged, parseEnvFile(resolve(process.cwd(), f)));
  return { ...merged, ...process.env };
}

function listFrom(body) {
  if (Array.isArray(body)) return body;
  for (const key of ["data", "items", "results", "docs"]) {
    if (body && Array.isArray(body[key])) return body[key];
  }
  return [];
}

async function fetchList(apiBase, endpoint) {
  try {
    const res = await fetch(`${apiBase}${endpoint}`, { signal: AbortSignal.timeout(45_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return listFrom(await res.json()).filter((item) => item && typeof item.slug === "string" && item.slug.trim());
  } catch (err) {
    warn(`could not load ${apiBase}${endpoint} (${err.cause?.code || err.message}); its pages are left out.`);
    return null;
  }
}

const esc = (s) => String(s ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]);

function clip(text, max = 200) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function lastmod(item) {
  const raw = item.updatedAt || item.updated_at || item.date || item.createdAt || item.created_at;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}

// ---------------------------------------------------------------- pages

function buildPages(siteUrl, apiOrigin, data) {
  const abs = (p) => `${siteUrl}${p}`;
  const img = (src) => (!src ? null : /^https?:\/\//.test(src) ? src : src.startsWith("/uploads") ? `${apiOrigin}${src}` : abs(src));
  const slugPath = (prefix, slug) => `${prefix}/${encodeURIComponent(slug.trim())}`;
  const crumbs = (items) => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
  });
  const link = (path, text) => `<a href="${esc(path)}">${esc(text)}</a>`;
  const list = (items) => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>` : "");
  const section = (title, body) => (body ? `<section><h2>${esc(title)}</h2>${body}</section>` : "");
  const crumbHtml = (items) => `<nav aria-label="breadcrumb"><ol>${items.map(([name, path]) => `<li>${link(path, name)}</li>`).join("")}</ol></nav>`;

  const { districts = [], attractions = [], plans = [], posts = [], products = [] } = data;
  const dName = (d) => d.name_bn || districtName(d.name_en);
  const byDistrict = new Map();
  for (const a of attractions) {
    if (!byDistrict.has(a.district_slug)) byDistrict.set(a.district_slug, []);
    byDistrict.get(a.district_slug).push(a);
  }
  const districtLinks = districts.map((d) => `${link(slugPath("/districts", d.slug), dName(d))}${d.tagline ? ` — ${esc(d.tagline)}` : ""}`);
  const planLinks = plans.map((p) => `${link(slugPath("/plans", p.slug), planSeo(p).title)}${p.duration ? ` (${esc(p.duration)})` : ""}`);
  const postLinks = posts.map((p) => link(slugPath("/blog", p.slug), postSeo(p).title));
  const productLinks = products.map((p) => link(slugPath("/shop", p.slug), productSeo(p).title));

  const pages = [];

  for (const s of STATIC_PAGES) {
    const extra = {
      "/": section("জনপ্রিয় জেলা", list(districtLinks.slice(0, 16))) + section("ট্রাভেল প্ল্যান", list(planLinks.slice(0, 6))) + section("ট্রাভেল ব্লগ", list(postLinks.slice(0, 6))),
      "/districts": list(districtLinks),
      "/plans": list(planLinks),
      "/blog": list(postLinks),
      "/shop": list(productLinks),
    }[s.path] || "";
    const jsonLd = s.path === "/"
      ? [
          {
            "@type": "Organization", "@id": abs("/#org"), name: "আমি ঘুরি সারা বাংলাদেশ",
            alternateName: [BRAND, "Ami Ghuri Shara Bangladesh", "AGSB"], url: abs("/"), logo: abs("/assets/agsb_logo.png"),
          },
          {
            "@type": "WebSite", "@id": abs("/#website"), name: "আমি ঘুরি সারা বাংলাদেশ",
            alternateName: "Ami Ghuri Shara Bangladesh", url: abs("/"), inLanguage: ["bn", "en"], publisher: { "@id": abs("/#org") },
          },
        ]
      : [crumbs([["হোম", "/"], [s.title, s.path]])];
    pages.push({
      ...s,
      fullTitle: s.title ? `${s.title} | ${BRAND}` : HOME_TITLE,
      h1: s.h1 || s.title,
      body: `<p>${esc(s.description)}</p>${extra}`,
      jsonLd,
    });
  }

  for (const d of districts) {
    const path = slugPath("/districts", d.slug);
    const own = byDistrict.get(d.slug) || [];
    const seo = districtSeo(d, "bn", own);
    const facts = [
      d.best_time && `<li>ভ্রমণের সেরা সময়: ${esc(d.best_time)}</li>`,
      d.budget && `<li>আনুমানিক খরচ: ${esc(d.budget)}</li>`,
      d.transport && `<li>যাতায়াত: ${esc(d.transport)}</li>`,
      d.trip_type && `<li>ট্রিপের ধরন: ${esc(d.trip_type)}</li>`,
    ].filter(Boolean).join("");
    const food = Array.isArray(d.food) ? d.food.filter(Boolean).map(esc) : [];
    const trail = [["হোম", "/"], ["৬৪ জেলা", "/districts"], [dName(d), path]];
    pages.push({
      path, priority: "0.8", changefreq: "monthly", lastmod: lastmod(d),
      fullTitle: `${seo.title} | ${BRAND}`, h1: seo.title, description: seo.description, image: img(d.image),
      body: crumbHtml(trail)
        + `<p>${esc(d.tagline || "")} ${d.name_en ? `(${esc(districtName(d.name_en))})` : ""}</p>`
        + (facts ? `<ul>${facts}</ul>` : "")
        + section("দর্শনীয় স্থান", list(own.map((a) => `${link(slugPath("/attractions", a.slug), a.name_bn || a.name)}${a.desc ? ` — ${esc(a.desc)}` : ""}`)))
        + section("বিখ্যাত খাবার", list(food)),
      jsonLd: [
        {
          "@type": "TouristDestination",
          name: dName(d),
          alternateName: districtName(d.name_en) || undefined,
          description: seo.description,
          url: abs(path),
          image: img(d.image) || undefined,
          geo: typeof d.lat === "number" && typeof d.lng === "number" ? { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng } : undefined,
          containedInPlace: { "@type": "Country", name: "Bangladesh" },
          includesAttraction: own.length
            ? own.map((a) => ({ "@type": "TouristAttraction", name: a.name_bn || a.name, url: abs(slugPath("/attractions", a.slug)) }))
            : undefined,
        },
        crumbs(trail),
      ],
    });
  }

  for (const a of attractions) {
    const path = slugPath("/attractions", a.slug);
    const seo = attractionSeo(a, "bn");
    const districtPath = a.district_slug ? slugPath("/districts", a.district_slug) : null;
    const trail = [["হোম", "/"], ["৬৪ জেলা", "/districts"], ...(districtPath ? [[a.district_name_bn || a.district_name_en, districtPath]] : []), [a.name_bn || a.name, path]];
    pages.push({
      path, priority: "0.6", changefreq: "monthly", lastmod: lastmod(a),
      fullTitle: `${seo.title} | ${BRAND}`, h1: a.name_bn || a.name, description: seo.description, image: img(a.image),
      body: crumbHtml(trail) + `<p>${esc(a.desc || "")}</p>` + (a.location ? `<p>${esc(a.location)}</p>` : ""),
      jsonLd: [
        {
          "@type": "TouristAttraction", name: a.name_bn || a.name, alternateName: a.name_bn && a.name ? a.name : undefined,
          description: a.desc || undefined, url: abs(path), image: img(a.image) || undefined,
          containedInPlace: districtPath ? { "@type": "Place", name: a.district_name_bn || a.district_name_en, url: abs(districtPath) } : undefined,
        },
        crumbs(trail),
      ],
    });
  }

  for (const p of plans) {
    const path = slugPath("/plans", p.slug);
    const seo = planSeo(p, "bn");
    const trail = [["হোম", "/"], ["ট্রাভেল প্ল্যান", "/plans"], [seo.title, path]];
    pages.push({
      path, priority: "0.7", changefreq: "weekly", lastmod: lastmod(p),
      fullTitle: `${seo.title} | ${BRAND}`, h1: seo.title, description: seo.description, image: img(p.image),
      body: crumbHtml(trail)
        + `<ul>${[p.duration && `<li>সময়: ${esc(p.duration)}</li>`, p.cost && `<li>খরচ: ${esc(p.cost)}</li>`, Array.isArray(p.districts) && p.districts.length && `<li>জেলা: ${esc(p.districts.join(", "))}</li>`].filter(Boolean).join("")}</ul>`
        + `<p>${esc(plainText(p.description_bn || p.description_en))}</p>`
        + section("হাইলাইটস", list((Array.isArray(p.highlights) ? p.highlights : []).map(esc))),
      jsonLd: [
        {
          "@type": "TouristTrip", name: seo.title, description: plainText(p.description_bn || p.description_en) || undefined,
          url: abs(path), image: img(p.image) || undefined, touristType: p.type || undefined,
          provider: { "@type": "Organization", name: "আমি ঘুরি সারা বাংলাদেশ", url: abs("/") },
        },
        crumbs(trail),
      ],
    });
  }

  for (const post of posts) {
    const path = slugPath("/blog", post.slug);
    const seo = postSeo(post, "bn");
    const trail = [["হোম", "/"], ["ট্রাভেল ব্লগ", "/blog"], [seo.title, path]];
    const date = lastmod(post);
    pages.push({
      path, priority: "0.7", changefreq: "monthly", lastmod: date, type: "article",
      fullTitle: `${seo.title} | ${BRAND}`, h1: seo.title, description: seo.description, image: img(post.image),
      body: crumbHtml(trail) + `<p>${esc(plainText(post.content || post.excerpt))}</p>`
        + (post.districtSlug ? `<p>${link(slugPath("/districts", post.districtSlug), "জেলার ভ্রমণ গাইড দেখুন")}</p>` : ""),
      jsonLd: [
        {
          "@type": "BlogPosting", headline: seo.title, description: seo.description || undefined,
          image: img(post.image) || undefined, datePublished: date || undefined, url: abs(path), mainEntityOfPage: abs(path),
          inLanguage: "bn", author: { "@type": "Organization", name: "আমি ঘুরি সারা বাংলাদেশ", url: abs("/") },
          publisher: { "@type": "Organization", name: "আমি ঘুরি সারা বাংলাদেশ", logo: { "@type": "ImageObject", url: abs("/assets/agsb_logo.png") } },
        },
        crumbs(trail),
      ],
    });
  }

  for (const p of products) {
    const path = slugPath("/shop", p.slug);
    const seo = productSeo(p, "bn");
    const images = (Array.isArray(p.images) ? p.images : []).map(img).filter(Boolean);
    const trail = [["হোম", "/"], ["শপ", "/shop"], [seo.title, path]];
    const price = Number(p.salePrice);
    pages.push({
      path, priority: "0.6", changefreq: "weekly", lastmod: lastmod(p),
      fullTitle: `${seo.title} | ${BRAND}`, h1: seo.title, description: seo.description, image: images[0],
      body: crumbHtml(trail) + `<p>${esc(p.summary || "")}</p><p>${esc(plainText(p.description))}</p>`
        + (price > 0 ? `<p>দাম: ৳${esc(price)}</p>` : "") + (Number(p.rentPerDay) > 0 ? `<p>ভাড়া: ৳${esc(p.rentPerDay)} / দিন</p>` : ""),
      jsonLd: [
        {
          "@type": "Product", name: seo.title, alternateName: p.name && p.name_bn ? p.name : undefined,
          description: seo.description || undefined, image: images.length ? images : undefined, url: abs(path),
          offers: price > 0
            ? { "@type": "Offer", price, priceCurrency: "BDT", url: abs(path), availability: Number(p.saleStock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }
            : undefined,
        },
        crumbs(trail),
      ],
    });
  }

  return pages;
}

// ---------------------------------------------------------------- output

// The prerendered tags carry data-default-meta, so PageMeta drops them once
// the app renders its own (see src/components/PageMeta.jsx).
function renderHtml(template, siteUrl, page) {
  const url = `${siteUrl}${page.path === "/" ? "/" : page.path}`;
  const desc = clip(page.description) || DEFAULT_DESCRIPTION;
  const image = page.image || `${siteUrl}/og-image.png`;
  const ld = JSON.stringify({ "@context": "https://schema.org", "@graph": page.jsonLd }).replace(/</g, "\\u003c");
  const head = [
    `<title data-default-meta>${esc(page.fullTitle)}</title>`,
    `<meta name="description" content="${esc(desc)}" data-default-meta />`,
    `<link rel="canonical" href="${esc(url)}" data-default-meta />`,
    `<meta property="og:site_name" content="${esc(BRAND)}" data-default-meta />`,
    `<meta property="og:type" content="${page.type || "website"}" data-default-meta />`,
    `<meta property="og:title" content="${esc(page.fullTitle)}" data-default-meta />`,
    `<meta property="og:description" content="${esc(desc)}" data-default-meta />`,
    `<meta property="og:url" content="${esc(url)}" data-default-meta />`,
    `<meta property="og:image" content="${esc(image)}" data-default-meta />`,
    `<meta name="twitter:card" content="summary_large_image" data-default-meta />`,
    `<meta name="twitter:title" content="${esc(page.fullTitle)}" data-default-meta />`,
    `<meta name="twitter:description" content="${esc(desc)}" data-default-meta />`,
    `<meta name="twitter:image" content="${esc(image)}" data-default-meta />`,
    `<script type="application/ld+json">${ld}</script>`,
  ].map((l) => `    ${l}`).join("\n");

  const nav = `<header><a href="/">${esc(BRAND)}</a><nav>${NAV.map(([p, t]) => `<a href="${p}">${esc(t)}</a>`).join(" · ")}</nav></header>`;
  const main = `<main class="max-w-7xl mx-auto px-4 py-10"><h1>${esc(page.h1)}</h1>${page.body}</main>`;

  return template
    .replace(/<title[^>]*data-default-meta[^>]*>[\s\S]*?<\/title>\s*/g, "")
    .replace(/[ \t]*<(meta|link)\b[^>]*data-default-meta[^>]*>\s*/g, "")
    .replace("</head>", `${head}\n  </head>`)
    .replace(/<div id="root"><\/div>/, `<div id="root"><div class="prerender">${nav}${main}</div></div>`);
}

function sitemapXml(siteUrl, pages) {
  const xmlEscape = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
  const urls = pages.map((e) => [
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
    "Disallow: /cart",
    "Disallow: /orders/",
    "Disallow: /login",
    "Disallow: /signup",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

// "/" -> home.html, "/districts/sylhet" -> districts/sylhet.html. Slugs with
// characters a file name can't safely hold are listed in the sitemap but not
// prerendered (the SPA still serves them).
function fileFor(outDir, path) {
  if (path === "/") return resolve(outDir, "home.html");
  const rel = decodeURIComponent(path).replace(/^\//, "");
  if (!/^[\w-]+(\/[\w.-]+)*$/.test(rel)) return null;
  return resolve(outDir, `${rel}.html`);
}

async function main() {
  const outDir = resolve(arg("out", "dist"));
  const env = loadEnv(arg("mode", "production"));
  const siteUrl = (env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");
  const apiBase = (env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  const apiOrigin = apiBase.replace(/\/api$/, "");
  const templateFile = resolve(outDir, "index.html");

  if (!existsSync(templateFile)) {
    warn(`${templateFile} does not exist; run vite build first. Skipping.`);
    return;
  }
  if (!/^https?:\/\//.test(siteUrl) || /example\.com/.test(siteUrl)) {
    warn("VITE_SITE_URL is not set to the real site (e.g. https://amighurisharabangladesh.com); sitemap, robots.txt and prerendered pages were not generated.");
    return;
  }

  const data = {};
  let failed = 0;
  if (!apiBase) {
    warn("VITE_API_BASE_URL is not set; only static pages are prerendered.");
  } else {
    const keys = [["districts", "/districts"], ["attractions", "/attractions"], ["plans", "/plans"], ["posts", "/blog"], ["products", "/products"]];
    const lists = await Promise.all(keys.map(([, endpoint]) => fetchList(apiBase, endpoint)));
    keys.forEach(([key], i) => {
      if (lists[i] === null) failed += 1;
      else data[key] = lists[i];
    });
  }

  const seen = new Set();
  const pages = buildPages(siteUrl, apiOrigin, data).filter((p) => (seen.has(p.path) ? false : seen.add(p.path)));
  const template = readFileSync(templateFile, "utf8");
  let written = 0;
  for (const page of pages) {
    const file = fileFor(outDir, page.path);
    if (!file) continue;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, renderHtml(template, siteUrl, page));
    written += 1;
  }
  writeFileSync(resolve(outDir, "sitemap.xml"), sitemapXml(siteUrl, pages));
  writeFileSync(resolve(outDir, "robots.txt"), robotsTxt(siteUrl));
  console.log(`[seo] ${pages.length} URLs in sitemap.xml, ${written} pages prerendered (+ robots.txt)${failed ? `; ${failed} collection(s) skipped` : ""}.`);
}

main().catch((err) => {
  warn(`unexpected error: ${err.stack || err.message}`);
}).finally(() => {
  process.exitCode = 0;
});
