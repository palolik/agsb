import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { MAP_VIEWBOX } from "../data/districtMapPositions";
import { HiX, HiExternalLink, HiMap, HiLocationMarker } from "react-icons/hi";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState } from "../components/StateViews";
import { districtName } from "../lib/districtNames";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import BangladeshMap from "../components/BangladeshMap";
import { attractionsByDistrict } from "../data";
import { useLang } from "../context/LanguageContext";

// The map is as large as fits both the width and the visible height
// (dvh tracks the mobile URL bar), always keeping the SVG's aspect ratio,
// so no district is ever cut off at narrow widths.
const MAP_ASPECT = MAP_VIEWBOX.width / MAP_VIEWBOX.height;
const MAP_SIZE_STYLE = {
  aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}`,
  width: `min(100%, calc((100dvh - 64px) * ${MAP_ASPECT.toFixed(5)}))`,
  maxWidth: "100%",
  height: "auto",
};

export default function MapPage() {
  const { t } = useLang();
  const [attempt, setAttempt] = useState(0);
  const meta = <PageMeta title={t("মানচিত্র", "Interactive Map")} description={t("বাংলাদেশের ইন্টারঅ্যাকটিভ মানচিত্রে ট্রাভেল গাইডসহ জেলাগুলো খুঁজে নিন।", "Find districts with travel guides on an interactive map of Bangladesh.")} />;
  return <>{meta}<MapView key={attempt} onRetry={() => setAttempt((n) => n + 1)} /></>;
}

function MapView({ onRetry }) {
  const { lang, t, pick } = useLang();
  // Localized name for a district or division record (English in modern spelling).
  const nameOf = (r) => (lang === "bn" ? r?.name_bn || districtName(r?.name_en) : districtName(r?.name_en));
  const { data: districts, loading: districtsLoading, error: districtsError } = useFetch("/districts");
  const { data: divisions } = useFetch("/divisions");
  // Attractions live in their own collection; if this fails the panel just
  // leaves out the "Top attractions" list.
  const { data: attractions } = useFetch("/attractions");
  const attractionsBySlug = useMemo(() => attractionsByDistrict(attractions), [attractions]);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  // Districts that exist in the API (and on the map) can be opened.
  const MAP_DISTRICTS = useMemo(() => asArray(districts)
    .map((d) => ({
      ...d,
      name_en: districtName(d.name_en),
      pin: ALL_DISTRICTS.find((ad) => ad.slug === d.slug)?.pin,
    }))
    .filter((d) => d.pin), [districts]);

  const bySlug = useMemo(() => new Map(MAP_DISTRICTS.map((d) => [d.slug, d])), [MAP_DISTRICTS]);
  const hasGuide = useCallback((slug) => bySlug.has(slug), [bySlug]);
  const selectDistrict = useCallback((slug) => setSelected(bySlug.get(slug) || null), [bySlug]);
  const districtAriaLabel = useCallback((slug) => {
    const d = bySlug.get(slug);
    const name = (lang === "bn" ? d?.name_bn || d?.name_en : d?.name_en) || slug;
    return lang === "bn" ? `${name} — বিস্তারিত দেখুন` : `${name} — show details`;
  }, [bySlug, lang]);

  // The hovered/selected district is also shaded on the base map.
  const districtClass = useCallback(
    (slug) => (slug === selected?.slug ? "is-selected" : slug === hovered ? "is-hovered" : ""),
    [selected, hovered],
  );

  // Districts grouped under their division, in the API's division order;
  // anything without a known division goes last.
  const districtsByDivision = useMemo(() => {
    const groups = asArray(divisions).map((dv) => ({
      key: dv.id,
      label: nameOf(dv),
      items: MAP_DISTRICTS.filter((d) => d.division_id === dv.id),
    }));
    const known = new Set(groups.map((g) => g.key));
    const rest = MAP_DISTRICTS.filter((d) => !known.has(d.division_id));
    if (rest.length) groups.push({ key: "other", label: t("অন্যান্য", "Other"), items: rest });
    const byName = (a, b) => nameOf(a).localeCompare(nameOf(b), lang);
    return groups.filter((g) => g.items.length).map((g) => ({ ...g, items: [...g.items].sort(byName) }));
    // nameOf/t only change with lang.
  }, [divisions, MAP_DISTRICTS, lang]);
  const [listOpenByDefault] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(min-width: 768px)").matches);

  const failure = districtsError;
  const busy = !failure && districtsLoading;

  return (
    <div className="relative min-h-[calc(100dvh-64px)] h-[calc(100dvh-64px)] flex items-center justify-center bg-base-100">
      {(busy || failure) && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center px-4 bg-base-100/70">
          {failure ? <ErrorState message={failure} onRetry={onRetry} /> : <Spinner label={t("মানচিত্র লোড হচ্ছে…", "Loading map…")} />}
        </div>
      )}

      {/* Map */}
      <div className="relative" style={MAP_SIZE_STYLE} data-testid="bd-map">
        {/* Districts with a guide are the controls: click/tap or Enter to open. */}
        <BangladeshMap
          districtClass={districtClass}
          className="absolute inset-0"
          onSelect={selectDistrict}
          isInteractive={hasGuide}
          ariaLabel={districtAriaLabel}
          onHover={setHovered}
        />
      </div>

      {/* Header overlay */}
      <div className="absolute top-4 left-4 z-[1000] w-64 sm:w-72">
        <div className="bg-base-200/90 backdrop-blur-lg rounded-xl p-3 border border-base-300 shadow-xl">
          <h1 className="text-lg font-bold text-base-content flex items-center gap-2"><HiMap className="text-primary" /> {t("বাংলাদেশের মানচিত্র", "Bangladesh Map")}</h1>
          <p className="text-xs text-base-content/50">{t("যেকোনো জেলায় ক্লিক করে ঘুরে দেখুন", "Click any district to explore")}</p>
          {/* District list grouped by division: the same districts as plain links,
              for keyboard, screen-reader and small-screen users who'd rather not
              use the map. Open by default where there's room beside the map. */}
          {MAP_DISTRICTS.length > 0 && (
            <details className="mt-2 text-xs" open={listOpenByDefault}>
              <summary className="cursor-pointer text-primary">{t(`সব ${MAP_DISTRICTS.length}টি জেলার তালিকা`, `List all ${MAP_DISTRICTS.length} districts`)}</summary>
              <div className="mt-2 max-h-[calc(100dvh-64px-9rem)] overflow-y-auto pr-1 space-y-3">
                {districtsByDivision.map(({ key, label, items }) => (
                  <section key={key}>
                    <h2 className="flex items-center gap-1.5 font-semibold text-base-content/80 mb-1">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {label}
                      <span className="font-normal text-base-content/40">({items.length})</span>
                    </h2>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pl-3.5">
                      {items.map((d) => (
                        <li key={d.slug}>
                          <Link
                            to={`/districts/${d.slug}`}
                            className="text-base-content/70 hover:text-primary"
                            onMouseEnter={() => setHovered(d.slug)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            {nameOf(d)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Selected district panel */}
      {selected && (
        <div className="absolute left-4 right-4 bottom-4 max-h-[65%] sm:max-h-none sm:left-auto sm:top-4 z-[1000] sm:w-80 flex flex-col">
          <div className="bg-base-200/95 backdrop-blur-lg rounded-xl border border-base-300 shadow-2xl min-h-0 sm:h-full overflow-y-auto">
            <div className="relative">
              <CoverImage image={selected.image} alt={nameOf(selected)} className="w-full h-36 object-cover rounded-t-xl" placeholderClassName="w-full h-36 bg-base-300 rounded-t-xl" sizes="320px" width={320} height={144} priority />
              <button type="button" aria-label={t("জেলার বিস্তারিত বন্ধ করুন", "Close district details")} onClick={() => setSelected(null)} className="absolute top-2 right-2 btn btn-circle btn-sm btn-ghost bg-base-200/80">
                <HiX aria-hidden="true" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-200 p-3">
                <span className="badge badge-sm">
                  {nameOf(asArray(divisions).find(dv => dv.id === selected.division_id))}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold text-base-content">{nameOf(selected)}</h2>
              {lang === "bn" && <p className="text-sm text-base-content/60">{selected.name_en}</p>}
              <p className="text-sm text-primary mt-1">{selected.tagline}</p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-base-300/50 rounded-lg p-2">
                  <div className="text-xs text-base-content/40">{t("বাজেট", "Budget")}</div>
                  <div className="text-sm font-medium text-base-content">{selected.budget}</div>
                </div>
                <div className="bg-base-300/50 rounded-lg p-2">
                  <div className="text-xs text-base-content/40">{t("ভ্রমণের সেরা সময়", "Best time")}</div>
                  <div className="text-sm font-medium text-base-content">{selected.best_time}</div>
                </div>
              </div>

              {asArray(attractionsBySlug[selected.slug]).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-base-content/50 mb-2">{t("সেরা দর্শনীয় স্থান", "Top attractions")}</p>
                  {attractionsBySlug[selected.slug].slice(0, 3).map((a) => (
                    <Link key={a._id || a.slug} to={`/attractions/${a.slug}`} className="flex items-center gap-2 py-1.5 border-b border-base-300/50 last:border-0 hover:text-primary">
                      <HiLocationMarker className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-sm text-base-content/70">{pick(a, "name")}</span>
                    </Link>
                  ))}
                </div>
              )}

              <Link to={`/districts/${selected.slug}`} className="btn btn-primary btn-sm w-full mt-4">
                {t("পুরো গাইড দেখুন", "View full guide")} <HiExternalLink className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
