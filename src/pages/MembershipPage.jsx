import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { HiCheck, HiStar, HiDeviceMobile, HiCreditCard, HiLibrary } from "react-icons/hi";
import { asArray } from "../lib/safe";

export default function MembershipPage() {
  const { data: plans } = useFetch("/membership-plans");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        <span className="badge badge-primary badge-lg mb-3">Membership</span>
        <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">আপনার ভ্রমণ যাত্রা আপগ্রেড করুন</h1>
        <p className="text-base-content/50 max-w-xl mx-auto">Track your districts, collect frames, get partner discounts, and become a certified 64-district explorer.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {asArray(plans).map(p => (
          <div key={p.name} className={`card p-6 border ${p.popular ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20" : "bg-base-200 border-base-300"}`}>
            {p.popular && <span className="badge badge-primary badge-sm mb-2">Most Popular</span>}
            <h3 className="text-xl font-bold text-base-content">{p.name}</h3>
            <div className="flex items-baseline gap-1 mt-2 mb-1">
              <span className="text-3xl font-bold text-primary">{p.price}</span>
              <span className="text-base-content/40 text-sm">{p.period}</span>
            </div>
            <p className="text-sm text-base-content/60 mb-5">{p.desc}</p>
            <div className="space-y-2.5 mb-6 flex-1">
              {asArray(p.features).map(f => (
                <div key={f} className="flex items-start gap-2">
                  <HiCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="text-sm text-base-content/70">{f}</span>
                </div>
              ))}
            </div>
            <button className={`btn w-full ${p.popular ? "btn-primary" : "btn-ghost"}`}>
              {p.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 card bg-base-200 border border-base-300 p-6 md:p-8">
        <h2 className="text-xl font-bold text-base-content mb-4">Payment Methods</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "bKash", icon: HiDeviceMobile, desc: "Mobile payment" },
            { name: "Nagad", icon: HiDeviceMobile, desc: "Mobile payment" },
            { name: "SSLCommerz", icon: HiCreditCard, desc: "Card payment" },
            { name: "Rocket", icon: HiLibrary, desc: "Mobile banking" },
          ].map(pm => (
            <div key={pm.name} className="flex items-center gap-3 p-3 bg-base-300/50 rounded-lg">
              <pm.icon className="w-7 h-7 text-primary shrink-0" />
              <div>
                <div className="text-sm font-medium text-base-content">{pm.name}</div>
                <div className="text-xs text-base-content/40">{pm.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
