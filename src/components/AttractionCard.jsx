import { Link } from "react-router-dom";
import CoverImage from "./CoverImage";
import { useLang } from "../context/LanguageContext";

export const typeColors = { nature: "badge-success", historical: "badge-warning", religious: "badge-info", cultural: "badge-secondary", food: "badge-error", market: "badge-accent" };

// Bangla names for the attraction types (English shows the type as stored).
const TYPE_BN = { nature: "প্রকৃতি", historical: "ঐতিহাসিক", religious: "ধর্মীয়", cultural: "সাংস্কৃতিক", food: "খাবার", market: "বাজার" };

export function TypeBadge({ type, className = "badge-xs" }) {
  const { t } = useLang();
  if (!type) return null;
  return <span className={`badge ${className} ${typeColors[type] || "badge-ghost"}`}>{t(TYPE_BN[type], type)}</span>;
}

// Compact attraction card linking to its own page: thumbnail, name (+ Bengali
// name), type badge and the one-line summary.
export default function AttractionCard({ attraction: a }) {
  const { lang, pick } = useLang();
  return (
    <Link
      to={`/attractions/${a.slug}`}
      className="card bg-base-200 p-3 border border-base-300 card-hover flex flex-row items-start gap-3"
      data-testid="attraction"
    >
      <CoverImage
        image={a.image}
        alt={pick(a, "name")}
        className="w-16 h-16 rounded-lg object-cover shrink-0"
        placeholderClassName="w-16 h-16 rounded-lg bg-base-300 shrink-0"
        sizes="64px"
        width={64}
        height={64}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-base-content">{pick(a, "name")}</h3>
          <TypeBadge type={a.type} />
        </div>
        {lang === "bn" && a.name_bn && <p className="text-sm text-base-content/60">{a.name}</p>}
        {a.desc && <p className="text-sm text-base-content/50 mt-0.5 line-clamp-1">{a.desc}</p>}
      </div>
    </Link>
  );
}
