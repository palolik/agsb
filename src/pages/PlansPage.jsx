import { Link } from "react-router-dom";
import { travelPlans } from "../data";
import { HiLocationMarker, HiClock } from "react-icons/hi";

export default function PlansPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">ট্রাভেল প্ল্যান</h1>
        <p className="text-base-content/50 mt-1">Ready-made itineraries — pick one and go, or request a custom plan</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {travelPlans.map(p => (
          <div key={p.id} className="card bg-base-200 card-hover overflow-hidden border border-base-300 group">
            <figure className="h-44 overflow-hidden relative">
              <img src={p.image} alt={p.title_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 flex gap-1">
                <span className="badge badge-primary">{p.duration}</span>
                <span className="badge badge-ghost bg-base-200/80">{p.type}</span>
              </div>
            </figure>
            <div className="card-body p-4">
              <h3 className="text-lg font-bold text-base-content">{p.title_bn}</h3>
              <p className="text-sm text-base-content/60">{p.title_en}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-base-content/40">
                <span className="flex items-center gap-1"><HiLocationMarker /> {p.districts.join(", ")}</span>
                <span>{p.cost}</span>
              </div>
              <div className="mt-3">
                <p className="text-xs text-base-content/40 mb-2">Highlights:</p>
                <div className="flex flex-wrap gap-1">
                  {p.highlights.map((h, i) => (
                    <span key={i} className="badge badge-sm badge-ghost border-base-300">{h}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/contact" className="btn btn-primary btn-sm flex-1">Get this plan</Link>
                <button className="btn btn-ghost btn-sm border-base-300">Save</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card bg-primary/10 border border-primary/20 p-8 mt-12 text-center">
        <h2 className="text-2xl font-bold text-base-content mb-2">কাস্টম প্ল্যান দরকার?</h2>
        <p className="text-base-content/60 mb-4">Tell us your group size, budget, and dates — we'll build a custom itinerary just for you.</p>
        <Link to="/contact" className="btn btn-primary">Request Custom Plan — ৳499</Link>
      </div>
    </div>
  );
}
