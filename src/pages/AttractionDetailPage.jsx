import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { HiArrowLeft, HiLocationMarker } from "react-icons/hi";
import { asArray } from "../lib/safe";
import { renderRichText } from "../lib/richText";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import AttractionCard, { TypeBadge } from "../components/AttractionCard";

export default function AttractionDetailPage() {
  const { slug } = useParams();
  const { data: attraction, loading, error, status, reload } = useFetch(`/attractions/${slug}`);

  // Only a 404 (or 400 for a malformed slug) means "not found"; network
  // failures (status null) and 5xx show ErrorState with a retry instead.
  const notFound = !loading && !attraction && (!error || status === 404 || status === 400);
  const meta = <PageMeta title={attraction ? [attraction.name_bn, attraction.name].filter(Boolean).join(" — ") : notFound ? "স্থানটি পাওয়া যায়নি · Attraction not found" : "আকর্ষণীয় স্থান · Attractions"} description={attraction ? attraction.desc : undefined} image={attraction?.image} />;
  if (loading) return <>{meta}<Spinner /></>;
  if (error && !notFound) {
    return <>{meta}<div className="max-w-7xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div></>;
  }
  if (!attraction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {meta}
        <EmptyState
          message="স্থানটি পাওয়া যায়নি · Attraction not found. Check the link or browse the districts."
          action={<Link to="/districts" className="btn btn-primary btn-sm"><HiArrowLeft className="mr-1" /> Browse Districts</Link>}
        />
      </div>
    );
  }

  const a = attraction;
  const districtLabel = a.district_name_en || a.district_name_bn || "District";
  const detailsHtml = renderRichText(a.details);

  return (
    <div>
      {meta}
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <CoverImage image={a.image} alt={a.name} sizes="100vw" width={1600} height={640} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          {a.district_slug ? (
            <Link to={`/districts/${a.district_slug}`} className="btn btn-sm btn-ghost text-base-content/70 mb-3">
              <HiArrowLeft className="mr-1" /> {districtLabel}
            </Link>
          ) : (
            <Link to="/districts" className="btn btn-sm btn-ghost text-base-content/70 mb-3">
              <HiArrowLeft className="mr-1" /> All Districts
            </Link>
          )}
          <div className="flex items-center gap-2 mb-2">
            <TypeBadge type={a.type} className="" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-base-content">{a.name_bn || a.name}</h1>
          {a.name_bn && <p className="text-lg text-base-content/60">{a.name}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {(a.location || a.district_name_en) && (
              <p className="flex items-center gap-2 text-base-content/70">
                <HiLocationMarker className="text-primary shrink-0" aria-hidden="true" />
                {[a.location, a.district_name_en].filter(Boolean).join(", ")}
              </p>
            )}
            {a.desc && <p className="text-lg text-base-content/80">{a.desc}</p>}
            {detailsHtml && (
              <div className="prose prose-theme max-w-none prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: detailsHtml }} />
            )}
          </div>

          {/* Sidebar: more in this district */}
          {a.district_slug && <MoreInDistrict attraction={a} label={districtLabel} />}
        </div>
      </div>
    </div>
  );
}

// Other attractions of the same district. Mounted only once the attraction
// (and so its district) is known; a failure here leaves the page intact.
function MoreInDistrict({ attraction: a, label }) {
  const { data, loading, error } = useFetch(`/attractions?district=${encodeURIComponent(a.district_slug)}`);
  const more = asArray(data).filter((o) => o.slug !== a.slug);
  return (
    <div className="space-y-3">
      <h2 className="font-bold text-base-content">More in {label}</h2>
      {loading ? (
        <div role="status" aria-live="polite" className="py-4 text-center"><span className="loading loading-spinner loading-md text-primary" aria-label="Loading attractions" /></div>
      ) : error ? (
        <p role="alert" className="text-sm text-base-content/50">Couldn't load other attractions.</p>
      ) : more.length === 0 ? (
        <p className="text-sm text-base-content/50">No other attractions listed yet.</p>
      ) : (
        more.map((o) => <AttractionCard key={o._id || o.slug} attraction={o} />)
      )}
      <Link to={`/districts/${a.district_slug}`} className="btn btn-outline btn-sm w-full">
        {label} guide
      </Link>
    </div>
  );
}
