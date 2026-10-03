import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { resolveImage } from "../lib/api";
import { renderRichText } from "../lib/richText";
import { HiArrowLeft, HiLocationMarker, HiClock, HiCurrencyBangladeshi, HiCalendar, HiUserGroup } from "react-icons/hi";
import { planStatus, isBookable, formatDateRange, seatsLabel } from "../lib/planSchedule";
import { taka, ADVANCE_RATE } from "../lib/booking";
import { asArray } from "../lib/safe";

export default function PlanDetailPage() {
  const { slug } = useParams();
  const { data: plan, loading, error } = useFetch(`/plans/${slug}`);
  const { data: districts } = useFetch("/districts");
  const [lang, setLang] = useState("bn");

  const descriptions = useMemo(() => ({
    bn: renderRichText(plan?.description_bn),
    en: renderRichText(plan?.description_en),
  }), [plan]);

  if (loading) return null;
  if (error || !plan) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Plan not found</h1><Link to="/plans" className="btn btn-primary mt-4">Back to Plans</Link></div>;

  const hasBn = !!descriptions.bn.trim();
  const hasEn = !!descriptions.en.trim();
  const activeLang = lang === "bn" ? (hasBn ? "bn" : "en") : (hasEn ? "en" : "bn");
  const planDistricts = asArray(plan.districts).map(name => ({
    name,
    slug: asArray(districts).find(d => d.name_en === name)?.slug,
  }));

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={resolveImage(plan.image)} alt={plan.title_en} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <Link to="/plans" className="btn btn-sm btn-ghost text-base-content/70 mb-3">
            <HiArrowLeft className="mr-1" /> All Plans
          </Link>
          <div className="flex items-center gap-2 mb-2">
            {plan.duration && <span className="badge badge-primary">{plan.duration}</span>}
            {plan.type && <span className="badge badge-ghost bg-base-200/80">{plan.type}</span>}
            <span className={`badge ${planStatus(plan).badge}`}>{planStatus(plan).label}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-base-content">{plan.title_bn}</h1>
          <p className="text-lg text-base-content/60">{plan.title_en}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {(hasBn || hasEn) ? (
              <div>
                <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-base-content">বিস্তারিত</h2>
                  {hasBn && hasEn && (
                    <div role="tablist" className="tabs tabs-box tabs-sm">
                      <button role="tab" className={`tab ${activeLang === "bn" ? "tab-active" : ""}`} onClick={() => setLang("bn")}>বাংলা</button>
                      <button role="tab" className={`tab ${activeLang === "en" ? "tab-active" : ""}`} onClick={() => setLang("en")}>English</button>
                    </div>
                  )}
                </div>
                <div
                  className="prose prose-theme max-w-none prose-a:text-primary prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: descriptions[activeLang] }}
                />
              </div>
            ) : (
              <p className="text-base-content/50">Details for this plan are coming soon.</p>
            )}

            {asArray(plan.highlights).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-base-content mb-4">হাইলাইটস</h2>
                <div className="flex flex-wrap gap-2">
                  {asArray(plan.highlights).map((h, i) => (
                    <span key={i} className="badge badge-ghost border-base-300">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card bg-base-200 p-5 border border-base-300">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-base-content">Quick info</h3>
                <span className={`badge badge-sm ${planStatus(plan).badge}`}>{planStatus(plan).label}</span>
              </div>
              <div className="space-y-3 text-sm">
                {plan.start_date && (
                  <div className="flex items-center gap-2 text-base-content/70"><HiCalendar className="text-primary" /> {formatDateRange(plan.start_date, plan.end_date)}</div>
                )}
                {seatsLabel(plan.seats_available) && (
                  <div className="flex items-center gap-2 text-base-content/70"><HiUserGroup className="text-primary" /> {seatsLabel(plan.seats_available)}</div>
                )}
                {plan.duration && (
                  <div className="flex items-center gap-2 text-base-content/70"><HiClock className="text-primary" /> {plan.duration}</div>
                )}
                {plan.price > 0 && (
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-base-300">
                    <span className="text-base-content/60">Price per person</span>
                    <span className="text-lg font-bold text-primary">{taka(plan.price)}</span>
                  </div>
                )}
                {plan.cost && !(plan.price > 0) && (
                  <div className="flex items-center gap-2 text-base-content/70"><HiCurrencyBangladeshi className="text-primary" /> {plan.cost}</div>
                )}
                {planDistricts.length > 0 && (
                  <div className="flex items-start gap-2 text-base-content/70">
                    <HiLocationMarker className="text-primary mt-0.5 shrink-0" />
                    <span className="flex flex-wrap gap-x-1">
                      {planDistricts.map((d, i) => (
                        <span key={d.name}>
                          {d.slug ? <Link to={`/districts/${d.slug}`} className="hover:text-primary">{d.name}</Link> : d.name}
                          {i < planDistricts.length - 1 && ","}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
              {isBookable(plan) && plan.price > 0 ? (
                <>
                  <Link to={`/plans/${plan.slug}/book`} className="btn btn-primary w-full mt-5">Book tickets</Link>
                  <p className="text-xs text-base-content/40 text-center mt-2">Pay {Math.round(ADVANCE_RATE * 100)}% advance now, the rest on arrival</p>
                </>
              ) : isBookable(plan) ? (
                <Link to="/contact" className="btn btn-primary btn-sm w-full mt-5">Ask about this plan</Link>
              ) : (
                <button type="button" disabled className="btn btn-sm w-full mt-5">{planStatus(plan).label}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
