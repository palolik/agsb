import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { districts, divisions } from "../data";
import { HiSearch, HiFilter } from "react-icons/hi";

export default function DistrictsPage() {
  const [searchParams] = useSearchParams();
  const divFilter = searchParams.get("division");
  const [search, setSearch] = useState("");
  const [activeDivision, setActiveDivision] = useState(divFilter || "all");

  const filtered = districts.filter(d => {
    const matchDiv = activeDivision === "all" || divisions.find(dv => dv.id === d.division_id)?.slug === activeDivision;
    const matchSearch = !search || d.name_en.toLowerCase().includes(search.toLowerCase()) || d.name_bn.includes(search);
    return matchDiv && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
          All (64)
        </button>
        {divisions.map(dv => (
          <button
            key={dv.slug}
            onClick={() => setActiveDivision(dv.slug)}
            className={`btn btn-sm shrink-0 ${activeDivision === dv.slug ? "btn-primary" : "btn-ghost border-base-300"}`}
          >
            {dv.name_en} ({dv.districtCount})
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-base-content/40 mb-4">{filtered.length} districts found</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(d => (
          <Link key={d.id} to={`/districts/${d.slug}`} className="card bg-base-200 card-hover overflow-hidden group border border-base-300">
            <figure className="h-36 overflow-hidden relative">
              <img src={d.image} alt={d.name_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className={`absolute top-2 right-2 badge badge-sm ${d.status === "complete" ? "badge-success" : d.status === "good" ? "badge-info" : "badge-ghost"}`}>
                {d.status}
              </div>
            </figure>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{background: divisions.find(dv => dv.id === d.division_id)?.color}} />
                <span className="text-xs text-base-content/40">{divisions.find(dv => dv.id === d.division_id)?.name_en}</span>
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
    </div>
  );
}
