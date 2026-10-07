import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { HiSearch } from "react-icons/hi";
import { asArray, asText } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import { districtCountsByDivision, DIVISION_CAPITAL_SLUGS } from "../data";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { useLang } from "../context/LanguageContext";
import { districtName } from "../lib/districtNames";

export default function DistrictsPage() {
  const { lang, t, pick } = useLang();
  // The division filter lives in the URL (?division=sylhet) so it survives
  // reloads, back/forward and shared links.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeDivision = searchParams.get("division") || "all";
  const [search, setSearch] = useState("");
  const setActiveDivision = (slug) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug === "all") next.delete("division");
      else next.set("division", slug);
      return next;
    }, { replace: true });
  };
  const { data: districts, loading: districtsLoading, error: districtsError, reload: reloadDistricts } = useFetch("/districts");
  const { data: divisions, loading: divisionsLoading, error: divisionsError, reload: reloadDivisions } = useFetch("/divisions");
  // A division filter can only be applied once the divisions list is in, so
  // wait on (and surface errors from) that request too while one is active.
  const needsDivisions = activeDivision !== "all";
  const loading = districtsLoading || (needsDivisions && divisionsLoading);
  const error = districtsError || (needsDivisions ? divisionsError : null);
  const reload = () => {
    if (districtsError) reloadDistricts();
    if (needsDivisions && divisionsError) reloadDivisions();
  };

  // Counts reflect the districts the API actually returned, not a fixed 64.
  const countsReady = !loading && !error;
  const countsByDivision = districtCountsByDivision(districts);
  const withCount = (label, n) => (countsReady ? `${label} (${n})` : label);

  const filtered = asArray(districts).filter(d => {
    const matchDiv = activeDivision === "all" || asArray(divisions).find(dv => dv.id === d.division_id)?.slug === activeDivision;
    const matchSearch = !search || asText(d.name_en).toLowerCase().includes(search.toLowerCase()) || asText(d.name_bn).includes(search);
    return matchDiv && matchSearch;
  });

  const meta = <PageMeta title={t("৬৪ জেলা", "Districts")} description={t("বাংলাদেশের প্রতিটি জেলা ঘুরে দেখুন: দর্শনীয় স্থান, খাবার, যাতায়াত, বাজেট আর ভ্রমণের সেরা সময়।", "Explore every district of Bangladesh: attractions, food, transport, budgets and the best time to visit.")} />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">{t("৬৪ জেলা", "64 Districts")}</h1>
        <p className="text-base-content/50 mt-1">{t("জেলা ধরে ধরে ঘুরে দেখুন বাংলাদেশের প্রতিটি প্রান্ত", "Explore every corner of Bangladesh, district by district")}</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30" />
          <input
            type="text"
            placeholder={t("জেলা খুঁজুন...", "Search districts...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input input-bordered bg-base-200 w-full pl-10"
          />
        </div>
      </div>

      {/* Division tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveDivision("all")}
          className={`btn btn-sm shrink-0 ${activeDivision === "all" ? "btn-primary" : "btn-ghost border-base-300"}`}
        >
          {withCount(t("সব", "All"), asArray(districts).length)}
        </button>
        {asArray(divisions).map(dv => (
          <button
            key={dv.slug}
            onClick={() => setActiveDivision(dv.slug)}
            className={`btn btn-sm shrink-0 ${activeDivision === dv.slug ? "btn-primary" : "btn-ghost border-base-300"}`}
          >
            {withCount(pick(dv, "name"), countsByDivision[dv.id] || 0)}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-base-content/40 mb-4">{loading || error ? "" : t(`${filtered.length}টি জেলা পাওয়া গেছে`, `${filtered.length} districts found`)}</p>

      {/* Grid */}
      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(districts).length === 0 ? (
        <EmptyState message={t("এখনো কোনো জেলা যোগ করা হয়নি।", "No districts yet.")} />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={t("আপনার খোঁজের সাথে কোনো জেলা মেলেনি।", "No districts match your search.")}
          action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setActiveDivision("all"); }}>{t("ফিল্টার মুছুন", "Clear filters")}</button>}
        />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[14rem] grid-flow-dense gap-4">
        {/* Division capitals take a 2x2 block; grid-flow-dense backfills the gaps they leave. */}
        {filtered.map(d => {
          const isCapital = DIVISION_CAPITAL_SLUGS.has(d.slug);
          return (
          <Link key={d.id} to={`/districts/${d.slug}`} className={`card relative h-full overflow-hidden group border border-base-300 bg-base-200 ${isCapital ? "sm:col-span-2 sm:row-span-2" : ""}`}>
            <CoverImage image={d.image} alt={lang === "bn" ? d.name_bn || districtName(d.name_en) : districtName(d.name_en)} sizes={isCapital ? "(min-width: 1280px) 50vw, (min-width: 1024px) 66vw, 100vw" : "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {/* Name always visible; the rest slides up from the bottom on hover/focus. */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 pt-10 text-white">
              <h3 className={`font-bold drop-shadow ${isCapital ? "text-lg sm:text-3xl" : "text-lg"}`}>{lang === "bn" ? d.name_bn || districtName(d.name_en) : districtName(d.name_en)}</h3>
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                <div className="overflow-hidden">
                  <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 transition-all duration-300 ease-out pt-1">
                    {lang === "bn" && <p className="text-sm text-white/70">{d.name_en}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-xs text-white/70">{pick(asArray(divisions).find(dv => dv.id === d.division_id), "name")}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-white/70">
                      <span>{d.trip_type}</span>
                      <span>{d.budget}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
      )}
    </div>
  );
}
