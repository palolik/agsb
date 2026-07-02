import { Link } from "react-router-dom";
import { districts, divisions, blogPosts, travelPlans, stats } from "../data";
import { HiArrowRight, HiLocationMarker, HiMap, HiBookOpen, HiStar, HiClock } from "react-icons/hi";

const featured = districts.filter(d => d.status === "complete").slice(0, 6);

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%234CAF50\" fill-opacity=\"0.3\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}} />
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
              <Link to="/map" className="btn btn-outline border-base-content/20 btn-lg">
                <HiMap className="mr-1" /> Open Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-base-200 border-y border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Districts", val: stats.districts, icon: "🗺️" },
              { label: "Attractions", val: stats.attractions + "+", icon: "📍" },
              { label: "Travel Plans", val: stats.travelPlans + "+", icon: "🧳" },
              { label: "Community", val: stats.communityMembers, icon: "👥" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl md:text-3xl font-bold text-primary">{s.val}</div>
                <div className="text-sm text-base-content/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Districts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-base-content">জনপ্রিয় জেলা</h2>
            <p className="text-base-content/50 mt-1">Start your journey with these popular districts</p>
          </div>
          <Link to="/districts" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
            View all 64 <HiArrowRight className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map(d => (
            <Link key={d.id} to={`/districts/${d.slug}`} className="card bg-base-200 card-hover overflow-hidden group">
              <figure className="h-48 overflow-hidden">
                <img src={d.image} alt={d.name_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </figure>
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-sm" style={{background: divisions.find(dv => dv.id === d.division_id)?.color + "22", color: divisions.find(dv => dv.id === d.division_id)?.color, border: "none"}}>
                    {divisions.find(dv => dv.id === d.division_id)?.name_en}
                  </span>
                  <span className="badge badge-sm badge-ghost">{d.trip_type}</span>
                </div>
                <h3 className="text-lg font-bold text-base-content">{d.name_bn}</h3>
                <p className="text-sm text-base-content/50">{d.name_en} — {d.tagline}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-base-content/40">
                  <span>{d.budget}</span>
                  <span>{"⭐".repeat(Math.min(d.difficulty, 5))} {d.difficulty}/5</span>
                  <span>{d.family ? "👨‍👩‍👧‍👦 Family" : "🎒 Adventure"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="sm:hidden mt-4 text-center">
          <Link to="/districts" className="btn btn-primary btn-sm">View all 64 districts</Link>
        </div>
      </section>

      {/* Divisions */}
      <section className="bg-base-200/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-base-content mb-2">৮ বিভাগ</h2>
          <p className="text-base-content/50 mb-8">Explore Bangladesh division by division</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {divisions.map(dv => (
              <Link key={dv.id} to={`/districts?division=${dv.slug}`} className="card bg-base-200 card-hover p-4 text-center border border-base-300">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold" style={{background: dv.color + "22", color: dv.color}}>
                  {dv.districtCount}
                </div>
                <h3 className="font-bold text-base-content text-sm">{dv.name_bn}</h3>
                <p className="text-xs text-base-content/50">{dv.name_en}</p>
              </Link>
            ))}
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {travelPlans.slice(0, 3).map(p => (
            <Link key={p.id} to={`/plans/${p.slug}`} className="card bg-base-200 card-hover overflow-hidden group">
              <figure className="h-40 overflow-hidden relative">
                <img src={p.image} alt={p.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 badge badge-primary">{p.duration}</div>
              </figure>
              <div className="card-body p-4">
                <h3 className="font-bold text-base-content">{p.title_bn}</h3>
                <p className="text-sm text-base-content/50">{p.title_en}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-base-content/40">
                  <span className="flex items-center gap-1"><HiLocationMarker /> {p.districts.join(", ")}</span>
                  <span>{p.cost}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogPosts.slice(0, 3).map(b => (
              <Link key={b.id} to={`/blog/${b.slug}`} className="card bg-base-200 card-hover overflow-hidden group">
                <figure className="h-40 overflow-hidden">
                  <img src={b.image} alt={b.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </figure>
                <div className="card-body p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-sm badge-primary badge-outline">{b.category}</span>
                    <span className="text-xs text-base-content/40 flex items-center gap-1"><HiClock /> {b.readTime}</span>
                  </div>
                  <h3 className="font-bold text-base-content">{b.title_bn}</h3>
                  <p className="text-sm text-base-content/50 line-clamp-2">{b.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="card bg-primary text-primary-content p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-3">আপনার ৬৪ জেলা চ্যালেঞ্জ শুরু করুন</h2>
          <p className="text-primary-content/70 mb-6 max-w-xl mx-auto">Track your progress, earn district badges, collect photo frames, and get the ultimate 64-district certificate.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/membership" className="btn bg-base-100 text-primary hover:bg-base-200 border-none">Join Now — Free</Link>
            <Link to="/frames" className="btn btn-outline border-primary-content/30 text-primary-content hover:bg-primary-content/10">Browse Frames</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
