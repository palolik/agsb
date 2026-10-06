import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { toPlainText } from "../lib/richText";
import { HiClock, HiArrowRight } from "react-icons/hi";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { useLang } from "../context/LanguageContext";

export default function BlogPage() {
  const { lang, t, pick } = useLang();
  const { data: blogPosts, loading, error, reload } = useFetch("/blog");

  const meta = <PageMeta title={t("ট্রাভেল ব্লগ", "Travel Blog")} description={t("সারা বাংলাদেশের গাইড, গল্প আর স্থানীয় অভিজ্ঞতা।", "Guides, stories and local insights from across Bangladesh.")} />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">{t("ট্রাভেল ব্লগ", "Travel Blog")}</h1>
        <p className="text-base-content/50 mt-1">{t("সারা বাংলাদেশ থেকে গাইড, টিপস, খাবারের গল্প আর স্থানীয় অভিজ্ঞতা", "Guides, tips, food stories, and local insights from across Bangladesh")}</p>
      </div>

      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(blogPosts).length === 0 ? (
        <EmptyState message={t("এখনো কোনো ব্লগ পোস্ট নেই।", "No blog posts yet.")} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {asArray(blogPosts).map(b => (
          <Link key={b.id} to={`/blog/${b.slug}`} className="card bg-base-200 card-hover overflow-hidden group border border-base-300">
            <figure className="h-44 overflow-hidden">
              <CoverImage image={b.image} alt={pick(b, "title")} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </figure>
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-sm badge-primary badge-outline">{b.category}</span>
                <span className="text-xs text-base-content/40 flex items-center gap-1"><HiClock /> {b.readTime}</span>
                <span className="text-xs text-base-content/40">{b.date}</span>
              </div>
              <h3 className="text-lg font-bold text-base-content">{pick(b, "title")}</h3>
              <p className="text-sm text-base-content/60">{lang === "bn" ? b.title_en : b.title_bn}</p>
              <p className="text-sm text-base-content/50 mt-2 line-clamp-2">{toPlainText(b.excerpt)}</p>
              <div className="mt-3">
                <span className="text-sm text-primary font-medium flex items-center gap-1">{t("আরও পড়ুন", "Read more")} <HiArrowRight /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
}
