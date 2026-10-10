import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { resolveImage } from "../lib/api";
import { BRAND, HOME_TITLE, DEFAULT_DESCRIPTION } from "../lib/seo";

// Per-page <title>, description, Open Graph / Twitter tags and canonical URL.
// React 19 hoists <title>/<meta>/<link> rendered anywhere into <head>.
//
//   <PageMeta title="Sylhet" description="..." image={district.image} />
//
// - title: page name; the brand is appended ("Sylhet | আমিঘুরিসারাবাংলাদেশ").
//   Omit it for the brand-only title.
// - image: absolute URL, /uploads/... path (resolved against the API) or a
//   site-relative path such as /og.png (resolved against VITE_SITE_URL).
// - path: canonical path; defaults to the current pathname.
// - noindex: keep the page out of search results (account, cart, payment…).

export { BRAND, DEFAULT_DESCRIPTION };

const SITE_URL = (import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, "");

function absoluteImage(image) {
  if (!image) return "";
  if (/^https?:\/\//.test(image)) return image;
  if (image.startsWith("/uploads")) return resolveImage(image);
  return `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

// index.html ships default description/OG tags (marked data-default-meta) for
// crawlers that don't run JS. While a PageMeta is mounted they are detached so
// the page-specific tags aren't shadowed by duplicates; they come back when
// the last PageMeta unmounts (e.g. navigating to a page without one).
let mounted = 0;
let detached = [];

function useHideDefaults() {
  useLayoutEffect(() => {
    if (mounted++ === 0) {
      detached = Array.from(document.head.querySelectorAll("[data-default-meta]"));
      detached.forEach((el) => el.remove());
    }
    return () => {
      if (--mounted === 0) {
        detached.forEach((el) => document.head.appendChild(el));
        detached = [];
      }
    };
  }, []);
}

function clip(text, max = 200) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export default function PageMeta({ title, description, image, path, type = "website", noindex = false }) {
  const { pathname } = useLocation();
  useHideDefaults();

  const fullTitle = title ? `${title} | ${BRAND}` : HOME_TITLE;
  const desc = clip(description) || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path ?? pathname}`;
  const img = absoluteImage(image || "/og-image.png");

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex ? <meta name="robots" content="noindex, follow" /> : <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {img && <meta property="og:image" content={img} />}
      <meta name="twitter:card" content={img ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {img && <meta name="twitter:image" content={img} />}
    </>
  );
}
