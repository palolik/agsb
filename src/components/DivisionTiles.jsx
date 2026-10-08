import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import CoverImage from "./CoverImage";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { DISTRICT_PATHS } from "../data/bdMapShapes";
import { districtName } from "../lib/districtNames";
import { asArray } from "../lib/safe";
import { useLang } from "../context/LanguageContext";

// Home-page division cards: a photo of one of the division's districts, with
// the division's silhouette (cut from the same district outlines as the map)
// over it, so the section reads as eight pieces of one country.

// allDistricts.js division_id -> the slugs the API may store that division under.
const DIVISION_SLUGS = {
  1: ["dhaka"],
  2: ["chittagong", "chattogram"],
  3: ["khulna"],
  4: ["rajshahi"],
  5: ["rangpur"],
  6: ["barishal", "barisal"],
  7: ["sylhet"],
  8: ["mymensingh"],
};
// Districts whose photo stands for each division, best first; any other
// district of the division with an image is the fallback.
const COVER_DISTRICTS = {
  1: ["dhaka", "gazipur"],
  2: ["bandarban", "coxs-bazar", "rangamati"],
  3: ["bagerhat", "khulna", "satkhira"],
  4: ["rajshahi", "bogura", "naogaon"],
  5: ["rangpur", "dinajpur"],
  6: ["patuakhali", "barishal", "bhola"],
  7: ["sylhet", "sunamganj", "moulvibazar"],
  8: ["mymensingh", "netrokona", "sherpur"],
};
const ARGS = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7 };

// Bounding box of SVG paths, from their end points (close enough to crop by).
function pathBounds(paths) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of paths) {
    let x = 0, y = 0, sx = 0, sy = 0;
    for (const [, cmd, body] of d.matchAll(/([a-zA-Z])([^a-zA-Z]*)/g)) {
      const lower = cmd.toLowerCase();
      const rel = cmd === lower;
      const nums = (body.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number);
      if (lower === "z") { x = sx; y = sy; continue; }
      const n = ARGS[lower];
      if (!n) continue;
      for (let i = 0; i + n <= nums.length; i += n) {
        const a = nums.slice(i, i + n);
        if (lower === "h") x = rel ? x + a[0] : a[0];
        else if (lower === "v") y = rel ? y + a[0] : a[0];
        else {
          x = rel ? x + a[n - 2] : a[n - 2];
          y = rel ? y + a[n - 1] : a[n - 1];
        }
        if (lower === "m" && i === 0) { sx = x; sy = y; }
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

// division_id -> { paths, viewBox }, built once.
const SHAPES = Object.fromEntries(
  Object.keys(DIVISION_SLUGS).map(id => {
    const paths = ALL_DISTRICTS
      .filter(d => d.division_id === Number(id))
      .flatMap(d => DISTRICT_PATHS[d.slug] || []);
    const b = pathBounds(paths);
    const pad = 12;
    return [id, { paths, viewBox: `${b.minX - pad} ${b.minY - pad} ${b.maxX - b.minX + pad * 2} ${b.maxY - b.minY + pad * 2}` }];
  })
);

function localIdOf(division) {
  const slug = String(division?.slug || "").toLowerCase();
  return Object.keys(DIVISION_SLUGS).find(k => DIVISION_SLUGS[k].includes(slug)) || null;
}

function coverImageFor(division, localId, districts) {
  const own = asArray(districts).filter(d => d?.image && String(d.division_id) === String(division.id));
  const preferred = COVER_DISTRICTS[localId] || [];
  const best = preferred.map(slug => own.find(d => d.slug === slug)).find(Boolean);
  return (best || own[0])?.image || null;
}

export default function DivisionTiles({ divisions, districts, counts, countsReady }) {
  const { lang, t } = useLang();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {divisions.map((dv, i) => {
        const localId = localIdOf(dv);
        const shape = localId ? SHAPES[localId] : null;
        const image = coverImageFor(dv, localId, districts);
        const en = districtName(dv.name_en);
        const main = lang === "bn" ? dv.name_bn : en;
        const sub = lang === "bn" ? en : dv.name_bn;
        const count = counts[dv.id] || 0;
        return (
          <Link
            key={dv.id}
            to={`/districts?division=${dv.slug}`}
            className="division-tile group relative overflow-hidden rounded-2xl border border-base-300 bg-base-300 p-4 md:p-5 min-h-44 md:min-h-56 flex flex-col justify-between text-white"
            style={{ "--tile-delay": `${i * 60}ms` }}
          >
            <CoverImage image={image} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="division-photo absolute inset-0 w-full h-full object-cover" placeholderClassName="absolute inset-0 bg-gradient-to-br from-primary/60 to-base-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            {shape && (
              <svg viewBox={shape.viewBox} className="division-shape absolute right-2 top-2 h-[55%] w-[45%]" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
                {shape.paths.map((d, k) => <path key={k} d={d} />)}
              </svg>
            )}
            <span className="relative text-xs font-medium uppercase tracking-wider text-white/60">
              {t("বিভাগ", "Division")} {String(i + 1).padStart(2, "0")}
            </span>
            <div className="relative">
              <h3 className="text-xl md:text-2xl font-bold leading-tight drop-shadow">{main}</h3>
              <p className="text-sm text-white/70">{sub}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full photo-chip px-2.5 py-0.5 text-xs font-semibold">
                  {countsReady ? count : "–"} {t("জেলা", count === 1 ? "district" : "districts")}
                </span>
                <span className="division-arrow inline-flex h-6 w-6 items-center justify-center rounded-full photo-arrow">
                  <HiArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
