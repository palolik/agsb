import { useParams, Link } from "react-router-dom";
import { districts, divisions, travelPlans } from "../data";
import { HiArrowLeft, HiLocationMarker, HiClock, HiCurrencyBangladeshi, HiStar, HiUsers, HiDownload } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";

const typeColors = { nature: "badge-success", historical: "badge-warning", religious: "badge-info", cultural: "badge-secondary", food: "badge-error", market: "badge-accent" };

export default function DistrictDetailPage() {
  const { slug } = useParams();
  const district = districts.find(d => d.slug === slug);
  if (!district) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">District not found</h1><Link to="/districts" className="btn btn-primary mt-4">Back to Districts</Link></div>;

  const division = divisions.find(dv => dv.id === district.division_id);
  const relatedPlans = travelPlans.filter(p => p.districts.includes(district.name_en));
  const nearby = districts.filter(d => d.division_id === district.division_id && d.id !== district.id).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={district.image} alt={district.name_en} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <Link to="/districts" className="btn btn-sm btn-ghost text-base-content/70 mb-3">
            <HiArrowLeft className="mr-1" /> All Districts
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge" style={{background: division?.color + "22", color: division?.color, border: "none"}}>{division?.name_en}</span>
            <span className={`badge badge-sm ${district.status === "complete" ? "badge-success" : "badge-info"}`}>{district.status}</span>
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
                {district.attractions.map((a, i) => (
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
                {district.food.map((f, i) => (
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
              <p className="text-sm text-base-content/60 mb-4">Get a custom travel plan with hotel, food, and transport recommendations.</p>
              <a href="#" className="btn btn-primary w-full mb-2">
                <FaWhatsapp className="mr-1" /> WhatsApp us
              </a>
              <Link to="/contact" className="btn btn-outline btn-sm w-full">Send a message</Link>
            </div>

            {/* Frame CTA */}
            <div className="card bg-base-200 border border-base-300 p-5">
              <h3 className="font-bold text-base-content mb-2">📸 আমি ঘুরেছি — {district.name_bn}</h3>
              <p className="text-sm text-base-content/60 mb-3">Download this district's photo frame and share your memory.</p>
              <Link to="/frames" className="btn btn-secondary btn-sm w-full">
                <HiDownload className="mr-1" /> Get Frame
              </Link>
            </div>

            {/* Badge */}
            <div className="card bg-base-200 border border-base-300 p-5 text-center">
              <div className="district-badge w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🏅</span>
              </div>
              <h3 className="font-bold text-base-content">District Badge</h3>
              <p className="text-sm text-base-content/50 mt-1">Login to check in and earn your {district.name_en} badge!</p>
              <Link to="/membership" className="btn btn-ghost btn-sm mt-3">Create Account</Link>
            </div>

            {/* Nearby */}
            {nearby.length > 0 && (
              <div>
                <h3 className="font-bold text-base-content mb-3">কাছাকাছি জেলা</h3>
                <div className="space-y-2">
                  {nearby.map(d => (
                    <Link key={d.id} to={`/districts/${d.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300/50 transition-colors">
                      <img src={d.image} alt={d.name_en} className="w-12 h-12 rounded-lg object-cover" />
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
