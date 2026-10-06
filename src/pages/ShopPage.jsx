import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HiSearch, HiShoppingCart, HiX } from "react-icons/hi";
import { useFetch } from "../hooks/useFetch";
import { useCart } from "../context/CartContext";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import ProductCard from "../components/ProductCard";
import { useLang } from "../context/LanguageContext";

const MODES = [
  { value: "", label: { bn: "সব", en: "All" } },
  { value: "buy", label: { bn: "কিনুন", en: "Buy" } },
  { value: "rent", label: { bn: "ভাড়া", en: "Rent" } },
];

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const mode = ["buy", "rent"].includes(params.get("mode")) ? params.get("mode") : "";
  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const [search, setSearch] = useState(q);
  const { count } = useCart();
  const { t, pick } = useLang();

  // Keep the box in step with back/forward navigation.
  useEffect(() => { setSearch(q); }, [q]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === "q" });
  };

  // Debounce typing into the URL (and so into the request).
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === q) return undefined;
    const timer = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        return next;
      }, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (mode) query.set("mode", mode);
  if (q) query.set("q", q);
  const qs = query.toString();
  const { data: products, loading, error, reload } = useFetch(`/products${qs ? `?${qs}` : ""}`);
  const { data: categories } = useFetch("/product-categories");

  const filtered = Boolean(category || mode || q);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageMeta title={t("শপ", "Travel gear shop")} description={t("পরের ট্রিপের জন্য তাঁবু, ব্যাকপ্যাকসহ ট্রাভেল গিয়ার কিনুন বা ভাড়া নিন — বাংলাদেশের যেকোনো প্রান্তে।", "Buy or rent tents, backpacks and travel gear for your next trip across Bangladesh.")} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-base-content">{t("শপ", "Travel gear shop")}</h1>
          <p className="text-base-content/50 mt-1">{t("ট্রিপের গিয়ার কিনুন বা ভাড়া নিন", "Buy or rent gear for your next trip")}</p>
        </div>
        {count > 0 && (
          <Link to="/cart" className="btn btn-primary btn-sm">
            <HiShoppingCart className="mr-1" /> {t("কার্ট", "Cart")} ({count})
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div role="tablist" aria-label={t("কিনুন বা ভাড়া নিন", "Buy or rent")} className="tabs tabs-box bg-base-200 w-fit">
          {MODES.map((m) => (
            <button
              key={m.value || "all"}
              type="button"
              role="tab"
              aria-selected={mode === m.value}
              className={`tab ${mode === m.value ? "tab-active" : ""}`}
              onClick={() => setParam("mode", m.value)}
            >
              {t(m.label.bn, m.label.en)}
            </button>
          ))}
        </div>
        <form className="md:ml-auto w-full md:w-80" role="search" onSubmit={(e) => { e.preventDefault(); setParam("q", search.trim()); }}>
          <label className="input input-bordered bg-base-200 w-full">
            <HiSearch className="w-5 h-5 shrink-0 text-base-content/40" aria-hidden="true" />
            <input type="search" className="grow" placeholder={t("গিয়ার খুঁজুন", "Search gear")} aria-label={t("গিয়ার খুঁজুন", "Search gear")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </form>
      </div>

      {asArray(categories).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" aria-label={t("ক্যাটাগরি", "Categories")}>
          <button type="button" onClick={() => setParam("category", "")} className={`btn btn-sm rounded-full ${!category ? "btn-primary" : "btn-ghost border-base-300"}`}>
            {t("সব ক্যাটাগরি", "All")}
          </button>
          {asArray(categories).map((c) => (
            <button
              key={c._id}
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => setParam("category", category === c.slug ? "" : c.slug)}
              className={`btn btn-sm rounded-full ${category === c.slug ? "btn-primary" : "btn-ghost border-base-300"}`}
            >
              {pick(c, "name")}
            </button>
          ))}
        </div>
      )}

      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(products).length === 0 ? (
        <EmptyState
          message={filtered ? t("এই ফিল্টারে কোনো গিয়ার পাওয়া যায়নি।", "No gear matches these filters.") : t("শপে এখনো কোনো গিয়ার নেই।", "No gear in the shop yet.")}
          action={filtered && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { setSearch(""); setParams(new URLSearchParams()); }}>
              <HiX className="mr-1" /> {t("ফিল্টার মুছুন", "Clear filters")}
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {asArray(products).map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
