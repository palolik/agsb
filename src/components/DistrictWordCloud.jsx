import { useMemo, useState } from "react";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { DISTRICT_PATHS } from "../data/bdMapShapes";
import { MAP_VIEWBOX } from "../data/districtMapPositions";
import { districtName } from "../lib/districtNames";

// Hero word cloud shaped like Bangladesh: each district's name sits on its own
// map pin over a faint outline of the country, sized by how well-known it is
// in the theme colour. Words cross-fade Bangla ⇄ English and drift
// left/right or up/down on their own timing. Motion is CSS (index.css,
// `.district-cloud`); only hovering re-renders, to light up that district.

const XL = ["dhaka", "chittagong", "coxs-bazar", "sylhet"];
const LG = ["khulna", "rajshahi", "barishal", "rangpur", "mymensingh", "bandarban", "rangamati", "sunamganj"];
const MD = ["gazipur", "comilla", "bogura", "jashore", "moulvibazar", "khagrachari", "kushtia", "dinajpur", "patuakhali", "bhola", "satkhira", "netrokona"];
const DIRECTIONS = ["left", "right", "up", "down"];

// Deterministic 0..1 noise so the cloud is stable across renders.
const noise = (i, salt) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function sizeOf(slug) {
  if (XL.includes(slug)) return { rem: 1.45, weight: 800 };
  if (LG.includes(slug)) return { rem: 1.05, weight: 700 };
  if (MD.includes(slug)) return { rem: 0.8, weight: 600 };
  return { rem: 0.62, weight: 500 };
}

function buildWords() {
  return ALL_DISTRICTS.map((d, i) => {
    const size = sizeOf(d.slug);
    return {
      slug: d.slug,
      en: districtName(d.name_en),
      bn: d.name_bn,
      left: (d.pin[0] / MAP_VIEWBOX.width) * 100,
      top: (d.pin[1] / MAP_VIEWBOX.height) * 100,
      ...size,
      // Big words paint on top of small ones.
      z: Math.round(size.rem * 10),
      dir: DIRECTIONS[Math.floor(noise(i, 1) * 4)],
      dist: 3 + Math.round(noise(i, 2) * 7),
      dur: 3 + noise(i, 3) * 4,
      delay: -noise(i, 4) * 8,
      swapDelay: -((i * 0.71) % 9),
      // Half the words start in English so both scripts are always on screen.
      startEn: noise(i, 5) > 0.5,
    };
  });
}

export default function DistrictWordCloud({ className = "" }) {
  const words = useMemo(buildWords, []);
  const [hover, setHover] = useState(null);

  return (
    <div className={`district-cloud ${className}`} aria-hidden="true">
      <div className="relative h-full mx-auto" style={{ aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}` }}>
        <svg viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`} className="dc-map absolute inset-0 w-full h-full">
          {Object.entries(DISTRICT_PATHS).map(([slug, paths]) =>
            paths.map((d, k) => (
              <path
                key={`${slug}-${k}`}
                d={d}
                className={slug === hover ? "dc-map-lit" : undefined}
              />
            ))
          )}
        </svg>
        {words.map(w => (
          <div
            key={w.slug}
            className="dc-pin absolute"
            style={{ left: `${w.left}%`, top: `${w.top}%`, zIndex: hover === w.slug ? 100 : w.z }}
            onMouseEnter={() => setHover(w.slug)}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className={`dc-word dc-${w.dir}${w.startEn ? " dc-start-en" : ""}`}
              style={{
                fontSize: `${w.rem}rem`,
                fontWeight: w.weight,
                "--dc-dist": `${w.dist}px`,
                "--dc-dur": `${w.dur.toFixed(2)}s`,
                "--dc-delay": `${w.delay.toFixed(2)}s`,
                "--dc-swap-delay": `${w.swapDelay.toFixed(2)}s`,
              }}
            >
              <span className="dc-bn">{w.bn}</span>
              <span className="dc-en">{w.en}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
