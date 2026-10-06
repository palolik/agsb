import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { HiLocationMarker, HiCalendar } from "react-icons/hi";
import { planStatus, formatDateRange } from "../lib/planSchedule";
import { taka } from "../lib/booking";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import SeatsMeter from "../components/SeatsMeter";
import { useLang } from "../context/LanguageContext";
import { RatingBadge } from "../components/Feedback";

export default function PlansPage() {
  const { lang, t, pick } = useLang();
  const { data: travelPlans, loading, error, reload } = useFetch("/plans");

  const meta = <PageMeta title={t("ট্রাভেল প্ল্যান", "Trip Plans")} description={t("সব বাজেটের জন্য তৈরি ভ্রমণ পরিকল্পনা — উইকেন্ড ট্রিপ থেকে একাধিক জেলার ট্যুর পর্যন্ত।", "Ready-made itineraries for every budget, from weekend getaways to multi-district tours.")} />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">{t("ট্রাভেল প্ল্যান", "Trip Plans")}</h1>
        <p className="text-base-content/50 mt-1">{t("তৈরি ভ্রমণ পরিকল্পনা — একটা বেছে নিন আর বেরিয়ে পড়ুন", "Ready-made itineraries — pick one and go")}</p>
      </div>
      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(travelPlans).length === 0 ? (
        <EmptyState message={t("এখনো কোনো ট্রাভেল প্ল্যান নেই।", "No travel plans yet.")} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {asArray(travelPlans).map(p => (
          <div key={p.id} className="card bg-base-200 card-hover overflow-hidden border border-base-300 group">
            <figure className="h-44 overflow-hidden relative">
              <CoverImage image={p.image} alt={pick(p, "title")} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <span className={`absolute top-3 left-3 badge ${planStatus(p).badge}`}>{pick(planStatus(p), "label")}</span>
              <div className="absolute top-3 right-3 flex gap-1">
                <span className="badge badge-primary">{p.duration}</span>
                <span className="badge badge-ghost bg-base-200/80">{p.type}</span>
              </div>
            </figure>
            <div className="card-body p-4">
              <Link to={`/plans/${p.slug}`} className="text-lg font-bold text-base-content hover:text-primary transition-colors">{pick(p, "title")}</Link>
              <RatingBadge rating={p.rating} />
              {lang === "bn" && <p className="text-sm text-base-content/60">{p.title_en}</p>}
              <div className="flex items-center gap-3 mt-1 text-xs text-base-content/40">
                <span className="flex items-center gap-1"><HiLocationMarker /> {asArray(p.districts).join(", ")}</span>
                <span>{p.price > 0 ? <span className="font-bold text-primary">{taka(p.price)}{t("/জন", "/person")}</span> : p.cost}</span>
              </div>
              {p.start_date && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-base-content/60">
                  <span className="flex items-center gap-1"><HiCalendar className="text-primary" /> {formatDateRange(p.start_date, p.end_date, lang)}</span>
                </div>
              )}
              <SeatsMeter plan={p} className="mt-2" />
              <div className="mt-3">
                <p className="text-xs text-base-content/40 mb-2">{t("যা যা থাকছে:", "Highlights:")}</p>
                <div className="flex flex-wrap gap-1">
                  {asArray(p.highlights).map((h, i) => (
                    <span key={i} className="badge badge-sm badge-ghost border-base-300">{h}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <Link to={`/plans/${p.slug}`} className="btn btn-primary btn-sm w-full">{t("প্ল্যান দেখুন", "View plan")}</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
