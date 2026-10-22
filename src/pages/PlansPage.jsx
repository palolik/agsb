import { useFetch } from "../hooks/useFetch";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import TripCard from "../components/TripCard";
import { useLang } from "../context/LanguageContext";

export default function PlansPage() {
  const { t } = useLang();
  const { data: travelPlans, loading, error, reload } = useFetch("/plans");

  const meta = <PageMeta title={t("ট্যুর প্ল্যান ও ট্যুর প্যাকেজ", "Tour Plans & Packages")} description={t("বাংলাদেশ ট্যুর প্ল্যান ও গ্রুপ ট্যুর প্যাকেজ: খরচ, সময়সূচি আর জেলাসহ তৈরি ভ্রমণ পরিকল্পনা — উইকেন্ড ট্রিপ থেকে একাধিক জেলার ট্যুর পর্যন্ত। অনলাইনে বুক করুন।", "Bangladesh tour plans and group tour packages: ready-made travel plans with costs, dates and districts, from weekend trips to multi-district tours. Book online.")} />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">{t("ট্যুর প্ল্যান ও ট্যুর প্যাকেজ", "Tour Plans & Packages")}</h1>
        <p className="text-base-content/50 mt-1">{t("তৈরি ভ্রমণ পরিকল্পনা — একটা বেছে নিন আর বেরিয়ে পড়ুন", "Ready-made itineraries — pick one and go")}</p>
      </div>
      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(travelPlans).length === 0 ? (
        <EmptyState message={t("এখনো কোনো ট্রাভেল প্ল্যান নেই।", "No travel plans yet.")} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {asArray(travelPlans).map(p => <TripCard key={p.id} plan={p} />)}
      </div>
      )}
    </div>
  );
}
