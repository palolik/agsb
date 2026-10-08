import { Link } from "react-router-dom";
import { HiArrowRight, HiStar } from "react-icons/hi";
import { taka } from "../lib/booking";
import { canBuy, canRent, stockFor } from "../lib/shop";
import { asArray } from "../lib/safe";
import CoverImage from "./CoverImage";
import { useLang } from "../context/LanguageContext";

// Shop listing card, used on the shop page and the home page product row.
// Same photo-card look as TripCard (see `.photo-card` in index.css). With
// `mode` ("buy" or "rent") it shows only that price and stock, and opens the
// product with that mode chosen; without it, both.
export default function ProductCard({ product: p, mode }) {
  const { t, pick } = useLang();
  const buy = canBuy(p) && mode !== "rent";
  const rent = canRent(p) && mode !== "buy";
  const buyOut = buy && stockFor(p, "buy") === 0;
  const rentOut = rent && stockFor(p, "rent") === 0;
  const soldOut = (!buy || buyOut) && (!rent || rentOut);
  const to = `/shop/${p.slug}${mode ? `?kind=${mode}` : ""}`;

  const prices = [
    buy && { key: "buy", label: t("কিনুন", "Buy"), price: taka(p.salePrice), unit: "", out: buyOut },
    rent && { key: "rent", label: t("ভাড়া", "Rent"), price: taka(p.rentPerDay), unit: t("/দিন", "/day"), out: rentOut },
  ].filter(Boolean);

  return (
    <Link to={to} className="photo-card group relative flex aspect-[4/5] min-h-[22rem] flex-col justify-between overflow-hidden rounded-3xl bg-base-300 text-white">
      <CoverImage
        image={asArray(p.images)[0]}
        alt={pick(p, "name")}
        className={`photo-card-img absolute inset-0 h-full w-full object-cover ${soldOut ? "grayscale opacity-70" : ""}`}
        placeholderClassName="absolute inset-0 bg-gradient-to-br from-primary/70 to-base-300"
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      />
      <div className="photo-card-shade absolute inset-0" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-1.5">
          {soldOut ? (
            <span className="photo-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-error" /> {t("স্টক নেই", "Out of stock")}
            </span>
          ) : p.featured && (
            <span className="photo-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
              <HiStar className="text-warning" /> {t("ফিচার্ড", "Featured")}
            </span>
          )}
        </div>
        {p.rating?.count > 0 && (
          <span className="photo-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
            <HiStar className="text-warning" /> {p.rating.avg}
          </span>
        )}
      </div>

      <div className="relative p-3 pt-0">
        <div className="photo-card-panel p-2">
          <h3 className="text-lg font-bold leading-snug line-clamp-2">{pick(p, "name")}</h3>

          {p.summary && (
            <div className="photo-card-more">
              <div className="overflow-hidden">
                <p className="pt-1.5 text-xs text-white/70 line-clamp-2">{p.summary}</p>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              {prices.map(pr => (
                <div key={pr.key} className={`leading-tight ${pr.out ? "opacity-50 line-through" : ""}`}>
                  {prices.length > 1 && <span className="mr-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white/60">{pr.label}</span>}
                  <span className="text-base font-extrabold">{pr.price}</span>
                  {pr.unit && <span className="text-xs text-white/70">{pr.unit}</span>}
                </div>
              ))}
            </div>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full photo-arrow transition-transform duration-300 group-hover:translate-x-1 group-hover:-rotate-45">
              <HiArrowRight />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
