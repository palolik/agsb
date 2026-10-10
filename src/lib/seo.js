// Search titles and descriptions for detail pages. Plain functions with no
// browser or Vite imports: the pages use them for <PageMeta>, and
// scripts/build-seo.mjs uses the same ones to prerender each page's HTML, so
// what crawlers see before and after JavaScript stays identical.

import { districtName } from "./districtNames.js";

export const BRAND ="আমিঘুরিসারাবাংলাদেশ";
export const HOME_TITLE = "আমি ঘুরি সারা বাংলাদেশ — ৬৪ জেলার ভ্রমণ গাইড";
export const DEFAULT_DESCRIPTION =
  "বাংলাদেশের ৬৪ জেলার ভ্রমণ গাইড: দর্শনীয় স্থান, ট্রিপ প্ল্যান, খরচ ও যাতায়াত। Bangladesh travel guide to all 64 districts — tourist places, trip plans and budgets.";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

// Rich-text HTML -> one line of text.
export function plainText(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/\s+/g, " ")
    .trim();
}

const val = (obj, field, lang) => {
  if (!obj) return "";
  const bn = obj[`${field}_bn`];
  const en = obj[`${field}_en`] ?? obj[field];
  return (lang === "bn" ? bn || en : en || bn) || "";
};

const join = (parts, sep) => parts.filter(Boolean).join(sep);
const listOf = (items, n = 4) => (Array.isArray(items) ? items.filter(Boolean).slice(0, n).join(", ") : "");

export function districtSeo(d, lang = "bn", attractions = []) {
  const en = districtName(d.name_en);
  const name = lang === "bn" ? d.name_bn || en : en || d.name_bn;
  const places = listOf(attractions.map((a) => val(a, "name", lang)));
  if (lang === "bn") {
    return {
      title: `${name} ভ্রমণ গাইড`,
      description: join([
        `${name} ভ্রমণ গাইড${d.tagline ? `: ${d.tagline}` : ""}।`,
        places && `দর্শনীয় স্থান: ${places}।`,
        d.best_time && `ভ্রমণের সেরা সময় ${d.best_time}।`,
        d.budget && `আনুমানিক খরচ ${d.budget}।`,
        d.transport && `যাতায়াত: ${d.transport}।`,
      ], " "),
    };
  }
  return {
    title: `${name} Travel Guide`,
    description: join([
      `${name} travel guide${d.tagline ? ` — ${d.tagline}` : ""}.`,
      places && `Top places: ${places}.`,
      d.best_time && `Best time: ${d.best_time}.`,
      d.budget && `Budget: ${d.budget}.`,
      d.transport && `Getting there: ${d.transport}.`,
    ], " "),
  };
}

export function attractionSeo(a, lang = "bn") {
  const name = val(a, "name", lang);
  const district = lang === "bn" ? a.district_name_bn || a.district_name_en : a.district_name_en || a.district_name_bn;
  return {
    title: district ? `${name}, ${district}` : name,
    description: join([a.desc, district && (lang === "bn" ? `${district} জেলার দর্শনীয় স্থান।` : `A place to visit in ${district}, Bangladesh.`)], " — "),
  };
}

export function planSeo(p, lang = "bn") {
  return {
    title: val(p, "title", lang),
    description: join([p.duration, p.cost, plainText(val(p, "description", lang))], " · "),
  };
}

export function postSeo(post, lang = "bn") {
  return { title: val(post, "title", lang), description: plainText(post.excerpt) };
}

export function productSeo(p, lang = "bn") {
  return { title: val(p, "name", lang), description: p.summary || "" };
}
