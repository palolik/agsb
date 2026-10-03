import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { HiStar, HiBadgeCheck, HiLocationMarker, HiCheckCircle } from "react-icons/hi";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";

export default function PartnersPage() {
  const { data: partners, loading, error, reload } = useFetch("/partners");

  const meta = <PageMeta title="পার্টনার · Partners" description="Hotels, transport and guides we work with across Bangladesh." />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">পার্টনার</h1>
        <p className="text-base-content/50 mt-1">Verified hotels, resorts, and gear providers with exclusive AGSB member discounts</p>
      </div>

      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(partners).length === 0 ? (
        <EmptyState message="এখনো কোনো পার্টনার নেই · No partners listed yet." />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {asArray(partners).map(p => (
          <div key={p.id} className="card bg-base-200 border border-base-300 card-hover overflow-hidden">
            <figure className="h-36 overflow-hidden">
              <CoverImage image={p.image} alt={p.name} />
            </figure>
            <div className="p-4">
              <div className="flex items-center gap-1 mb-1">
                {p.verified && <HiBadgeCheck className="w-4 h-4 text-success" />}
                <span className="badge badge-xs badge-ghost">{p.type}</span>
              </div>
              <h3 className="font-bold text-base-content">{p.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-base-content/40">
                <span className="flex items-center gap-0.5"><HiLocationMarker /> {p.district}</span>
                <span className="flex items-center gap-0.5"><HiStar className="text-warning" /> {p.rating}</span>
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium text-base-content">{p.price}</div>
                <div className="text-xs text-success">{p.discount}</div>
              </div>
              <Link to="/contact" className="btn btn-primary btn-sm w-full mt-3">Book / Inquire</Link>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Partner CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-200 border border-base-300 p-6">
          <h2 className="text-xl font-bold text-base-content mb-2">Become a Partner</h2>
          <p className="text-base-content/60 mb-4">Are you a hotel, resort, gear vendor, or tour guide? List your business on AGSB and reach thousands of travellers.</p>
          <Link to="/contact" className="btn btn-primary">Apply Now</Link>
        </div>
        <div className="card bg-primary/10 border border-primary/20 p-6">
          <h2 className="text-xl font-bold text-base-content mb-2">Partner Benefits</h2>
          <div className="space-y-2 text-sm text-base-content/70">
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> Featured on district pages and map</p>
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> Direct referral tracking dashboard</p>
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> Access to AGSB community travellers</p>
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> Seasonal campaign inclusion</p>
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> Performance analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}
