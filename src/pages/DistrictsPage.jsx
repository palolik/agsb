import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { HiSearch } from "react-icons/hi";
import { asArray, asText } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import { districtCountsByDivision } from "../data";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";

export default function DistrictsPage() {
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
  const { data: districts, loading, error, reload } = useFetch("/districts");
  const { data: divisions } = useFetch("/divisions");

  // Counts reflect the districts the API actually returned, not a fixed 64.
  const countsReady = !loading && !error;
  const countsByDivision = districtCountsByDivision(districts);
  const withCount = (label, n) => (countsReady ? `${label} (${n})` : label);

  const filtered = asArray(districts).filter(d => {
    const matchDiv = activeDivision === "all" || asArray(divisions).find(dv => dv.id === d.division_id)?.slug === activeDivision;
    const matchSearch = !search || asText(d.name_en).toLowerCase().includes(search.toLowerCase()) || asText(d.name_bn).includes(search);
    return matchDiv && matchSearch;
  });

  const meta = <PageMeta title="৬৪ জেলা · Districts" description="Explore every district of Bangladesh: attractions, food, transport, budgets and the best time to visit." />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">৬৪ জেলা</h1>
        <p className="text-base-content/50 mt-1">Explore every corner of Bangladesh, district by district</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30" />
          <input
            type="text"
            placeholder="Search districts..."
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
          {withCount("All", asArray(districts).length)}
        </button>
        {asArray(divisions).map(dv => (
          <button
            key={dv.slug}
            onClick={() => setActiveDivision(dv.slug)}
            className={`btn btn-sm shrink-0 ${activeDivision === dv.slug ? "btn-primary" : "btn-ghost border-base-300"}`}
          >
            {withCount(dv.name_en, countsByDivision[dv.id] || 0)}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-base-content/40 mb-4">{loading || error ? "" : `${filtered.length} districts found`}</p>

      {/* Grid */}
      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(districts).length === 0 ? (
        <EmptyState message="এখনো কোনো জেলা যোগ করা হয়নি · No districts yet." />
      ) : filtered.length === 0 ? (
        <EmptyState
          message="কোনো জেলা মেলেনি · No districts match your search."
          action={<button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setActiveDivision("all"); }}>Clear filters</button>}
        />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(d => (
          <Link key={d.id} to={`/districts/${d.slug}`} className="card bg-base-200 card-hover overflow-hidden group border border-base-300">
            <figure className="h-36 overflow-hidden">
              <CoverImage image={d.image} alt={d.name_en} sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </figure>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{background: asArray(divisions).find(dv => dv.id === d.division_id)?.color}} />
                <span className="text-xs text-base-content/40">{asArray(divisions).find(dv => dv.id === d.division_id)?.name_en}</span>
              </div>
              <h3 className="font-bold text-base-content">{d.name_bn}</h3>
              <p className="text-sm text-base-content/50">{d.name_en}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-base-content/40">
                <span>{d.trip_type}</span>
                <span>{d.budget}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
}
