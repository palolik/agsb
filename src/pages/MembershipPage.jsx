import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { HiCheck, HiDeviceMobile } from "react-icons/hi";
import { asArray, asText } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import { useAuth } from "../context/AuthContext";
import PageMeta from "../components/PageMeta";
import { useLang } from "../context/LanguageContext";

// A plan is free when its price is 0/empty or literally "Free" / "ফ্রি".
const isFreePlan = (p) => {
  const price = asText(p.price).trim().toLowerCase();
  return !price || price === "0" || price === "free" || price === "ফ্রি" || /^৳?\s*0+$/.test(price);
};

export default function MembershipPage() {
  const { data: plans, loading, error, reload } = useFetch("/membership-plans");
  const { data: paymentMethods } = useFetch("/payment-methods");
  const { user } = useAuth();
  const { t } = useLang();
  const activeMethods = asArray(paymentMethods).filter((pm) => pm && pm.method && pm.active !== false);

  // Free → create an account (or go to the profile when already signed in).
  // Paid → there is no online checkout for memberships yet, so send the
  // visitor to the contact form with the plan pre-selected.
  const ctaFor = (p) =>
    isFreePlan(p)
      ? (user ? "/profile" : "/signup")
      : `/contact?purpose=membership&plan=${encodeURIComponent(asText(p.name))}`;

  const meta = (
    <PageMeta
      title={t("মেম্বারশিপ", "Membership")}
      description={t("ঘোরা জেলাগুলোর হিসাব রাখুন, ফ্রেম সংগ্রহ করুন, পার্টনার ডিসকাউন্ট পান এবং সার্টিফায়েড 64-জেলা এক্সপ্লোরার হয়ে উঠুন।", "Track your districts, collect frames, get partner discounts and become a certified 64-district explorer.")}
    />
  );
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="text-center mb-12">
        <span className="badge badge-primary badge-lg mb-3">{t("মেম্বারশিপ", "Membership")}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">{t("আপনার ভ্রমণ যাত্রা আপগ্রেড করুন", "Upgrade your travel journey")}</h1>
        <p className="text-base-content/50 max-w-xl mx-auto">{t("ঘোরা জেলাগুলোর হিসাব রাখুন, ফ্রেম সংগ্রহ করুন, পার্টনার ডিসকাউন্ট পান এবং সার্টিফায়েড 64-জেলা এক্সপ্লোরার হয়ে উঠুন।", "Track your districts, collect frames, get partner discounts, and become a certified 64-district explorer.")}</p>
      </div>

      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(plans).length === 0 ? (
        <EmptyState message={t("মেম্বারশিপ প্ল্যান শীঘ্রই আসছে।", "Membership plans are coming soon.")} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {asArray(plans).map(p => (
          <div key={p.name} className={`card p-6 border ${p.popular ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20" : "bg-base-200 border-base-300"}`}>
            {p.popular && <span className="badge badge-primary badge-sm mb-2">{t("সবচেয়ে জনপ্রিয়", "Most Popular")}</span>}
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
            <Link to={ctaFor(p)} className={`btn w-full ${p.popular ? "btn-primary" : "btn-ghost"}`}>
              {isFreePlan(p) && user ? t("আমার প্রোফাইলে যান", "Go to my profile") : (p.cta || (isFreePlan(p) ? t("ফ্রি যোগ দিন", "Join Free") : t("যোগাযোগ করুন", "Get in touch")))}
            </Link>
          </div>
        ))}
      </div>
      )}

      {activeMethods.length > 0 && (
        <div className="mt-12 card bg-base-200 border border-base-300 p-6 md:p-8">
          <h2 className="text-xl font-bold text-base-content mb-4">{t("পেমেন্ট মেথড", "Payment Methods")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeMethods.map(pm => (
              <div key={pm.id || pm._id || pm.method} className="flex items-center gap-3 p-3 bg-base-300/50 rounded-lg">
                <HiDeviceMobile className="w-7 h-7 text-primary shrink-0" />
                <div>
                  <div className="text-sm font-medium text-base-content">{pm.method}</div>
                  <div className="text-xs text-base-content/40">{t("মোবাইল পেমেন্ট", "Mobile payment")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
