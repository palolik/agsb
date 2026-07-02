import { useState, useEffect, useRef, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { stats } from "../data";
import { MAP_VIEWBOX } from "../data/districtMapPositions";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { HiMail, HiPhone, HiCalendar } from "react-icons/hi";
import { FaSignOutAlt } from "react-icons/fa";

const SELECTED_GREEN = "#4CAF50";

export default function ProfilePage() {
  const { user, ready, logout, updateUser } = useAuth();
  const [hovered, setHovered] = useState(null);
  const [mapMarkup, setMapMarkup] = useState(null);
  const mapRef = useRef(null);

  const visited = user?.visitedDistricts || [];

  useEffect(() => {
    fetch("/assets/BD_Map_dark.svg")
      .then((res) => res.text())
      .then(setMapMarkup)
      .catch(() => {});
  }, []);

  // Bake visited-district colors directly into the SVG markup so they
  // survive every React re-render without imperative DOM patching.
  const coloredMarkup = useMemo(() => {
    if (!mapMarkup) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(mapMarkup, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return mapMarkup;

    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.display = "block";

    svg.querySelectorAll("[data-slug]").forEach((el) => {
      if (visited.includes(el.dataset.slug)) {
        // Use !important to override any inline fill styles baked into the SVG
        el.style.setProperty("fill", SELECTED_GREEN, "important");
        el.style.setProperty("fill-opacity", "0.9", "important");
      } else {
        el.style.removeProperty("fill");
        el.style.removeProperty("fill-opacity");
      }
      el.style.setProperty("transition", "fill-opacity 0.15s");
    });

    return svg.outerHTML;
  }, [mapMarkup, visited]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  const progress = Math.round((visited.length / stats.districts) * 100);

  function toggleDistrict(slug) {
    const next = visited.includes(slug) ? visited.filter((s) => s !== slug) : [...visited, slug];
    updateUser({ visitedDistricts: next });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="card bg-base-200 border border-base-300 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-3xl mx-auto mb-3">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold text-base-content">{user.name}</h1>
              <span className="badge badge-primary badge-sm">{user.plan || "Explorer"}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-base-content/60">
              <div className="flex items-center justify-center gap-1.5"><HiMail /> {user.email}</div>
              {user.phone && <div className="flex items-center justify-center gap-1.5"><HiPhone /> {user.phone}</div>}
              <div className="flex items-center justify-center gap-1.5"><HiCalendar /> Joined {user.joined}</div>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-sm border-base-300 w-full mt-4">
              <FaSignOutAlt className="mr-1" /> Logout
            </button>
          </div>

          {/* Progress */}
          <div className="card bg-primary/10 border border-primary/20 p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-base-content text-sm">🏅 64-District Challenge</h2>
              <span className="text-sm text-base-content/60">{visited.length}/{stats.districts}</span>
            </div>
            <progress className="progress progress-primary w-full" value={visited.length} max={stats.districts}></progress>
            <p className="text-xs text-base-content/50 mt-2">{progress}% complete — click a district on the map to check in.</p>
          </div>

          {/* Visited list */}
          <div className="card bg-base-200 border border-base-300 p-5">
            <h3 className="font-bold text-base-content mb-3 text-sm">Visited Districts</h3>
            {visited.length === 0 ? (
              <p className="text-sm text-base-content/40">No districts checked in yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visited.map((slug) => {
                  const d = ALL_DISTRICTS.find((dd) => dd.slug === slug);
                  return d ? (
                    <span key={slug} className="badge badge-success badge-outline">{d.name_en}</span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-2">
            <Link to="/frames" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <div className="text-xl">📸</div>
              <div className="text-xs text-base-content mt-1">Frames</div>
            </Link>
            <Link to="/plans" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <div className="text-xl">🧳</div>
              <div className="text-xs text-base-content mt-1">Plans</div>
            </Link>
            <Link to="/membership" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <div className="text-xl">⭐</div>
              <div className="text-xs text-base-content mt-1">Upgrade</div>
            </Link>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 border border-base-300 p-4">
            <div className="relative w-full" style={{ aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}` }}>
              <div
                ref={mapRef}
                role="img"
                aria-label="Map of Bangladesh"
                className="absolute inset-0 w-full h-full"
                dangerouslySetInnerHTML={{ __html: coloredMarkup }}
              />
              <svg
                viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
                className="absolute inset-0 w-full h-full"
              >
                {ALL_DISTRICTS.map((d) => {
                  const [x, y] = d.pin;
                  const isVisited = visited.includes(d.slug);
                  const isHovered = hovered === d.slug;
                  const tooltipWidth = Math.max(40, d.name_en.length * 5.6 + 14);

                  return (
                    <g
                      key={d.slug}
                      transform={`translate(${x},${y})`}
                      className="cursor-pointer"
                      onClick={() => toggleDistrict(d.slug)}
                      onMouseEnter={() => setHovered(d.slug)}
                      onMouseLeave={() => setHovered((h) => (h === d.slug ? null : h))}
                    >
                      <circle r={22} fill="transparent" />
                      <circle
                        r={isHovered ? 20 : 17}
                        fill={isVisited ? SELECTED_GREEN : "#ffffff"}
                        opacity={isVisited ? 0.3 : isHovered ? 0.1 : 0}
                        style={{ transition: "opacity 0.15s, r 0.15s" }}
                      />
                      <circle
                        r={isHovered ? 7 : 5}
                        fill={isVisited ? SELECTED_GREEN : "#5b6072"}
                        stroke={isVisited ? "#1B5E20" : "#22252e"}
                        strokeWidth="1.5"
                        opacity={isVisited ? 1 : 0.8}
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
          </div>
          <p className="text-xs text-base-content/40 mt-2 text-center">
            Click any district to mark it as visited or unvisited.
          </p>
        </div>
      </div>
    </div>
  );
}