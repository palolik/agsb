import { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { formatDateRange } from "../lib/planSchedule";
import { PAYMENT_STATUS, BOOKING_STATUS, taka, canPay } from "../lib/booking";
import { MAP_VIEWBOX } from "../data/districtMapPositions";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { HiMail, HiPhone, HiCalendar, HiCamera, HiStar } from "react-icons/hi";
import { FaSignOutAlt, FaMedal, FaSuitcaseRolling } from "react-icons/fa";
import { asArray } from "../lib/safe";
import { districtName } from "../lib/districtNames";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import { centerMapLabels } from "../lib/mapMarkup";

// Theme colours (src/index.css). SVG presentation attributes can't use
// var(), so marker colours are applied through `style`.
const SELECTED_COLOR = "var(--map-visited)";
const PENDING_COLOR = "var(--map-pending)";

const EMPTY = [];
// Bangladesh has 64 districts; the check-in tracker covers all of them.
const TOTAL_DISTRICTS = ALL_DISTRICTS.length;
const DISTRICT_BY_SLUG = new Map(ALL_DISTRICTS.map((d) => [d.slug, d]));

// Touch devices and small screens confirm a check-in before saving, so
// scrolling or panning across the map can't toggle districts by accident.
const CONFIRM_QUERY = "(hover: none), (pointer: coarse), (max-width: 767px)";
function subscribeConfirmMode(cb) {
  const mq = window.matchMedia(CONFIRM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useConfirmMode() {
  return useSyncExternalStore(
    subscribeConfirmMode,
    () => window.matchMedia(CONFIRM_QUERY).matches,
    () => false,
  );
}

export default function ProfilePage() {
  const { user, ready, logout, updateUser } = useAuth();
  const [hovered, setHovered] = useState(null);
  const [mapMarkup, setMapMarkup] = useState(null);
  const mapRef = useRef(null);
  const confirmMode = useConfirmMode();
  // Check-in saves: `optimistic` is the list shown while saves are in flight;
  // `desiredRef` always holds the newest wanted list, so every toggle builds on
  // the latest state (never on a stale render) and saves run one at a time.
  const [optimistic, setOptimistic] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pendingSlug, setPendingSlug] = useState(null);
  const desiredRef = useRef(null);
  const inFlightRef = useRef(false);

  const rawVisited = user?.visitedDistricts;
  const savedVisited = useMemo(() => (Array.isArray(rawVisited) ? rawVisited : EMPTY), [rawVisited]);
  const visited = optimistic ?? savedVisited;
  const savedRef = useRef(savedVisited);
  useEffect(() => { savedRef.current = savedVisited; }, [savedVisited]);
  const visitedSet = useMemo(() => new Set(visited), [visited]);
  // Only slugs on the map count; anything else (old or renamed districts)
  // would push the tally past 64 with no badge to show for it.
  const visitedDistricts = useMemo(
    () => visited.map((slug) => DISTRICT_BY_SLUG.get(slug)).filter(Boolean),
    [visited],
  );
  const visitedCount = visitedDistricts.length;

  useEffect(() => {
    fetch("/assets/BD_Map_dark.svg")
      .then((res) => res.text())
      .then((text) => setMapMarkup(centerMapLabels(text)))
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
      if (visitedSet.has(el.dataset.slug)) {
        // Use !important to override any inline fill styles baked into the SVG
        el.style.setProperty("fill", SELECTED_COLOR, "important");
        el.style.setProperty("fill-opacity", "0.9", "important");
      } else {
        el.style.removeProperty("fill");
        el.style.removeProperty("fill-opacity");
      }
      el.style.setProperty("transition", "fill-opacity 0.15s");
    });

    return svg.outerHTML;
  }, [mapMarkup, visitedSet]);

  const meta = <PageMeta title="আমার প্রোফাইল · My Profile" />;
  if (!ready) return meta;
  if (!user) return <>{meta}<Navigate to="/login" replace state={{ from: "/profile" }} /></>;

  const progress = Math.round((visitedCount / TOTAL_DISTRICTS) * 100);

  async function flushSaves() {
    inFlightRef.current = true;
    setSaving(true);
    try {
      // Keep saving until the server has the newest list (clicks made while
      // a save was in flight are sent by the next pass, not lost).
      let sent = null;
      while (desiredRef.current && desiredRef.current !== sent) {
        sent = desiredRef.current;
        await updateUser({ visitedDistricts: sent });
      }
    } catch (err) {
      setSaveError(`Couldn't save your check-in${err?.message ? `: ${err.message}` : ""}. Your map was restored — please try again.`);
    } finally {
      // Success: the user record now holds the list. Failure: fall back to
      // the last list the server confirmed.
      desiredRef.current = null;
      setOptimistic(null);
      inFlightRef.current = false;
      setSaving(false);
    }
  }

  function toggleDistrict(slug) {
    // Drop unknown slugs so stale entries don't count against the 64 cap.
    const base = (desiredRef.current ?? savedRef.current).filter((s) => DISTRICT_BY_SLUG.has(s));
    const next = base.includes(slug) ? base.filter((s) => s !== slug) : [...base, slug];
    desiredRef.current = next;
    setOptimistic(next);
    setSaveError("");
    if (!inFlightRef.current) flushSaves();
  }

  function onDistrictClick(slug) {
    if (confirmMode) {
      setPendingSlug((cur) => (cur === slug ? null : slug));
    } else {
      toggleDistrict(slug);
    }
  }

  function confirmPending() {
    if (!pendingSlug) return;
    toggleDistrict(pendingSlug);
    setPendingSlug(null);
  }

  const pendingDistrict = pendingSlug ? DISTRICT_BY_SLUG.get(pendingSlug) : null;
  const pendingIsVisited = pendingSlug ? visitedSet.has(pendingSlug) : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
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
            <button onClick={logout} className="btn btn-ghost btn-sm w-full mt-4">
              <FaSignOutAlt className="mr-1" /> Logout
            </button>
          </div>

          {/* Progress */}
          <div className="card bg-primary/10 border border-primary/20 p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-base-content text-sm flex items-center gap-2"><FaMedal className="text-primary" /> 64-District Challenge</h2>
              <span className="text-sm text-base-content/60">{visitedCount}/{TOTAL_DISTRICTS}</span>
            </div>
            <progress className="progress progress-primary w-full" value={visitedCount} max={TOTAL_DISTRICTS}></progress>
            <p className="text-xs text-base-content/50 mt-2">{progress}% complete — {confirmMode ? "tap" : "click"} a district on the map to check in.</p>
          </div>

          {/* Visited list */}
          <div className="card bg-base-200 border border-base-300 p-5">
            <h3 className="font-bold text-base-content mb-3 text-sm">Visited Districts</h3>
            {visitedDistricts.length === 0 ? (
              <p className="text-sm text-base-content/40">No districts checked in yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visitedDistricts.map((d) => (
                  <span key={d.slug} className="badge badge-success badge-outline">{districtName(d.name_en)}</span>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-2">
            <Link to="/frames" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <HiCamera className="w-6 h-6 text-primary mx-auto" />
              <div className="text-xs text-base-content mt-1">Frames</div>
            </Link>
            <Link to="/plans" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <FaSuitcaseRolling className="w-6 h-6 text-primary mx-auto" />
              <div className="text-xs text-base-content mt-1">Plans</div>
            </Link>
            <Link to="/membership" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <HiStar className="w-6 h-6 text-primary mx-auto" />
              <div className="text-xs text-base-content mt-1">Upgrade</div>
            </Link>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 border border-base-300 p-4">
            {saveError && (
              <div role="alert" className="alert alert-error mb-3 text-sm" data-testid="checkin-error">
                <span>{saveError}</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSaveError("")}>Dismiss</button>
              </div>
            )}
            <div className="relative w-full" style={{ aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}` }}>
              <div
                ref={mapRef}
                role="img"
                aria-label="Map of Bangladesh"
                className="bd-map absolute inset-0 w-full h-full"
                dangerouslySetInnerHTML={{ __html: coloredMarkup }}
              />
              <svg
                viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
                className="absolute inset-0 w-full h-full"
                role="group"
                aria-label="Districts — select to check in"
              >
                {ALL_DISTRICTS.map((d) => {
                  const [x, y] = d.pin;
                  const isVisited = visitedSet.has(d.slug);
                  const isPending = pendingSlug === d.slug;
                  const isHovered = hovered === d.slug || isPending;
                  const label = districtName(d.name_en);
                  const tooltipWidth = Math.max(40, label.length * 5.6 + 14);

                  return (
                    <g
                      key={d.slug}
                      transform={`translate(${x},${y})`}
                      className="cursor-pointer"
                      data-slug={d.slug}
                      role="button"
                      aria-label={`${label}${isVisited ? " (visited)" : ""}`}
                      aria-pressed={isVisited}
                      tabIndex={0}
                      onClick={() => onDistrictClick(d.slug)}
                      onKeyDown={(e) => {
                        // Enter/Space toggle the district, like a click.
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onDistrictClick(d.slug);
                        }
                      }}
                      onMouseEnter={() => setHovered(d.slug)}
                      onMouseLeave={() => setHovered((h) => (h === d.slug ? null : h))}
                      onFocus={() => setHovered(d.slug)}
                      onBlur={() => setHovered((h) => (h === d.slug ? null : h))}
                    >
                      <circle r={22} fill="transparent" />
                      <circle
                        r={isHovered ? 20 : 17}
                        opacity={isPending ? 0.45 : isVisited ? 0.3 : isHovered ? 0.1 : 0}
                        style={{ fill: isPending ? PENDING_COLOR : isVisited ? SELECTED_COLOR : "var(--map-halo)", transition: "opacity 0.15s, r 0.15s" }}
                      />
                      <circle
                        r={isHovered ? 7 : 5}
                        strokeWidth="1.5"
                        opacity={isVisited ? 1 : 0.8}
                        style={{
                          fill: isVisited ? SELECTED_COLOR : "var(--map-unvisited)",
                          stroke: isVisited ? "var(--map-visited-stroke)" : "var(--map-unvisited-stroke)",
                          transition: "r 0.15s",
                        }}
                      />
                      {isHovered && (
                        <g transform="translate(0,-14)" pointerEvents="none">
                          <rect
                            x={-tooltipWidth / 2}
                            y={-18}
                            width={tooltipWidth}
                            height={20}
                            rx={5}
                            style={{ fill: "var(--map-tip-bg)", stroke: "var(--map-tip-border)" }}
                          />
                          <text textAnchor="middle" y={-4} fontSize="10" style={{ fill: "var(--map-tip-text)" }}>
                            {label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          <p className="text-xs text-base-content/40 mt-2 text-center" aria-live="polite">
            {saving
              ? "Saving your check-ins…"
              : confirmMode
                ? "Tap a district, then confirm to mark it as visited or unvisited."
                : "Click any district to mark it as visited or unvisited."}
          </p>
        </div>
      </div>

      <BookingsSection />

      {confirmMode && pendingDistrict && (
        <div
          className="fixed inset-x-0 bottom-0 z-[1100] px-4 pt-3 bg-base-200/95 backdrop-blur border-t border-base-300 shadow-2xl"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          role="dialog"
          aria-label="Confirm check-in"
          data-testid="checkin-confirm"
        >
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <p className="flex-1 text-sm text-base-content">
              {pendingIsVisited
                ? `Remove ${districtName(pendingDistrict.name_en)} from your visited districts?`
                : `Mark ${districtName(pendingDistrict.name_en)} as visited?`}
            </p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingSlug(null)}>Cancel</button>
            <button type="button" className={`btn btn-sm ${pendingIsVisited ? "btn-error" : "btn-primary"}`} onClick={confirmPending}>
              {pendingIsVisited ? "Remove" : "Mark visited"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingsSection() {
  const [attempt, setAttempt] = useState(0);
  return <MyBookings key={attempt} onRetry={() => setAttempt((n) => n + 1)} />;
}

function MyBookings({ onRetry }) {
  const { data: bookings, loading, error } = useFetch("/bookings/my");

  return (
    <div id="bookings" className="card bg-base-200 border border-base-300 p-5 mt-6">
      <h2 className="font-bold text-base-content mb-3">My bookings</h2>
      {loading ? (
        <Spinner label="Loading your bookings…" />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : asArray(bookings).length === 0 ? (
        <EmptyState
          message="No bookings yet."
          action={<Link to="/plans" className="btn btn-primary btn-sm">Browse trip plans</Link>}
        />
      ) : (
        <div className="space-y-3">
          {asArray(bookings).map((b) => {
            const pay = PAYMENT_STATUS[b.paymentStatus] || PAYMENT_STATUS.unpaid;
            const status = BOOKING_STATUS[b.bookingStatus] || BOOKING_STATUS.pending;
            return (
              <div key={b._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-base-300/40 border border-base-300">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-base-content">{b.referenceCode}</span>
                    <span className={`badge badge-sm ${status.badge}`}>{status.label}</span>
                    <span className={`badge badge-sm ${pay.badge}`}>{pay.label}</span>
                  </div>
                  <p className="font-medium text-base-content mt-1 truncate">{b.planTitle_en}</p>
                  <p className="text-xs text-base-content/50">
                    {b.start_date && `${formatDateRange(b.start_date, b.end_date)} · `}{b.ticketCount} ticket{b.ticketCount === 1 ? "" : "s"} · {taka(b.totalAmount)} total
                  </p>
                </div>
                <Link to={`/bookings/${b._id}/checkout`} className={`btn btn-sm shrink-0 ${canPay(b) ? "btn-primary" : "btn-ghost"}`}>
                  {canPay(b) ? `Pay ${taka(b.advanceAmount)}` : "View"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}