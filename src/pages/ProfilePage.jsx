import { useState, useEffect, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { districts, stats } from "../data";
import { MAP_VIEWBOX, DISTRICT_PIN_POSITIONS } from "../data/districtMapPositions";
import { HiMail, HiPhone, HiCalendar } from "react-icons/hi";
import { FaSignOutAlt } from "react-icons/fa";

const DEFAULT_GREEN = "#173B23";
const SELECTED_GREEN = "#4CAF50";

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [hovered, setHovered] = useState(null);
  const [mapMarkup, setMapMarkup] = useState(null);
  const mapContainerRef = useRef(null);

  const visited = user?.visitedDistricts || [];

  useEffect(() => {
    fetch("/assets/BD_Map_dark.svg")
      .then((r) => r.text())
      .then(setMapMarkup)
      .catch(() => {});
  }, []);

  function toggleDistrict(slug) {
    const next = visited.includes(slug) ? visited.filter((s) => s !== slug) : [...visited, slug];
    updateUser({ visitedDistricts: next });
  }

  // Sync the inlined map's district shapes (tagged with data-slug) to visited state,
  // and let clicking a shape toggle it the same way a pin click does.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    container.querySelectorAll("[data-slug]").forEach((node) => {
      const slug = node.getAttribute("data-slug");
      node.setAttribute("fill", visited.includes(slug) ? SELECTED_GREEN : DEFAULT_GREEN);
      node.style.cursor = "pointer";
      node.style.transition = "fill 0.15s";
      node.onclick = () => toggleDistrict(slug);
    });
  }, [mapMarkup, visited]);

  if (!user) return <Navigate to="/login" replace />;

  const progress = Math.round((visited.length / stats.districts) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile sidebar — top on mobile, left on desktop */}
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
            <p className="text-xs text-base-content/50 mt-2">{progress}% complete — click a pin on the map to check in.</p>
          </div>

          {/* Visited list */}
          <div className="card bg-base-200 border border-base-300 p-5">
            <h3 className="font-bold text-base-content mb-3 text-sm">Visited Districts</h3>
            {visited.length === 0 ? (
              <p className="text-sm text-base-content/40">No districts checked in yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visited.map((slug) => {
                  const d = districts.find((dd) => dd.slug === slug);
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
                ref={mapContainerRef}
                className="absolute inset-0 w-full h-full [&_svg]:w-full [&_svg]:h-full"
                dangerouslySetInnerHTML={mapMarkup ? { __html: mapMarkup } : undefined}
              />
              <svg
                viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: "none" }}
              >
                {districts.map((d) => {
                  const pos = DISTRICT_PIN_POSITIONS[d.slug];
                  if (!pos) return null;
                  const [x, y] = pos;
                  const isVisited = visited.includes(d.slug);
                  const isHovered = hovered === d.slug;
                  const tooltipWidth = Math.max(50, d.name_en.length * 6.4 + 16);

                  return (
                    <g
                      key={d.id}
                      transform={`translate(${x},${y})`}
                      className="cursor-pointer"
                      style={{ pointerEvents: "auto" }}
                      onClick={() => toggleDistrict(d.slug)}
                      onMouseEnter={() => setHovered(d.slug)}
                      onMouseLeave={() => setHovered((h) => (h === d.slug ? null : h))}
                    >
                      <circle
                        r={isHovered ? 13 : 10}
                        fill={isVisited ? SELECTED_GREEN : "#5b6072"}
                        stroke={isVisited ? "#1B5E20" : "#22252e"}
                        strokeWidth="2.5"
                        opacity={isVisited ? 1 : 0.8}
                        style={{ transition: "r 0.15s" }}
                      />
                      {isVisited && (
                        <text textAnchor="middle" dy="4.5" fontSize="13" fill="#fff" fontWeight="bold" pointerEvents="none">
                          ✓
                        </text>
                      )}
                      {isHovered && (
                        <g transform="translate(0,-20)" pointerEvents="none">
                          <rect
                            x={-tooltipWidth / 2}
                            y={-20}
                            width={tooltipWidth}
                            height={22}
                            rx={5}
                            fill="#181c27"
                            stroke="#2f333e"
                          />
                          <text textAnchor="middle" y={-4.5} fontSize="11" fill="#e8e8ec">
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
            Click a pin to mark that district as visited or unvisited.
          </p>
        </div>
      </div>
    </div>
  );
}
