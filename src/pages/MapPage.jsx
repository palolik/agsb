import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { MAP_VIEWBOX } from "../data/districtMapPositions";
import { HiX, HiExternalLink, HiMap, HiLocationMarker } from "react-icons/hi";
import { asArray, asText } from "../lib/safe";
import { Spinner, ErrorState } from "../components/StateViews";
import { districtName } from "../lib/districtNames";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";

const MARKER_COLOR = "#3FA66B";

// SVG markers act as buttons: Enter/Space select them like a click.
function onActivateKey(e, fn) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
}

// The map is as large as fits both the width and the visible height
// (dvh tracks the mobile URL bar), always keeping the SVG's aspect ratio,
// so no district is ever cut off at narrow widths.
const MAP_ASPECT = MAP_VIEWBOX.width / MAP_VIEWBOX.height;
const MAP_SIZE_STYLE = {
  aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}`,
  width: `min(100%, calc((100dvh - 64px) * ${MAP_ASPECT.toFixed(5)}))`,
  maxWidth: "100%",
  height: "auto",
};

export default function MapPage() {
  const [attempt, setAttempt] = useState(0);
  const meta = <PageMeta title="মানচিত্র · Interactive Map" description="Find districts with travel guides on an interactive map of Bangladesh." />;
  return <>{meta}<MapView key={attempt} onRetry={() => setAttempt((n) => n + 1)} /></>;
}

function MapView({ onRetry }) {
  const { data: districts, loading: districtsLoading, error: districtsError } = useFetch("/districts");
  const { data: divisions } = useFetch("/divisions");
  const [mapMarkup, setMapMarkup] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  // Only the districts with full guides get a marker — positioned using the same
  // pin coordinates the profile page's check-in map uses.
  const MAP_DISTRICTS = useMemo(() => asArray(districts)
    .map((d) => ({
      ...d,
      name_en: districtName(d.name_en),
      pin: ALL_DISTRICTS.find((ad) => ad.slug === d.slug)?.pin,
    }))
    .filter((d) => d.pin), [districts]);

  useEffect(() => {
    let cancelled = false;
    fetch("/assets/BD_Map_dark.svg")
      .then((res) => {
        if (!res.ok) throw new Error(`Map image failed to load (${res.status})`);
        return res.text();
      })
      .then((text) => { if (!cancelled) setMapMarkup(text); })
      .catch(() => { if (!cancelled) setMapError("The map could not be loaded. Check your connection and try again."); });
    return () => { cancelled = true; };
  }, []);

  const failure = mapError || districtsError;
  const busy = !failure && (!mapMarkup || districtsLoading);

  return (
    <div className="relative min-h-[calc(100dvh-64px)] h-[calc(100dvh-64px)] flex items-center justify-center bg-base-100">
      {(busy || failure) && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center px-4 bg-base-100/70">
          {failure ? <ErrorState message={failure} onRetry={onRetry} /> : <Spinner label="Loading map…" />}
        </div>
      )}

      {/* Map */}
      <div className="relative" style={MAP_SIZE_STYLE} data-testid="bd-map">
        <div
          role="img"
          aria-label="Map of Bangladesh"
          className="absolute inset-0 w-full h-full"
          dangerouslySetInnerHTML={{ __html: mapMarkup || "" }}
        />
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          className="absolute inset-0 w-full h-full"
          role="group"
          aria-label="District markers"
        >
          {MAP_DISTRICTS.map((d) => {
            const [x, y] = d.pin;
            const isHovered = hovered === d.slug;
            const isSelected = selected?.slug === d.slug;
            const tooltipWidth = Math.max(40, asText(d.name_en).length * 5.6 + 14);

            return (
              <g
                key={d.slug}
                transform={`translate(${x},${y})`}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${d.name_en} — show details`}
                aria-pressed={isSelected}
                onClick={() => setSelected(d)}
                onKeyDown={(e) => onActivateKey(e, () => setSelected(d))}
                onMouseEnter={() => setHovered(d.slug)}
                onMouseLeave={() => setHovered((h) => (h === d.slug ? null : h))}
                onFocus={() => setHovered(d.slug)}
                onBlur={() => setHovered((h) => (h === d.slug ? null : h))}
              >
                {/* Invisible larger hit-area so the whole district "region" is clickable, not just the pin */}
                <circle r={22} fill="transparent" />
                <circle
                  r={isHovered || isSelected ? 20 : 17}
                  fill={MARKER_COLOR}
                  opacity={isSelected ? 0.35 : isHovered ? 0.15 : 0}
                  style={{ transition: "opacity 0.15s, r 0.15s" }}
                />
                <circle
                  r={isHovered ? 7 : 5.5}
                  fill={MARKER_COLOR}
                  stroke="#0F3D24"
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
                      fill="#0A140F"
                      stroke="#1F3A2B"
                    />
                    <text textAnchor="middle" y={-4} fontSize="10" fill="#E3EDE7">
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
          <h1 className="text-lg font-bold text-base-content flex items-center gap-2"><HiMap className="text-primary" /> Bangladesh Map</h1>
          <p className="text-xs text-base-content/50">Click any marker to explore</p>
          {/* List fallback: the same districts as plain links, for keyboard,
              screen-reader and small-screen users who'd rather not use the map. */}
          {MAP_DISTRICTS.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-primary">List all {MAP_DISTRICTS.length} districts</summary>
              <ul className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
                {MAP_DISTRICTS.map((d) => (
                  <li key={d.slug}>
                    <Link to={`/districts/${d.slug}`} className="text-base-content/70 hover:text-primary">
                      {d.name_en}{d.name_bn ? ` · ${d.name_bn}` : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden md:block">
        <div className="bg-base-200/90 backdrop-blur-lg rounded-xl p-3 border border-base-300 shadow-xl">
          <p className="text-xs font-medium text-base-content/70 mb-2">Divisions</p>
          <div className="grid grid-cols-2 gap-1">
            {asArray(divisions).map(dv => (
              <div key={dv.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{background: dv.color}} />
                <span className="text-xs text-base-content/60">{districtName(dv.name_en)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected district panel */}
      {selected && (
        <div className="absolute left-4 right-4 bottom-4 max-h-[65%] sm:max-h-none sm:left-auto sm:top-4 z-[1000] sm:w-80 flex flex-col">
          <div className="bg-base-200/95 backdrop-blur-lg rounded-xl border border-base-300 shadow-2xl min-h-0 sm:h-full overflow-y-auto">
            <div className="relative">
              <CoverImage image={selected.image} alt={selected.name_en} className="w-full h-36 object-cover rounded-t-xl" placeholderClassName="w-full h-36 bg-base-300 rounded-t-xl" sizes="320px" width={320} height={144} priority />
              <button type="button" aria-label="Close district details" onClick={() => setSelected(null)} className="absolute top-2 right-2 btn btn-circle btn-sm btn-ghost bg-base-200/80">
                <HiX aria-hidden="true" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-200 p-3">
                <span className="badge badge-sm" style={{background: asArray(divisions).find(dv => dv.id === selected.division_id)?.color + "33", color: asArray(divisions).find(dv => dv.id === selected.division_id)?.color, border: "none"}}>
                  {districtName(asArray(divisions).find(dv => dv.id === selected.division_id)?.name_en)}
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
                {asArray(selected.attractions).slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-base-300/50 last:border-0">
                    <HiLocationMarker className="w-3.5 h-3.5 text-primary shrink-0" />
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
