import { useParams, Link } from "react-router-dom";
import Feedback from "../components/Feedback";
import { useFetch } from "../hooks/useFetch";
import { renderRichText } from "../lib/richText";
import { HiArrowLeft, HiClock, HiCalendar, HiTag, HiLocationMarker } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { whatsappUrl } from "../config/site";
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
  const { data: allPosts } = useFetch("/blog");
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
  // More posts: same district first, then same category, then the rest.
  const morePosts = asArray(allPosts)
    .filter(b => b.slug !== post.slug)
    .map(b => ({ b, score: (b.districtSlug && b.districtSlug === post.districtSlug ? 2 : 0) + (b.category === post.category ? 1 : 0) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map(x => x.b);

  return (
    <div>
      {meta}
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <CoverImage image={post.image} alt={pick(post, "title")} sizes="100vw" width={1600} height={640} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <Link to="/blog" className="btn btn-sm btn-ghost text-base-content/70 mb-3">
            <HiArrowLeft className="mr-1" /> {t("ব্লগে ফিরে যান", "Back to Blog")}
          </Link>
          {post.category && (
            <div className="flex items-center gap-2 mb-2">
              <span className="badge">{post.category}</span>
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-base-content">{pick(post, "title")}</h1>
          <p className="text-lg text-base-content/60">{lang === "bn" ? post.title_en : post.title_bn}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <HiClock />, label: t("পড়ার সময়", "Read time"), val: post.readTime },
                { icon: <HiCalendar />, label: t("তারিখ", "Date"), val: post.date },
                { icon: <HiTag />, label: t("বিভাগ", "Category"), val: post.category },
                { icon: <HiLocationMarker />, label: t("জেলা", "District"), val: district ? pick(district, "name") : null },
              ].filter(f => f.val).map(f => (
                <div key={f.label} className="card bg-base-200 p-3 border border-base-300">
                  <div className="text-primary mb-1">{f.icon}</div>
                  <div className="text-xs text-base-content/40">{f.label}</div>
                  <div className="text-sm font-medium text-base-content">{f.val}</div>
                </div>
              ))}
            </div>

            {/* Article */}
            <div className="prose prose-theme max-w-none prose-img:rounded-lg">
              {excerptHtml && (
                <div className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: excerptHtml }} />
              )}
              {contentHtml && (
                <div className="mt-6" dangerouslySetInnerHTML={{ __html: contentHtml }} />
              )}
            </div>

            <Feedback type="blog" target={post.slug} />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Related district */}
            {district && (
              <div className="card bg-primary/10 border border-primary/20 p-5">
                <h3 className="font-bold text-base-content mb-3">{t("সংশ্লিষ্ট জেলা", "Related District")}</h3>
                <Link to={`/districts/${district.slug}`} className="flex items-center gap-3 mb-4 group">
                  <CoverImage image={district.image} alt={pick(district, "name")} className="w-16 h-16 rounded-lg object-cover" placeholderClassName="w-16 h-16 rounded-lg bg-base-300" sizes="64px" width={64} height={64} />
                  <div>
                    <div className="font-medium text-base-content group-hover:text-primary">{pick(district, "name")}</div>
                    <p className="text-xs text-base-content/50">{district.tagline}</p>
                  </div>
                </Link>
                {whatsappUrl() && (
                  <a href={whatsappUrl(t(`হ্যালো! আমি ${pick(district, "name")} ভ্রমণের পরিকল্পনা করতে চাই।`, `Hi! I'd like to plan a trip to ${district.name_en}.`))} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full mb-2">
                    <FaWhatsapp className="mr-1" /> {t("হোয়াটসঅ্যাপে লিখুন", "WhatsApp us")}
                  </a>
                )}
                <Link to={`/districts/${district.slug}`} className={`btn w-full ${whatsappUrl() ? "btn-outline btn-sm" : "btn-primary"}`}>
                  {t("জেলার গাইড দেখুন", "View district guide")}
                </Link>
              </div>
            )}

            {/* More posts */}
            {morePosts.length > 0 && (
              <div>
                <h3 className="font-bold text-base-content mb-3">{t("আরও পড়ুন", "More stories")}</h3>
                <div className="space-y-2">
                  {morePosts.map(b => (
                    <Link key={b.id} to={`/blog/${b.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300/50 transition-colors">
                      <CoverImage image={b.image} alt={pick(b, "title")} className="w-12 h-12 rounded-lg object-cover shrink-0" placeholderClassName="w-12 h-12 rounded-lg bg-base-300 shrink-0" sizes="48px" width={48} height={48} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-base-content line-clamp-2">{pick(b, "title")}</div>
                        {b.readTime && <div className="text-xs text-base-content/50">{b.readTime}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
