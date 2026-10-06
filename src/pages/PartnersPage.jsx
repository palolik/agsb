import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { HiStar, HiBadgeCheck, HiLocationMarker, HiCheckCircle } from "react-icons/hi";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { useLang } from "../context/LanguageContext";

export default function PartnersPage() {
  const { t } = useLang();
  const { data: partners, loading, error, reload } = useFetch("/partners");

  const meta = <PageMeta title={t("পার্টনার", "Partners")} description={t("সারা বাংলাদেশে যেসব হোটেল, পরিবহন ও গাইডের সঙ্গে আমরা কাজ করি।", "Hotels, transport and guides we work with across Bangladesh.")} />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">{t("পার্টনার", "Partners")}</h1>
        <p className="text-base-content/50 mt-1">{t("যাচাই করা হোটেল, রিসোর্ট ও গিয়ার সরবরাহকারী — AGSB মেম্বারদের জন্য বিশেষ ছাড়সহ", "Verified hotels, resorts, and gear providers with exclusive AGSB member discounts")}</p>
      </div>

      {loading ? <Spinner /> : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : asArray(partners).length === 0 ? (
        <EmptyState message={t("এখনো কোনো পার্টনার নেই।", "No partners listed yet.")} />
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
              <Link to="/contact" className="btn btn-primary btn-sm w-full mt-3">{t("বুক / জানতে চান", "Book / Inquire")}</Link>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Partner CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-200 border border-base-300 p-6">
          <h2 className="text-xl font-bold text-base-content mb-2">{t("পার্টনার হোন", "Become a Partner")}</h2>
          <p className="text-base-content/60 mb-4">{t("আপনি কি হোটেল, রিসোর্ট, গিয়ার বিক্রেতা বা ট্যুর গাইড? AGSB-তে আপনার ব্যবসা যুক্ত করুন আর পৌঁছে যান হাজারো ভ্রমণকারীর কাছে।", "Are you a hotel, resort, gear vendor, or tour guide? List your business on AGSB and reach thousands of travellers.")}</p>
          <Link to="/contact" className="btn btn-primary">{t("এখনই আবেদন করুন", "Apply Now")}</Link>
        </div>
        <div className="card bg-primary/10 border border-primary/20 p-6">
          <h2 className="text-xl font-bold text-base-content mb-2">{t("পার্টনারদের সুবিধা", "Partner Benefits")}</h2>
          <div className="space-y-2 text-sm text-base-content/70">
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> {t("জেলা পেজ ও ম্যাপে বিশেষভাবে প্রদর্শন", "Featured on district pages and map")}</p>
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> {t("সরাসরি রেফারেল ট্র্যাকিং ড্যাশবোর্ড", "Direct referral tracking dashboard")}</p>
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> {t("AGSB কমিউনিটির ভ্রমণকারীদের কাছে পৌঁছানোর সুযোগ", "Access to AGSB community travellers")}</p>
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> {t("মৌসুমি ক্যাম্পেইনে অন্তর্ভুক্তি", "Seasonal campaign inclusion")}</p>
            <p className="flex items-center gap-2"><HiCheckCircle className="text-success shrink-0" /> {t("পারফরম্যান্স অ্যানালিটিক্স", "Performance analytics")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
