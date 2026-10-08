import { useFetch } from "../hooks/useFetch";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import BlogCard from "../components/BlogCard";
import { useLang } from "../context/LanguageContext";

export default function BlogPage() {
  const { t } = useLang();
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {asArray(blogPosts).map((b, i) => <BlogCard key={b.id} post={b} featured={i === 0} />)}
      </div>
      )}
    </div>
  );
}
