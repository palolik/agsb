import { Link } from "react-router-dom";
import { partners } from "../data";
import { HiStar, HiBadgeCheck, HiLocationMarker } from "react-icons/hi";

export default function PartnersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">পার্টনার</h1>
        <p className="text-base-content/50 mt-1">Verified hotels, resorts, and gear providers with exclusive AGSB member discounts</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {partners.map(p => (
          <div key={p.id} className="card bg-base-200 border border-base-300 card-hover overflow-hidden">
            <figure className="h-36 overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
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
            <p>✅ Featured on district pages and map</p>
            <p>✅ Direct referral tracking dashboard</p>
            <p>✅ Access to AGSB community travellers</p>
            <p>✅ Seasonal campaign inclusion</p>
            <p>✅ Performance analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}
