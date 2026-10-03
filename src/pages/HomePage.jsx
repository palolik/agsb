import { Link } from "react-router-dom";
import { districtCountsByDivision, countAttractions } from "../data";
import { useFetch } from "../hooks/useFetch";
import { toPlainText } from "../lib/richText";
import { HiArrowRight, HiLocationMarker, HiMap, HiStar, HiClock, HiUserGroup, HiCalendar } from "react-icons/hi";
import { FaSuitcaseRolling, FaHiking } from "react-icons/fa";
import { planStatus, formatDateRange } from "../lib/planSchedule";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";

export default function HomePage() {
  // Each section handles its own loading/error/empty state, so one failed
  // request never blanks the rest of the page.
  const districtsQ = useFetch("/districts");
  const divisionsQ = useFetch("/divisions");
  const blogQ = useFetch("/blog");
  const plansQ = useFetch("/plans");
  const districts = districtsQ.data;
  const divisions = divisionsQ.data;
  const blogPosts = blogQ.data;
  const travelPlans = plansQ.data;
  const featured = asArray(districts).filter(d => d.status === "complete").slice(0, 6);
  const countsByDivision = districtCountsByDivision(districts);

  // Stats come straight from the API responses; a stat whose request failed
  // is left out instead of showing a made-up number.
  const statItems = [
    !districtsQ.error && { label: "Districts", val: districtsQ.loading ? null : asArray(districts).length, icon: HiMap },
    !districtsQ.error && { label: "Attractions", val: districtsQ.loading ? null : countAttractions(districts), icon: HiLocationMarker },
    !plansQ.error && { label: "Travel Plans", val: plansQ.loading ? null : asArray(travelPlans).length, icon: FaSuitcaseRolling },
  ].filter(Boolean);

  const meta = <PageMeta description="Plan trips, discover hidden gems, collect district badges, and become a true explorer of Bangladesh — district by district." />;
  return (
    <div>
      {meta}
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23F2A93B\" fill-opacity=\"0.3\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              ৬৪ জেলা চ্যালেঞ্জ — শুরু করুন আজই
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-base-content leading-tight mb-4">
              ৬৪ জেলা,<br />
              <span className="text-primary">এক দেশ,</span><br />
              অসংখ্য গল্প।
            </h1>
            <p className="text-lg text-base-content/60 mb-8 max-w-xl">
              Plan trips, discover hidden gems, collect district badges, and become a true explorer of Bangladesh.
              Your 64-district journey starts here.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/districts" className="btn btn-primary btn-lg">
                Explore Districts <HiArrowRight className="ml-1" />
              </Link>
              <Link to="/map" className="btn btn-ghost btn-lg border-none">
                <HiMap className="mr-1" /> Open Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {statItems.length > 0 && (
      <section className="bg-base-200 border-y border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-wrap justify-center gap-x-16 gap-y-6 text-center" data-testid="home-stats">
            {statItems.map(s => (
              <div key={s.label} data-stat={s.label}>
                <s.icon className="w-7 h-7 text-primary mx-auto mb-1" />
                <div className="text-2xl md:text-3xl font-bold text-primary" data-stat-value>
                  {s.val === null ? <span className="loading loading-dots loading-sm" aria-label="Loading" /> : s.val.toLocaleString("en-US")}
                </div>
                <div className="text-sm text-base-content/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Featured Districts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-base-content">জনপ্রিয় জেলা</h2>
            <p className="text-base-content/50 mt-1">Start your journey with these popular districts</p>
          </div>
          <Link to="/districts" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
            View all <HiArrowRight className="ml-1" />
          </Link>
        </div>
        {districtsQ.loading ? <Spinner /> : districtsQ.error ? (
          <ErrorState message={districtsQ.error} onRetry={districtsQ.reload} />
        ) : featured.length === 0 ? (
          <EmptyState message="জনপ্রিয় জেলার তথ্য শীঘ্রই আসছে · Featured districts are coming soon." action={<Link to="/districts" className="btn btn-primary btn-sm">Browse all districts</Link>} />
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map(d => (
            <Link key={d.id} to={`/districts/${d.slug}`} className="card bg-base-200 card-hover overflow-hidden group">
              <figure className="h-48 overflow-hidden">
                <CoverImage image={d.image} alt={d.name_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </figure>
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-sm" style={{background: asArray(divisions).find(dv => dv.id === d.division_id)?.color + "22", color: asArray(divisions).find(dv => dv.id === d.division_id)?.color, border: "none"}}>
                    {asArray(divisions).find(dv => dv.id === d.division_id)?.name_en}
                  </span>
                  <span className="badge badge-sm badge-ghost">{d.trip_type}</span>
                </div>
                <h3 className="text-lg font-bold text-base-content">{d.name_bn}</h3>
                <p className="text-sm text-base-content/50">{d.name_en} — {d.tagline}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-base-content/40">
                  <span>{d.budget}</span>
                  <span className="flex items-center gap-0.5">{Array.from({ length: Math.min(d.difficulty, 5) }, (_, i) => <HiStar key={i} className="text-warning" />)} <span className="ml-1">{d.difficulty}/5</span></span>
                  <span className="flex items-center gap-1">{d.family ? <><HiUserGroup /> Family</> : <><FaHiking /> Adventure</>}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        )}
        <div className="sm:hidden mt-4 text-center">
          <Link to="/districts" className="btn btn-primary btn-sm">View all districts</Link>
        </div>
      </section>

      {/* Divisions */}
      <section className="bg-base-200/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-base-content mb-2">৮ বিভাগ</h2>
          <p className="text-base-content/50 mb-8">Explore Bangladesh division by division</p>
          {divisionsQ.loading ? <Spinner /> : divisionsQ.error ? (
            <ErrorState message={divisionsQ.error} onRetry={divisionsQ.reload} />
          ) : asArray(divisions).length === 0 ? (
            <EmptyState message="কোনো বিভাগ পাওয়া যায়নি · No divisions yet." />
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {asArray(divisions).map(dv => (
              <Link key={dv.id} to={`/districts?division=${dv.slug}`} className="card bg-base-200 card-hover p-4 text-center border border-base-300">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold" style={{background: dv.color + "22", color: dv.color}}>
                  {districtsQ.loading || districtsQ.error ? "–" : (countsByDivision[dv.id] || 0)}
                </div>
                <h3 className="font-bold text-base-content text-sm">{dv.name_bn}</h3>
                <p className="text-xs text-base-content/50">{dv.name_en}</p>
              </Link>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Trip Plans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-base-content">ট্রাভেল প্ল্যান</h2>
            <p className="text-base-content/50 mt-1">Ready-made itineraries for every budget</p>
          </div>
          <Link to="/plans" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
            All plans <HiArrowRight className="ml-1" />
          </Link>
        </div>
        {plansQ.loading ? <Spinner /> : plansQ.error ? (
          <ErrorState message={plansQ.error} onRetry={plansQ.reload} />
        ) : asArray(travelPlans).length === 0 ? (
          <EmptyState message="এখনো কোনো ট্রাভেল প্ল্যান নেই · No travel plans yet." />
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {asArray(travelPlans).slice(0, 3).map(p => (
            <Link key={p.id} to={`/plans/${p.slug}`} className="card bg-base-200 card-hover overflow-hidden group">
              <figure className="h-40 overflow-hidden relative">
                <CoverImage image={p.image} alt={p.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 badge badge-primary">{p.duration}</div>
                <span className={`absolute top-3 left-3 badge ${planStatus(p).badge}`}>{planStatus(p).label}</span>
              </figure>
              <div className="card-body p-4">
                <h3 className="font-bold text-base-content">{p.title_bn}</h3>
                <p className="text-sm text-base-content/50">{p.title_en}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-base-content/40">
                  <span className="flex items-center gap-1"><HiLocationMarker /> {asArray(p.districts).join(", ")}</span>
                  <span>{p.cost}</span>
                </div>
                {p.start_date && (
                  <div className="flex items-center gap-1 text-xs text-base-content/60"><HiCalendar className="text-primary" /> {formatDateRange(p.start_date, p.end_date)}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
        )}
      </section>

      {/* Blog */}
      <section className="bg-base-200/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-base-content">ট্রাভেল ব্লগ</h2>
              <p className="text-base-content/50 mt-1">Guides, stories, and local insights</p>
            </div>
            <Link to="/blog" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
              All posts <HiArrowRight className="ml-1" />
            </Link>
          </div>
          {blogQ.loading ? <Spinner /> : blogQ.error ? (
            <ErrorState message={blogQ.error} onRetry={blogQ.reload} />
          ) : asArray(blogPosts).length === 0 ? (
            <EmptyState message="এখনো কোনো ব্লগ পোস্ট নেই · No blog posts yet." />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {asArray(blogPosts).slice(0, 3).map(b => (
              <Link key={b.id} to={`/blog/${b.slug}`} className="card bg-base-200 card-hover overflow-hidden group">
                <figure className="h-40 overflow-hidden">
                  <CoverImage image={b.image} alt={b.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </figure>
                <div className="card-body p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-sm badge-primary badge-outline">{b.category}</span>
                    <span className="text-xs text-base-content/40 flex items-center gap-1"><HiClock /> {b.readTime}</span>
                  </div>
                  <h3 className="font-bold text-base-content">{b.title_bn}</h3>
                  <p className="text-sm text-base-content/50 line-clamp-2">{toPlainText(b.excerpt)}</p>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="card bg-primary text-primary-content p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-3">আপনার ৬৪ জেলা চ্যালেঞ্জ শুরু করুন</h2>
          <p className="text-primary-content/70 mb-6 max-w-xl mx-auto">Track your progress, earn district badges, collect photo frames, and get the ultimate 64-district certificate.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/membership" className="btn bg-base-100 text-primary hover:bg-base-200 border-none">Join Now — Free</Link>
            <Link to="/frames" className="btn btn-ghost text-primary-content hover:bg-primary-content/10 border-none">Browse Frames</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
