import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { HiArrowLeft, HiLocationMarker, HiClock, HiCurrencyBangladeshi, HiStar, HiUsers, HiDownload, HiCamera } from "react-icons/hi";
import { FaWhatsapp, FaMedal } from "react-icons/fa";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import { whatsappUrl } from "../config/site";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { ALL_DISTRICTS } from "../data/allDistricts";

// Only the 64 districts on the profile map can be checked in to.
const MAP_SLUGS = new Set(ALL_DISTRICTS.map((d) => d.slug));

const typeColors = { nature: "badge-success", historical: "badge-warning", religious: "badge-info", cultural: "badge-secondary", food: "badge-error", market: "badge-accent" };

export default function DistrictDetailPage() {
  const { slug } = useParams();
  const { data: district, loading, error, status, reload } = useFetch(`/districts/${slug}`);
  const { data: allDistricts } = useFetch("/districts");
  const { data: divisions } = useFetch("/divisions");
  const { data: travelPlans } = useFetch("/plans");

  // Only a 404 (or 400 for a malformed slug) means "not found"; network
  // failures (status null) and 5xx show ErrorState with a retry instead.
  const notFound = !loading && !district && (!error || status === 404 || status === 400);
  const meta = <PageMeta title={district ? [district.name_en, district.name_bn].filter(Boolean).join(" — ") : notFound ? "জেলা পাওয়া যায়নি · District not found" : "জেলা · Districts"} description={district ? district.tagline : undefined} image={district?.image} />;
  if (loading) return <>{meta}<Spinner /></>;
  if (error && !notFound) {
    return <>{meta}<div className="max-w-7xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div></>;
  }
  if (!district) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {meta}
        <EmptyState
          message="জেলাটি পাওয়া যায়নি · District not found. Check the link or browse all districts."
          action={<Link to="/districts" className="btn btn-primary btn-sm"><HiArrowLeft className="mr-1" /> Back to Districts</Link>}
        />
      </div>
    );
  }

  const division = asArray(divisions).find(dv => dv.id === district.division_id);
  const relatedPlans = asArray(travelPlans).filter(p => asArray(p.districts).includes(district.name_en));
  const nearby = asArray(allDistricts).filter(d => d.division_id === district.division_id && d.id !== district.id).slice(0, 3);

  return (
    <div>
      {meta}
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <CoverImage image={district.image} alt={district.name_en} sizes="100vw" width={1600} height={640} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <Link to="/districts" className="btn btn-sm btn-ghost text-base-content/70 mb-3">
            <HiArrowLeft className="mr-1" /> All Districts
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge" style={{background: division?.color + "22", color: division?.color, border: "none"}}>{division?.name_en}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-base-content">{district.name_bn}</h1>
          <p className="text-lg text-base-content/60">{district.name_en} — {district.tagline}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <HiClock />, label: "Best time", val: district.best_time },
                { icon: <HiCurrencyBangladeshi />, label: "Budget", val: district.budget },
                { icon: <HiStar />, label: "Difficulty", val: `${district.difficulty}/5` },
                { icon: <HiUsers />, label: "Type", val: district.family ? "Family-friendly" : "Adventure" },
              ].map(f => (
                <div key={f.label} className="card bg-base-200 p-3 border border-base-300">
                  <div className="text-primary mb-1">{f.icon}</div>
                  <div className="text-xs text-base-content/40">{f.label}</div>
                  <div className="text-sm font-medium text-base-content">{f.val}</div>
                </div>
              ))}
            </div>

            {/* Attractions */}
            <div>
              <h2 className="text-xl font-bold text-base-content mb-4">আকর্ষণীয় স্থান</h2>
              <div className="space-y-3">
                {asArray(district.attractions).map((a, i) => (
                  <div key={i} className="card bg-base-200 p-4 border border-base-300 flex flex-row items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                      <HiLocationMarker />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-base-content">{a.name}</h3>
                        <span className={`badge badge-xs ${typeColors[a.type] || "badge-ghost"}`}>{a.type}</span>
                      </div>
                      <p className="text-sm text-base-content/50 mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Food */}
            <div>
              <h2 className="text-xl font-bold text-base-content mb-4">স্থানীয় খাবার</h2>
              <div className="flex flex-wrap gap-2">
                {asArray(district.food).map((f, i) => (
                  <span key={i} className="badge badge-lg badge-ghost border-base-300 py-3">{f}</span>
                ))}
              </div>
            </div>

            {/* Transport */}
            <div>
              <h2 className="text-xl font-bold text-base-content mb-4">যাতায়াত</h2>
              <div className="card bg-base-200 p-4 border border-base-300">
                <p className="text-base-content/70">{district.transport}</p>
              </div>
            </div>

            {/* Related Plans */}
            {relatedPlans.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-base-content mb-4">ট্রাভেল প্ল্যান</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedPlans.map(p => (
                    <Link key={p.id} to={`/plans/${p.slug}`} className="card bg-base-200 p-4 border border-base-300 card-hover">
                      <h3 className="font-medium text-base-content">{p.title_bn}</h3>
                      <p className="text-sm text-base-content/50">{p.duration} · {p.cost}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* CTA card */}
            <div className="card bg-primary/10 border border-primary/20 p-5">
              <h3 className="font-bold text-base-content mb-2">এই জেলা ভ্রমণের পরিকল্পনা করুন</h3>
              <p className="text-sm text-base-content/60 mb-4">Questions about hotels, food or transport here? Get in touch.</p>
              {whatsappUrl() && (
                <a href={whatsappUrl(`Hi! I'd like to plan a trip to ${district.name_en}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full mb-2">
                  <FaWhatsapp className="mr-1" /> WhatsApp us
                </a>
              )}
              <Link
                to={`/contact?purpose=plan&district=${encodeURIComponent(district.slug || "")}`}
                className={`btn w-full ${whatsappUrl() ? "btn-outline btn-sm" : "btn-primary"}`}
              >
                Send a message
              </Link>
            </div>

            {/* Frame CTA */}
            <div className="card bg-base-200 border border-base-300 p-5">
              <h3 className="font-bold text-base-content mb-2 flex items-center gap-2"><HiCamera className="text-primary shrink-0" /> আমি ঘুরেছি — {district.name_bn}</h3>
              <p className="text-sm text-base-content/60 mb-3">Download this district's photo frame and share your memory.</p>
              <Link to="/frames" className="btn btn-secondary btn-sm w-full">
                <HiDownload className="mr-1" /> Get Frame
              </Link>
            </div>

            {/* Badge */}
            <div className="card bg-base-200 border border-base-300 p-5 text-center">
              <div className="district-badge w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center">
                <FaMedal className="w-7 h-7 text-base-content" />
              </div>
              <h3 className="font-bold text-base-content">District Badge</h3>
              <CheckIn district={district} />
            </div>

            {/* Nearby */}
            {nearby.length > 0 && (
              <div>
                <h3 className="font-bold text-base-content mb-3">কাছাকাছি জেলা</h3>
                <div className="space-y-2">
                  {nearby.map(d => (
                    <Link key={d.id} to={`/districts/${d.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300/50 transition-colors">
                      <CoverImage image={d.image} alt={d.name_en} className="w-12 h-12 rounded-lg object-cover" placeholderClassName="w-12 h-12 rounded-lg bg-base-300" sizes="48px" width={48} height={48} />
                      <div>
                        <div className="text-sm font-medium text-base-content">{d.name_bn}</div>
                        <div className="text-xs text-base-content/50">{d.name_en}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Logged in: toggles this district in the user's visited list (the same list
// the profile map edits). Logged out: sends them to log in and back here.
function CheckIn({ district }) {
  const { user, updateUser } = useAuth();
  const { pathname } = useLocation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!MAP_SLUGS.has(district.slug)) {
    return <p className="text-sm text-base-content/50 mt-1">Check-ins aren't available for this district yet.</p>;
  }

  if (!user) {
    return (
      <>
        <p className="text-sm text-base-content/50 mt-1">Log in to check in and earn your {district.name_en} badge!</p>
        <Link to="/login" state={{ from: pathname }} className="btn btn-ghost btn-sm mt-3">Log in to check in</Link>
      </>
    );
  }

  const visitedList = asArray(user.visitedDistricts);
  const visited = visitedList.includes(district.slug);

  async function toggle() {
    setSaving(true);
    setError("");
    try {
      // Rebuild from map slugs only so stale unknown entries don't count
      // against the server's 64-district cap.
      const known = visitedList.filter((s) => MAP_SLUGS.has(s) && s !== district.slug);
      const next = visited ? known : [...known, district.slug];
      await updateUser({ visitedDistricts: next });
    } catch (err) {
      setError(err?.message || "Couldn't save your check-in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="text-sm text-base-content/50 mt-1">
        {visited ? `You've checked in to ${district.name_en}.` : `Been to ${district.name_en}? Check in to earn the badge.`}
      </p>
      <button type="button" onClick={toggle} disabled={saving} className={`btn btn-sm mt-3 ${visited ? "btn-ghost" : "btn-primary"}`}>
        {saving ? <span className="loading loading-spinner loading-xs" /> : null}
        {visited ? "Undo check-in" : "Check in"}
      </button>
      {error && <p role="alert" className="text-xs text-error mt-2">{error}</p>}
    </>
  );
}
