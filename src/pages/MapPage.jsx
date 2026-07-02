import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { districts, divisions } from "../data";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { MAP_VIEWBOX } from "../data/districtMapPositions";
import { HiX, HiExternalLink } from "react-icons/hi";

const MARKER_GREEN = "#4CAF50";

// Only the districts with full guides get a marker — positioned using the same
// pin coordinates the profile page's check-in map uses.
const MAP_DISTRICTS = districts
  .map((d) => ({ ...d, pin: ALL_DISTRICTS.find((ad) => ad.slug === d.slug)?.pin }))
  .filter((d) => d.pin);

export default function MapPage() {
  const [mapMarkup, setMapMarkup] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/assets/BD_Map_dark.svg")
      .then((res) => res.text())
      .then(setMapMarkup)
      .catch(() => {});
  }, []);

  return (
    <div className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-base-100">
      {/* Map */}
      <div className="relative h-full" style={{ aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}` }}>
        <div
          role="img"
          aria-label="Map of Bangladesh"
          className="absolute inset-0 w-full h-full"
          dangerouslySetInnerHTML={{ __html: mapMarkup || "" }}
        />
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          className="absolute inset-0 w-full h-full"
        >
          {MAP_DISTRICTS.map((d) => {
            const [x, y] = d.pin;
            const isHovered = hovered === d.slug;
            const isSelected = selected?.slug === d.slug;
            const tooltipWidth = Math.max(40, d.name_en.length * 5.6 + 14);

            return (
              <g
                key={d.slug}
                transform={`translate(${x},${y})`}
                className="cursor-pointer"
                onClick={() => setSelected(d)}
                onMouseEnter={() => setHovered(d.slug)}
                onMouseLeave={() => setHovered((h) => (h === d.slug ? null : h))}
              >
                {/* Invisible larger hit-area so the whole district "region" is clickable, not just the pin */}
                <circle r={22} fill="transparent" />
                <circle
                  r={isHovered || isSelected ? 20 : 17}
                  fill={MARKER_GREEN}
                  opacity={isSelected ? 0.35 : isHovered ? 0.15 : 0}
                  style={{ transition: "opacity 0.15s, r 0.15s" }}
                />
                <circle
                  r={isHovered ? 7 : 5.5}
                  fill={MARKER_GREEN}
                  stroke="#1B5E20"
                  strokeWidth="1.5"
                  style={{ transition: "r 0.15s" }}
                />
                {isHovered && (
                  <g transform="translate(0,-14)" pointerEvents="none">
                    <rect
                      x={-tooltipWidth / 2}
                      y={-18}
                      width={tooltipWidth}
                      height={20}
                      rx={5}
                      fill="#181c27"
                      stroke="#2f333e"
                    />
                    <text textAnchor="middle" y={-4} fontSize="10" fill="#e8e8ec">
                      {d.name_en}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Header overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-base-200/90 backdrop-blur-lg rounded-xl p-3 border border-base-300 shadow-xl">
          <h1 className="text-lg font-bold text-base-content">🗺️ Bangladesh Map</h1>
          <p className="text-xs text-base-content/50">Click any marker to explore</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden md:block">
        <div className="bg-base-200/90 backdrop-blur-lg rounded-xl p-3 border border-base-300 shadow-xl">
          <p className="text-xs font-medium text-base-content/70 mb-2">Divisions</p>
          <div className="grid grid-cols-2 gap-1">
            {divisions.map(dv => (
              <div key={dv.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{background: dv.color}} />
                <span className="text-xs text-base-content/60">{dv.name_en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected district panel */}
      {selected && (
        <div className="absolute top-4 right-4 bottom-4 z-[1000] w-72 sm:w-80">
          <div className="bg-base-200/95 backdrop-blur-lg rounded-xl border border-base-300 shadow-2xl h-full overflow-y-auto">
            <div className="relative">
              <img src={selected.image} alt={selected.name_en} className="w-full h-36 object-cover rounded-t-xl" />
              <button onClick={() => setSelected(null)} className="absolute top-2 right-2 btn btn-circle btn-sm btn-ghost bg-base-200/80">
                <HiX />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-200 p-3">
                <span className="badge badge-sm" style={{background: divisions.find(dv => dv.id === selected.division_id)?.color + "33", color: divisions.find(dv => dv.id === selected.division_id)?.color, border: "none"}}>
                  {divisions.find(dv => dv.id === selected.division_id)?.name_en}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold text-base-content">{selected.name_bn}</h2>
              <p className="text-sm text-base-content/60">{selected.name_en}</p>
              <p className="text-sm text-primary mt-1">{selected.tagline}</p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-base-300/50 rounded-lg p-2">
                  <div className="text-xs text-base-content/40">Budget</div>
                  <div className="text-sm font-medium text-base-content">{selected.budget}</div>
                </div>
                <div className="bg-base-300/50 rounded-lg p-2">
                  <div className="text-xs text-base-content/40">Best time</div>
                  <div className="text-sm font-medium text-base-content">{selected.best_time}</div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-base-content/50 mb-2">Top attractions</p>
                {selected.attractions.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-base-300/50 last:border-0">
                    <span className="text-xs">📍</span>
                    <span className="text-sm text-base-content/70">{a.name}</span>
                  </div>
                ))}
              </div>

              <Link to={`/districts/${selected.slug}`} className="btn btn-primary btn-sm w-full mt-4">
                View full guide <HiExternalLink className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
