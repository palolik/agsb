import { Link } from "react-router-dom";
import { HiArrowRight, HiLocationMarker, HiClock } from "react-icons/hi";
import CoverImage from "./CoverImage";
import SeatsMeter from "./SeatsMeter";
import { RatingBadge } from "./Feedback";
import { asArray } from "../lib/safe";
import { isBookable, planStatus, formatDateRange } from "../lib/planSchedule";
import { useLang } from "../context/LanguageContext";

// Home-page "next departures": bookable plans soonest first, one featured
// large on the left and the next few as dated rows on the right. Plans with a
// start date come before ones without.

const startOf = (p) => (typeof p?.start_date === "string" ? p.start_date.slice(0, 10) : "");

export function upcomingPlans(plans, limit = 4) {
  return asArray(plans)
    .filter(isBookable)
    .sort((a, b) => (startOf(a) || "9999").localeCompare(startOf(b) || "9999"))
    .slice(0, limit);
}

function DateChip({ start, lang, className = "" }) {
  const date = start ? new Date(`${start}T00:00:00`) : null;
  const locale = lang === "bn" ? "bn-BD" : "en-GB";
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl photo-chip leading-none shrink-0 ${className}`}>
      {date ? (
        <>
          <span className="text-xl font-bold">{date.toLocaleDateString(locale, { day: "numeric" })}</span>
          <span className="text-[0.65rem] uppercase tracking-wide mt-1">{date.toLocaleDateString(locale, { month: "short" })}</span>
        </>
      ) : (
        <HiClock className="w-5 h-5" />
      )}
    </div>
  );
}

export default function UpcomingTrips({ plans }) {
  const { lang, t, pick } = useLang();
  const [lead, ...rest] = upcomingPlans(plans);
  if (!lead) return null;
  const leadStart = startOf(lead);

  return (
    <div className="grid lg:grid-cols-5 gap-4 md:gap-5">
      <Link to={`/plans/${lead.slug}`} className="trip-lead group relative overflow-hidden rounded-2xl lg:col-span-3 min-h-80 md:min-h-96 flex items-end">
        <CoverImage image={lead.image} alt={pick(lead, "title")} sizes="(min-width: 1024px) 60vw, 100vw" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" placeholderClassName="absolute inset-0 bg-base-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className={`badge ${planStatus(lead).badge}`}>{pick(planStatus(lead), "label")}</span>
          {lead.duration && <span className="badge badge-primary">{lead.duration}</span>}
        </div>
        <div className="relative w-full p-5 md:p-7 text-white">
          <div className="flex items-end gap-4">
            <DateChip start={leadStart} lang={lang} className="w-14 h-14" />
            <div className="min-w-0">
              <h3 className="text-2xl md:text-3xl font-bold leading-tight">{pick(lead, "title")}</h3>
              <p className="text-white/70 text-sm">{lang === "bn" ? lead.title_en : lead.title_bn}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
            {asArray(lead.districts).length > 0 && <span className="flex items-center gap-1"><HiLocationMarker /> {asArray(lead.districts).join(", ")}</span>}
            {leadStart && <span>{formatDateRange(leadStart, lead.end_date, lang)}</span>}
            {lead.cost && <span className="font-semibold text-white">{lead.cost}</span>}
            <span className="ml-auto inline-flex items-center gap-1 font-semibold group-hover:gap-2 transition-all">
              {t("বিস্তারিত", "View trip")} <HiArrowRight />
            </span>
          </div>
        </div>
      </Link>

      {rest.length > 0 && (
        <div className="lg:col-span-2 flex flex-col gap-3">
          {rest.map(p => (
            <Link key={p.id} to={`/plans/${p.slug}`} className="group flex gap-4 items-center rounded-2xl border border-base-300 bg-base-100 p-3 transition hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg flex-1">
              <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-xl">
                <CoverImage image={p.image} alt={pick(p, "title")} sizes="96px" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <DateChip start={startOf(p)} lang={lang} className="absolute bottom-1 left-1 w-10 h-10 scale-90 origin-bottom-left shadow" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base-content leading-snug group-hover:text-primary transition-colors line-clamp-1">{pick(p, "title")}</h3>
                <div className="flex items-center gap-2 text-xs text-base-content/50 mt-0.5">
                  {p.duration && <span>{p.duration}</span>}
                  {p.cost && <span className="font-medium text-base-content/70">{p.cost}</span>}
                </div>
                {asArray(p.districts).length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-base-content/40 mt-0.5 line-clamp-1"><HiLocationMarker className="shrink-0" /> {asArray(p.districts).join(", ")}</div>
                )}
                <RatingBadge rating={p.rating} />
                <SeatsMeter plan={p} className="mt-1.5" />
              </div>
              <HiArrowRight className="shrink-0 text-base-content/30 group-hover:text-primary group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
