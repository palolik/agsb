import { Link } from "react-router-dom";
import { HiArrowRight, HiCalendar, HiStar, HiUserGroup } from "react-icons/hi";
import CoverImage from "./CoverImage";
import { planStatus, formatDateRange, seatsLabel } from "../lib/planSchedule";
import { taka } from "../lib/booking";
import { asArray } from "../lib/safe";
import { useLang } from "../context/LanguageContext";

// Trip plan card: the photo fills the card and the details sit on it. The
// highlights and seats fold open on hover (always open on touch screens);
// see `.photo-card` in index.css (shared with ProductCard).

const MAX_HIGHLIGHTS = 3;

export default function TripCard({ plan: p }) {
  const { lang, t, pick } = useLang();
  const status = planStatus(p);
  const route = asArray(p.districts);
  const highlights = asArray(p.highlights);
  const price = p.price > 0 ? taka(p.price) : p.cost;
  const isOpen = status.badge === "badge-success";
  const seats = seatsLabel(p.seats_available, p.seats_total, lang);
  const filled = typeof p.seats_total === "number" && p.seats_total > 0 && typeof p.seats_available === "number"
    ? Math.min(100, Math.round(((p.seats_total - p.seats_available) / p.seats_total) * 100))
    : null;
  const eyebrow = [p.type, p.duration].filter(Boolean).join(" · ");

  return (
    <Link to={`/plans/${p.slug}`} className="photo-card group relative flex aspect-[4/5] min-h-[26rem] flex-col justify-between overflow-hidden rounded-3xl bg-base-300 text-white">
      <CoverImage image={p.image} alt={pick(p, "title")} className="photo-card-img absolute inset-0 h-full w-full object-cover" placeholderClassName="absolute inset-0 bg-gradient-to-br from-primary/70 to-base-300" />
      <div className="photo-card-shade absolute inset-0" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-2 p-4">
        <span className="photo-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-success animate-pulse" : "bg-white/50"}`} />
          {pick(status, "label")}
        </span>
        {price && (
          <span className="photo-chip rounded-2xl px-3 py-1.5 text-right leading-tight">
            <span className="block text-sm font-extrabold">{price}</span>
            {p.price > 0 && <span className="block text-[0.6rem] text-white/70">{t("প্রতি জন", "per person")}</span>}
          </span>
        )}
      </div>

      <div className="relative p-4 pt-0">
        <div className="photo-card-panel p-2">
          {eyebrow && <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/60">{eyebrow}</p>}
          <h3 className="mt-1 text-2xl font-bold leading-tight">{pick(p, "title")}</h3>
          <p className="text-sm text-white/60">{lang === "bn" ? p.title_en : p.title_bn}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/80">
            {route.length > 0 && (
              <span className="inline-flex flex-wrap items-center gap-1">
                {route.map((d, i) => (
                  <span key={d} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="trip-route-dash" aria-hidden="true" />}
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    {d}
                  </span>
                ))}
              </span>
            )}
            {p.start_date && <span className="inline-flex items-center gap-1"><HiCalendar /> {formatDateRange(p.start_date, p.end_date, lang)}</span>}
            {p.rating?.count > 0 && (
              <span className="inline-flex items-center gap-1"><HiStar className="text-warning" /> {p.rating.avg} <span className="text-white/50">({p.rating.count})</span></span>
            )}
          </div>

          {(highlights.length > 0 || seats) && (
            <div className="photo-card-more">
              <div className="overflow-hidden">
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {highlights.slice(0, MAX_HIGHLIGHTS).map((h, i) => (
                      <span key={i} className="rounded-full photo-chip px-2.5 py-0.5 text-[0.7rem]">{h}</span>
                    ))}
                    {highlights.length > MAX_HIGHLIGHTS && (
                      <span className="px-1 py-0.5 text-[0.7rem] text-white/50">+{highlights.length - MAX_HIGHLIGHTS}</span>
                    )}
                  </div>
                )}
                {seats && (
                  <div className="pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-white/80"><HiUserGroup /> {seats}</div>
                    {filled !== null && (
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${filled}%` }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold">{t("প্ল্যান দেখুন", "View plan")}</span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full photo-arrow transition-transform duration-300 group-hover:translate-x-1 group-hover:-rotate-45">
              <HiArrowRight />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
