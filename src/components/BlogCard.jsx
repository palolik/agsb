import { Link } from "react-router-dom";
import { HiArrowRight, HiClock } from "react-icons/hi";
import CoverImage from "./CoverImage";
import { toPlainText } from "../lib/richText";
import { formatDay } from "../lib/shop";
import { useLang } from "../context/LanguageContext";

// Blog post card in the shared photo-card look (see `.photo-card` in
// index.css). `featured` makes it a wide lead card for the top of a list.
export default function BlogCard({ post: b, featured = false }) {
  const { lang, t, pick } = useLang();
  const excerpt = toPlainText(b.excerpt);

  return (
    <Link
      to={`/blog/${b.slug}`}
      className={`photo-card group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-base-300 text-white ${featured ? "min-h-[26rem] md:col-span-2" : "aspect-[4/5] min-h-[24rem]"}`}
    >
      <CoverImage
        image={b.image}
        alt={pick(b, "title")}
        sizes={featured ? "(min-width: 1024px) 66vw, 100vw" : undefined}
        className="photo-card-img absolute inset-0 h-full w-full object-cover"
        placeholderClassName="absolute inset-0 bg-gradient-to-br from-primary/70 to-base-300"
      />
      <div className="photo-card-shade absolute inset-0" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-2 p-4">
        {b.category && <span className="photo-chip rounded-full px-3 py-1 text-xs font-semibold">{b.category}</span>}
        {b.readTime && (
          <span className="photo-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
            <HiClock /> {b.readTime}
          </span>
        )}
      </div>

      <div className="photo-card-panel relative p-5">
        {b.date && <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/60">{formatDay(b.date, lang)}</p>}
        <h3 className={`mt-1 font-bold leading-tight ${featured ? "text-2xl md:text-3xl" : "text-xl"}`}>{pick(b, "title")}</h3>
        <p className="text-sm text-white/60">{lang === "bn" ? b.title_en : b.title_bn}</p>

        {excerpt && (
          featured ? (
            <p className="mt-2 max-w-2xl text-sm text-white/75 line-clamp-2">{excerpt}</p>
          ) : (
            <div className="photo-card-more">
              <div className="overflow-hidden">
                <p className="pt-2 text-sm text-white/75 line-clamp-3">{excerpt}</p>
              </div>
            </div>
          )
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold">{t("আরও পড়ুন", "Read more")}</span>
          <span className="photo-arrow inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1 group-hover:-rotate-45">
            <HiArrowRight />
          </span>
        </div>
      </div>
    </Link>
  );
}
