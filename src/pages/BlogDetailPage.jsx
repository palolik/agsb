import { useParams, Link } from "react-router-dom";
import Feedback from "../components/Feedback";
import { useFetch } from "../hooks/useFetch";
import { renderRichText } from "../lib/richText";
import { HiArrowLeft, HiClock, HiCalendar } from "react-icons/hi";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { toPlainText } from "../lib/richText";
import { useLang } from "../context/LanguageContext";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { data: post, loading, error, status, reload } = useFetch(`/blog/${slug}`);
  const { data: districts } = useFetch("/districts");
  const { lang, t, pick } = useLang();

  // Only a 404 (or 400 for a malformed slug) means "not found"; network
  // failures (status null) and 5xx show ErrorState with a retry instead.
  const notFound = !loading && !post && (!error || status === 404 || status === 400);
  const meta = <PageMeta title={post ? pick(post, "title") : notFound ? t("পোস্ট পাওয়া যায়নি", "Post not found") : t("ট্রাভেল ব্লগ", "Travel Blog")} description={post ? toPlainText(post.excerpt) : undefined} image={post?.image} type={post ? "article" : "website"} />;
  if (loading) return <>{meta}<Spinner /></>;
  if (error && !notFound) {
    return <>{meta}<div className="max-w-7xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div></>;
  }
  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {meta}
        <EmptyState
          message={t("পোস্টটি পাওয়া যায়নি। হয়তো এটি সরিয়ে ফেলা বা মুছে ফেলা হয়েছে।", "Post not found. It may have been moved or removed.")}
          action={<Link to="/blog" className="btn btn-primary btn-sm"><HiArrowLeft className="mr-1" /> {t("ব্লগে ফিরে যান", "Back to Blog")}</Link>}
        />
      </div>
    );
  }

  const district = asArray(districts).find(d => d.slug === post.districtSlug);
  const excerptHtml = renderRichText(post.excerpt);
  const contentHtml = renderRichText(post.content);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <Link to="/blog" className="btn btn-ghost btn-sm mb-6"><HiArrowLeft className="mr-1" /> {t("ব্লগে ফিরে যান", "Back to Blog")}</Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="badge badge-primary badge-outline">{post.category}</span>
          <span className="text-sm text-base-content/40 flex items-center gap-1"><HiClock /> {post.readTime}</span>
          <span className="text-sm text-base-content/40 flex items-center gap-1"><HiCalendar /> {post.date}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">{pick(post, "title")}</h1>
        <p className="text-lg text-base-content/60">{lang === "bn" ? post.title_en : post.title_bn}</p>
      </div>

      {post.image && <CoverImage image={post.image} alt={pick(post, "title")} className="w-full h-64 md:h-96 object-cover rounded-xl mb-8" sizes="(min-width: 896px) 896px, 100vw" width={1200} height={600} priority />}

      <div className="prose prose-theme max-w-none prose-img:rounded-lg">
        {excerptHtml && (
          <div className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: excerptHtml }} />
        )}
        {contentHtml && (
          <div className="mt-6" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        )}
        {district && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-base-content mb-3">{t("সংশ্লিষ্ট জেলা", "Related District")}</h3>
            <Link to={`/districts/${district.slug}`} className="card bg-base-200 p-4 border border-base-300 card-hover flex flex-row items-center gap-4">
              <CoverImage image={district.image} alt={pick(district, "name")} className="w-20 h-20 rounded-lg object-cover" placeholderClassName="w-20 h-20 rounded-lg bg-base-300" sizes="80px" width={80} height={80} />
              <div>
                <h4 className="font-bold text-base-content">{pick(district, "name")}</h4>
                <p className="text-sm text-base-content/50">{lang === "bn" ? district.name_en : district.name_bn} — {district.tagline}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
      <Feedback type="blog" target={post.slug} />
    </div>
  );
}
