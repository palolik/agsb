import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { HiArrowLeft, HiClock, HiCurrencyBangladeshi, HiStar, HiUsers, HiDownload, HiCamera } from "react-icons/hi";
import { FaWhatsapp, FaMedal } from "react-icons/fa";
import { asArray, asText } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import { whatsappUrl } from "../config/site";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { ALL_DISTRICTS } from "../data/allDistricts";
import AttractionCard from "../components/AttractionCard";
import { useLang } from "../context/LanguageContext";
import { districtName } from "../lib/districtNames";

// Only the 64 districts on the profile map can be checked in to.
const MAP_SLUGS = new Set(ALL_DISTRICTS.map((d) => d.slug));

// Imported Commons photos (CC BY / BY-SA) must credit the author and licence.
function PhotoCredit({ credit }) {
  const { t } = useLang();
  if (!credit || typeof credit !== "object") return null;
  const author = asText(credit.author).slice(0, 80);
  const license = asText(credit.license);
  const source = asText(credit.source_url).startsWith("https://") ? credit.source_url : null;
  if (!author && !license) return null;
  const text = `${t("ছবি", "Photo")}: ${author || t("অজানা", "Unknown")}${license ? ` · ${license}` : ""}`;
  return (
    <p className="absolute top-2 right-3 max-w-[70%] truncate text-[10px] leading-tight px-1.5 py-0.5 rounded bg-base-100/70 text-base-content/70" data-testid="photo-credit">
      {source ? <a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline" title={`${text} — Wikimedia Commons`}>{text}</a> : text}
    </p>
  );
}

export default function DistrictDetailPage() {
  const { slug } = useParams();
  const { lang, t, pick } = useLang();
  const dn = (d) => (lang === "bn" ? d.name_bn || districtName(d.name_en) : districtName(d.name_en));
  const { data: district, loading, error, status, reload } = useFetch(`/districts/${slug}`);
  const { data: allDistricts } = useFetch("/districts");
  const { data: divisions } = useFetch("/divisions");
  const { data: travelPlans } = useFetch("/plans");
  const attractionsQ = useFetch(`/attractions?district=${encodeURIComponent(slug)}`);

  // Only a 404 (or 400 for a malformed slug) means "not found"; network
  // failures (status null) and 5xx show ErrorState with a retry instead.
  const notFound = !loading && !district && (!error || status === 404 || status === 400);
  const meta = <PageMeta title={district ? dn(district) : notFound ? t("জেলা পাওয়া যায়নি", "District not found") : t("জেলা", "Districts")} description={district ? district.tagline : undefined} image={district?.image} />;
  if (loading) return <>{meta}<Spinner /></>;
  if (error && !notFound) {
    return <>{meta}<div className="max-w-7xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div></>;
  }
  if (!district) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {meta}
        <EmptyState
          message={t("জেলাটি পাওয়া যায়নি। লিংকটি যাচাই করুন অথবা সব জেলা দেখুন।", "District not found. Check the link or browse all districts.")}
          action={<Link to="/districts" className="btn btn-primary btn-sm"><HiArrowLeft className="mr-1" /> {t("জেলার তালিকায় ফিরে যান", "Back to Districts")}</Link>}
        />
      </div>
    );
  }

  const division = asArray(divisions).find(dv => dv.id === district.division_id);
  const relatedPlans = asArray(travelPlans).filter(p => asArray(p.districts).includes(district.name_en));
  const nearby = asArray(allDistricts).filter(d => d.division_id === district.division_id && d.id !== district.id).slice(0, 3);

  return (
    <div>
      {meta}
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <CoverImage image={district.image} alt={dn(district)} sizes="100vw" width={1600} height={640} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <Link to="/districts" className="btn btn-sm btn-ghost text-base-content/70 mb-3">
            <HiArrowLeft className="mr-1" /> {t("সব জেলা", "All Districts")}
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge">{pick(division, "name")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-base-content">{dn(district)}</h1>
          <p className="text-lg text-base-content/60">{lang === "bn" ? `${district.name_en} — ${asText(district.tagline)}` : district.tagline}</p>
        </div>
        <PhotoCredit credit={district.image_credit} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <HiClock />, label: t("ভ্রমণের সেরা সময়", "Best time"), val: district.best_time },
                { icon: <HiCurrencyBangladeshi />, label: t("বাজেট", "Budget"), val: district.budget },
                { icon: <HiStar />, label: t("কাঠিন্য", "Difficulty"), val: `${district.difficulty}/5` },
                { icon: <HiUsers />, label: t("ধরন", "Type"), val: district.family ? t("পরিবারবান্ধব", "Family-friendly") : t("অ্যাডভেঞ্চার", "Adventure") },
              ].map(f => (
                <div key={f.label} className="card bg-base-200 p-3 border border-base-300">
                  <div className="text-primary mb-1">{f.icon}</div>
                  <div className="text-xs text-base-content/40">{f.label}</div>
                  <div className="text-sm font-medium text-base-content">{f.val}</div>
                </div>
              ))}
            </div>

            {/* Attractions */}
            <div>
              <h2 className="text-xl font-bold text-base-content mb-4">{t("আকর্ষণীয় স্থান", "Attractions")}</h2>
              <DistrictAttractions query={attractionsQ} />
            </div>

            {/* Food */}
            <div>
              <h2 className="text-xl font-bold text-base-content mb-4">{t("স্থানীয় খাবার", "Local food")}</h2>
              <div className="flex flex-wrap gap-2">
                {asArray(district.food).map((f, i) => (
                  <span key={i} className="badge badge-lg badge-ghost border-base-300 py-3">{f}</span>
                ))}
              </div>
            </div>

            {/* Transport */}
            <div>
              <h2 className="text-xl font-bold text-base-content mb-4">{t("যাতায়াত", "Getting there")}</h2>
              <div className="card bg-base-200 p-4 border border-base-300">
                <p className="text-base-content/70">{district.transport}</p>
              </div>
            </div>

            {/* Related Plans */}
            {relatedPlans.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-base-content mb-4">{t("ট্রাভেল প্ল্যান", "Travel plans")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedPlans.map(p => (
                    <Link key={p.id} to={`/plans/${p.slug}`} className="card bg-base-200 p-4 border border-base-300 card-hover">
                      <h3 className="font-medium text-base-content">{pick(p, "title")}</h3>
                      <p className="text-sm text-base-content/50">{p.duration} · {p.cost}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* CTA card */}
            <div className="card bg-primary/10 border border-primary/20 p-5">
              <h3 className="font-bold text-base-content mb-2">{t("এই জেলা ভ্রমণের পরিকল্পনা করুন", "Plan a trip to this district")}</h3>
              <p className="text-sm text-base-content/60 mb-4">{t("এখানকার হোটেল, খাবার বা যাতায়াত নিয়ে প্রশ্ন আছে? যোগাযোগ করুন।", "Questions about hotels, food or transport here? Get in touch.")}</p>
              {whatsappUrl() && (
                <a href={whatsappUrl(t(`হ্যালো! আমি ${dn(district)} ভ্রমণের পরিকল্পনা করতে চাই।`, `Hi! I'd like to plan a trip to ${district.name_en}.`))} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full mb-2">
                  <FaWhatsapp className="mr-1" /> {t("হোয়াটসঅ্যাপে লিখুন", "WhatsApp us")}
                </a>
              )}
              <Link
                to={`/contact?purpose=plan&district=${encodeURIComponent(district.slug || "")}`}
                className={`btn w-full ${whatsappUrl() ? "btn-outline btn-sm" : "btn-primary"}`}
              >
                {t("মেসেজ পাঠান", "Send a message")}
              </Link>
            </div>

            {/* Frame CTA */}
            <div className="card bg-base-200 border border-base-300 p-5">
              <h3 className="font-bold text-base-content mb-2 flex items-center gap-2"><HiCamera className="text-primary shrink-0" /> {t("আমি ঘুরেছি", "I've been to")} — {dn(district)}</h3>
              <p className="text-sm text-base-content/60 mb-3">{t("এই জেলার ফটো ফ্রেম ডাউনলোড করে আপনার স্মৃতি শেয়ার করুন।", "Download this district's photo frame and share your memory.")}</p>
              <Link to="/frames" className="btn btn-secondary btn-sm w-full">
                <HiDownload className="mr-1" /> {t("ফ্রেম নিন", "Get Frame")}
              </Link>
            </div>

            {/* Badge */}
            <div className="card bg-base-200 border border-base-300 p-5 text-center">
              <div className="district-badge w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center">
                <FaMedal className="w-7 h-7 text-base-content" />
              </div>
              <h3 className="font-bold text-base-content">{t("জেলা ব্যাজ", "District Badge")}</h3>
              <CheckIn district={district} />
            </div>

            {/* Nearby */}
            {nearby.length > 0 && (
              <div>
                <h3 className="font-bold text-base-content mb-3">{t("কাছাকাছি জেলা", "Nearby districts")}</h3>
                <div className="space-y-2">
                  {nearby.map(d => (
                    <Link key={d.id} to={`/districts/${d.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300/50 transition-colors">
                      <CoverImage image={d.image} alt={dn(d)} className="w-12 h-12 rounded-lg object-cover" placeholderClassName="w-12 h-12 rounded-lg bg-base-300" sizes="48px" width={48} height={48} />
                      <div>
                        <div className="text-sm font-medium text-base-content">{dn(d)}</div>
                        {lang === "bn" && <div className="text-xs text-base-content/50">{d.name_en}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// The district's attractions (own collection, fetched separately), so a
// failed request only affects this section.
function DistrictAttractions({ query }) {
  const { t } = useLang();
  const { data, loading, error, reload } = query;
  if (loading) {
    return <div role="status" aria-live="polite" className="py-6 text-center"><span className="loading loading-spinner loading-md text-primary" aria-label={t("দর্শনীয় স্থান লোড হচ্ছে", "Loading attractions")} /></div>;
  }
  if (error) {
    return (
      <div role="alert" className="card bg-base-200 border border-base-300 p-4 text-sm text-base-content/60 flex flex-row items-center justify-between gap-3">
        <span>{t("দর্শনীয় স্থানগুলো লোড করা যায়নি।", "Couldn't load attractions.")}</span>
        <button type="button" className="btn btn-ghost btn-xs" onClick={reload}>{t("আবার চেষ্টা করুন", "Try again")}</button>
      </div>
    );
  }
  const list = asArray(data);
  if (list.length === 0) {
    return <p className="card bg-base-200 border border-base-300 border-dashed p-4 text-sm text-base-content/50">{t("এখনো কোনো দর্শনীয় স্থান যোগ করা হয়নি", "No attractions listed yet")}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {list.map((a) => <AttractionCard key={a._id || a.slug} attraction={a} />)}
    </div>
  );
}

// Logged in: toggles this district in the user's visited list (the same list
// the profile map edits). Logged out: sends them to log in and back here.
function CheckIn({ district }) {
  const { user, updateUser } = useAuth();
  const { lang, t } = useLang();
  const name = lang === "bn" ? district.name_bn || districtName(district.name_en) : district.name_en;
  const { pathname } = useLocation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!MAP_SLUGS.has(district.slug)) {
    return <p className="text-sm text-base-content/50 mt-1">{t("এই জেলায় এখনো চেক-ইন করা যায় না।", "Check-ins aren't available for this district yet.")}</p>;
  }

  if (!user) {
    return (
      <>
        <p className="text-sm text-base-content/50 mt-1">{t(`লগ ইন করে চেক-ইন করুন আর জিতে নিন ${name} ব্যাজ!`, `Log in to check in and earn your ${name} badge!`)}</p>
        <Link to="/login" state={{ from: pathname }} className="btn btn-ghost btn-sm mt-3">{t("চেক-ইন করতে লগ ইন করুন", "Log in to check in")}</Link>
      </>
    );
  }

  const visitedList = asArray(user.visitedDistricts);
  const visited = visitedList.includes(district.slug);

  async function toggle() {
    setSaving(true);
    setError("");
    try {
      // Rebuild from map slugs only so stale unknown entries don't count
      // against the server's 64-district cap.
      const known = visitedList.filter((s) => MAP_SLUGS.has(s) && s !== district.slug);
      const next = visited ? known : [...known, district.slug];
      await updateUser({ visitedDistricts: next });
    } catch (err) {
      setError(err?.message || t("আপনার চেক-ইন সেভ করা যায়নি।", "Couldn't save your check-in."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="text-sm text-base-content/50 mt-1">
        {visited
          ? t(`আপনি ${name}-এ চেক-ইন করেছেন।`, `You've checked in to ${name}.`)
          : t(`${name} ঘুরে এসেছেন? চেক-ইন করে ব্যাজটি জিতে নিন।`, `Been to ${name}? Check in to earn the badge.`)}
      </p>
      <button type="button" onClick={toggle} disabled={saving} className={`btn btn-sm mt-3 ${visited ? "btn-ghost" : "btn-primary"}`}>
        {saving ? <span className="loading loading-spinner loading-xs" /> : null}
        {visited ? t("চেক-ইন বাতিল করুন", "Undo check-in") : t("চেক-ইন করুন", "Check in")}
      </button>
      {error && <p role="alert" className="text-xs text-error mt-2">{error}</p>}
    </>
  );
}
