import { Link } from "react-router-dom";
import { taka } from "../lib/booking";
import { canBuy, canRent, stockFor } from "../lib/shop";
import { asArray } from "../lib/safe";
import CoverImage from "./CoverImage";
import { useLang } from "../context/LanguageContext";
import { RatingBadge } from "./Feedback";

// Shop listing card, used on the shop page and the home page product row.
export default function ProductCard({ product: p }) {
  const { t, pick } = useLang();
  const buy = canBuy(p);
  const rent = canRent(p);
  const buyOut = buy && stockFor(p, "buy") === 0;
  const rentOut = rent && stockFor(p, "rent") === 0;
  const soldOut = (!buy || buyOut) && (!rent || rentOut);
  return (
    <Link to={`/shop/${p.slug}`} className="card bg-base-200 card-hover overflow-hidden border border-base-300 group">
      <figure className="h-48 overflow-hidden relative bg-base-300">
        <CoverImage
          image={asArray(p.images)[0]}
          alt={pick(p, "name")}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${soldOut ? "opacity-60" : ""}`}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute top-3 left-3 flex gap-1">
          {p.featured && <span className="badge badge-secondary">{t("ফিচার্ড", "Featured")}</span>}
          {soldOut && <span className="badge badge-error">{t("স্টক নেই", "Out of stock")}</span>}
        </div>
      </figure>
      <div className="card-body p-4 gap-1">
        <h2 className="text-lg font-bold text-base-content group-hover:text-primary transition-colors leading-snug">{pick(p, "name")}</h2>
        <RatingBadge rating={p.rating} />
        {p.summary && <p className="text-xs text-base-content/50 line-clamp-2 mt-1">{p.summary}</p>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {buy && (
            <span className={`badge ${buyOut ? "badge-ghost line-through" : "badge-primary"}`}>{t("কিনুন", "Buy")} {taka(p.salePrice)}</span>
          )}
          {rent && (
            <span className={`badge ${rentOut ? "badge-ghost line-through" : "badge-accent"}`}>{t("ভাড়া", "Rent")} {taka(p.rentPerDay)}{t("/দিন", "/day")}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
