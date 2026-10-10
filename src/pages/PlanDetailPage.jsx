import { useMemo, useState } from "react";
import Feedback from "../components/Feedback";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { renderRichText } from "../lib/richText";
import { HiArrowLeft, HiLocationMarker, HiClock, HiCurrencyBangladeshi, HiCalendar } from "react-icons/hi";
import { planStatus, isBookable, formatDateRange } from "../lib/planSchedule";
import { taka, ADVANCE_RATE } from "../lib/booking";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import SeatsMeter from "../components/SeatsMeter";
import { useLang } from "../context/LanguageContext";
import { planSeo } from "../lib/seo";

export default function PlanDetailPage() {
  const { slug } = useParams();
  const { data: plan, loading, error, status, reload } = useFetch(`/plans/${slug}`);
  const { data: districts } = useFetch("/districts");
  const { lang, t, pick } = useLang();
  // Description tab: follows the site language until the reader picks one.
  const [descLang, setDescLang] = useState(null);
  const wantedLang = descLang || lang;

  const descriptions = useMemo(() => ({
    bn: renderRichText(plan?.description_bn),
    en: renderRichText(plan?.description_en),
  }), [plan]);

  // Only a 404 (or 400 for a malformed slug) means "not found"; network
  // failures (status null) and 5xx show ErrorState with a retry instead.
  const notFound = !loading && !plan && (!error || status === 404 || status === 400);
  const seo = plan ? planSeo(plan, lang) : null;
  const meta = <PageMeta title={seo ? seo.title : notFound ? t("প্ল্যান পাওয়া যায়নি", "Plan not found") : t("ট্রাভেল প্ল্যান", "Trip Plans")} description={seo?.description} image={plan?.image} />;
  if (loading) return <>{meta}<Spinner /></>;
  if (error && !notFound) {
    return <>{meta}<div className="max-w-7xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div></>;
  }
  if (!plan) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {meta}
        <EmptyState
          message={t("প্ল্যানটি পাওয়া যায়নি। হয়তো এটি শেষ হয়ে গেছে বা সরিয়ে ফেলা হয়েছে।", "Travel plan not found. It may have ended or been removed.")}
          action={<Link to="/plans" className="btn btn-primary btn-sm"><HiArrowLeft className="mr-1" /> {t("প্ল্যানের তালিকায় ফিরে যান", "Back to Plans")}</Link>}
        />
      </div>
    );
  }

  const hasBn = !!descriptions.bn.trim();
  const hasEn = !!descriptions.en.trim();
  const activeLang = wantedLang === "bn" ? (hasBn ? "bn" : "en") : (hasEn ? "en" : "bn");
  const planDistricts = asArray(plan.districts).map(name => {
    const match = asArray(districts).find(d => d.name_en === name);
    return { name, slug: match?.slug, label: (lang === "bn" && match?.name_bn) || name };
  });

  return (
    <div>
      {meta}
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <CoverImage image={plan.image} alt={pick(plan, "title")} sizes="100vw" width={1600} height={640} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <Link to="/plans" className="btn btn-sm btn-ghost text-base-content/70 mb-3">
            <HiArrowLeft className="mr-1" /> {t("সব প্ল্যান", "All Plans")}
          </Link>
          <div className="flex items-center gap-2 mb-2">
            {plan.duration && <span className="badge badge-primary">{plan.duration}</span>}
            {plan.type && <span className="badge badge-ghost bg-base-200/80">{plan.type}</span>}
            <span className={`badge ${planStatus(plan).badge}`}>{pick(planStatus(plan), "label")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-base-content">{pick(plan, "title")}</h1>
          {lang === "bn" && <p className="text-lg text-base-content/60">{plan.title_en}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {(hasBn || hasEn) ? (
              <div>
                <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-base-content">{t("বিস্তারিত", "Details")}</h2>
                  {hasBn && hasEn && (
                    <div role="tablist" className="tabs tabs-box tabs-sm">
                      <button role="tab" className={`tab ${activeLang === "bn" ? "tab-active" : ""}`} onClick={() => setDescLang("bn")}>বাংলা</button>
                      <button role="tab" className={`tab ${activeLang === "en" ? "tab-active" : ""}`} onClick={() => setDescLang("en")}>English</button>
                    </div>
                  )}
                </div>
                <div
                  className="prose prose-theme max-w-none prose-a:text-primary prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: descriptions[activeLang] }}
                />
              </div>
            ) : (
              <p className="text-base-content/50">{t("এই প্ল্যানের বিস্তারিত শিগগিরই আসছে।", "Details for this plan are coming soon.")}</p>
            )}

            {asArray(plan.highlights).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-base-content mb-4">{t("হাইলাইটস", "Highlights")}</h2>
                <div className="flex flex-wrap gap-2">
                  {asArray(plan.highlights).map((h, i) => (
                    <span key={i} className="badge badge-ghost border-base-300">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card bg-base-200 p-5 border border-base-300">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-base-content">{t("এক নজরে", "Quick info")}</h3>
                <span className={`badge badge-sm ${planStatus(plan).badge}`}>{pick(planStatus(plan), "label")}</span>
              </div>
              <div className="space-y-3 text-sm">
                {plan.start_date && (
                  <div className="flex items-center gap-2 text-base-content/70"><HiCalendar className="text-primary" /> {formatDateRange(plan.start_date, plan.end_date, lang)}</div>
                )}
                <SeatsMeter plan={plan} />
                {plan.duration && (
                  <div className="flex items-center gap-2 text-base-content/70"><HiClock className="text-primary" /> {plan.duration}</div>
                )}
                {plan.price > 0 && (
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-base-300">
                    <span className="text-base-content/60">{t("জনপ্রতি মূল্য", "Price per person")}</span>
                    <span className="text-lg font-bold text-primary">{taka(plan.price)}</span>
                  </div>
                )}
                {plan.cost && !(plan.price > 0) && (
                  <div className="flex items-center gap-2 text-base-content/70"><HiCurrencyBangladeshi className="text-primary" /> {plan.cost}</div>
                )}
                {planDistricts.length > 0 && (
                  <div className="flex items-start gap-2 text-base-content/70">
                    <HiLocationMarker className="text-primary mt-0.5 shrink-0" />
                    <span className="flex flex-wrap gap-x-1">
                      {planDistricts.map((d, i) => (
                        <span key={d.name}>
                          {d.slug ? <Link to={`/districts/${d.slug}`} className="hover:text-primary">{d.label}</Link> : d.label}
                          {i < planDistricts.length - 1 && ","}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
              {isBookable(plan) && plan.price > 0 ? (
                <>
                  <Link to={`/plans/${plan.slug}/book`} className="btn btn-primary w-full mt-5">{t("টিকিট বুক করুন", "Book tickets")}</Link>
                  <p className="text-xs text-base-content/40 text-center mt-2">{t(`এখন ${Math.round(ADVANCE_RATE * 100)}% অগ্রিম দিন, বাকিটা পৌঁছে দেবেন`, `Pay ${Math.round(ADVANCE_RATE * 100)}% advance now, the rest on arrival`)}</p>
                </>
              ) : isBookable(plan) ? (
                <Link to="/contact" className="btn btn-primary btn-sm w-full mt-5">{t("এই প্ল্যান সম্পর্কে জানতে চান", "Ask about this plan")}</Link>
              ) : (
                <button type="button" disabled className="btn btn-sm w-full mt-5">{pick(planStatus(plan), "label")}</button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Feedback type="plan" target={plan.slug} />
      </div>
    </div>
  );
}
