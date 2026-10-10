import { Link } from "react-router-dom";
import { districtCountsByDivision, countAttractions } from "../data";
import { useFetch } from "../hooks/useFetch";
import { HiArrowRight, HiLocationMarker, HiMap } from "react-icons/hi";
import { FaSuitcaseRolling } from "react-icons/fa";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import ProductCard from "../components/ProductCard";
import DistrictCarousel from "../components/DistrictCarousel";
import DistrictWordCloud from "../components/DistrictWordCloud";
import DivisionTiles from "../components/DivisionTiles";
import TripCard from "../components/TripCard";
import BlogCard from "../components/BlogCard";
import UpcomingTrips, { upcomingPlans } from "../components/UpcomingTrips";
import { useLang } from "../context/LanguageContext";
import DistrictGraph from "../components/DistrictGraph";
export default function HomePage() {
  const { t } = useLang();
  // Each section handles its own loading/error/empty state, so one failed
  // request never blanks the rest of the page.
  const districtsQ = useFetch("/districts");
  const divisionsQ = useFetch("/divisions");
  const blogQ = useFetch("/blog");
  const plansQ = useFetch("/plans");
  const attractionsQ = useFetch("/attractions");
  // Featured products come first in the API order.
  const productsQ = useFetch("/products");
  const districts = districtsQ.data;
  const divisions = divisionsQ.data;
  const blogPosts = blogQ.data;
  const travelPlans = plansQ.data;
  const featured = asArray(districts).filter(d => d.status === "complete").slice(0, 12);
  const countsByDivision = districtCountsByDivision(districts);

  // Stats come straight from the API responses; a stat whose request failed
  // is left out instead of showing a made-up number.
  const statItems = [
    !districtsQ.error && { key: "Districts", label: t("জেলা", "Districts"), val: districtsQ.loading ? null : asArray(districts).length, icon: HiMap },
    !attractionsQ.error && { key: "Attractions", label: t("দর্শনীয় স্থান", "Attractions"), val: attractionsQ.loading ? null : countAttractions(attractionsQ.data), icon: HiLocationMarker },
    !plansQ.error && { key: "Travel Plans", label: t("ট্রাভেল প্ল্যান", "Travel Plans"), val: plansQ.loading ? null : asArray(travelPlans).length, icon: FaSuitcaseRolling },
  ].filter(Boolean);

  const meta = <PageMeta description={t("ট্রিপ প্ল্যান করুন, অজানা সব জায়গা খুঁজে নিন, জেলা ব্যাজ সংগ্রহ করুন আর জেলা থেকে জেলায় ঘুরে হয়ে উঠুন বাংলাদেশের সত্যিকারের অভিযাত্রী।", "Plan trips, discover hidden gems, collect district badges, and become a true explorer of Bangladesh — district by district.")} />;
  return (
    <div>
      {meta}
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-28 relative grid lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] gap-8 items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t("৬৪ জেলা চ্যালেঞ্জ — শুরু করুন আজই", "64-District Challenge — start today")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-base-content leading-tight mb-4">
              {t("৬৪ জেলা,", "64 districts,")}<br />
              <span className="text-primary">{t("এক দেশ,", "one country,")}</span><br />
              {t("অসংখ্য গল্প।", "countless stories.")}
            </h1>
            <p className="text-lg text-base-content/60 mb-8 max-w-xl">
              {t(
                "ট্রিপ প্ল্যান করুন, অজানা সব জায়গা খুঁজে নিন, জেলা ব্যাজ সংগ্রহ করুন আর হয়ে উঠুন বাংলাদেশের সত্যিকারের অভিযাত্রী। আপনার ৬৪ জেলার যাত্রা শুরু হোক এখান থেকেই।",
                "Plan trips, discover hidden gems, collect district badges, and become a true explorer of Bangladesh. Your 64-district journey starts here."
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/districts" className="btn btn-primary btn-lg">
                {t("জেলা ঘুরে দেখুন", "Explore Districts")} <HiArrowRight className="ml-1" />
              </Link>
              <Link to="/map" className="btn btn-ghost btn-lg border-none">
                <HiMap className="mr-1" /> {t("ম্যাপ খুলুন", "Open Map")}
              </Link>
            </div>
          </div>
                   {/* <DistrictWordCloud className="hidden lg:block h-[36rem] -my-14" /> */}
<DistrictGraph className="hidden lg:block h-[34rem] -my-12" />
        </div>
      </section>

      {/* Stats */}
      {statItems.length > 0 && (
      <section className="bg-base-200 border-y border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-wrap justify-center gap-x-16 gap-y-6 text-center" data-testid="home-stats">
            {statItems.map(s => (
              <div key={s.key} data-stat={s.key}>
                <s.icon className="w-7 h-7 text-primary mx-auto mb-1" />
                <div className="text-2xl md:text-3xl font-bold text-primary" data-stat-value>
                  {s.val === null ? <span className="loading loading-dots loading-sm" aria-label={t("লোড হচ্ছে", "Loading")} /> : s.val.toLocaleString("en-US")}
                </div>
                <div className="text-sm text-base-content/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Upcoming trips: hidden until there is a bookable plan to show. */}
      {!plansQ.loading && !plansQ.error && upcomingPlans(travelPlans).length > 0 && (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-base-content">{t("আসন্ন ট্রিপ", "Upcoming Trips")}</h2>
              <p className="text-base-content/50 mt-1">{t("সিট থাকতে থাকতেই দলে যোগ দিন", "Join the group before the seats run out")}</p>
            </div>
            <Link to="/plans" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
              {t("সব প্ল্যান", "All plans")} <HiArrowRight className="ml-1" />
            </Link>
          </div>
          <UpcomingTrips plans={travelPlans} />
        </div>
      </section>
      )}

      {/* Featured Districts */}
      <section className="py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-base-content">{t("জনপ্রিয় জেলা", "Popular Districts")}</h2>
            <p className="text-base-content/50 mt-1">{t("এই জনপ্রিয় জেলাগুলো দিয়ে শুরু করুন আপনার যাত্রা", "Start your journey with these popular districts")}</p>
          </div>
          <Link to="/districts" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
            {t("সব দেখুন", "View all")} <HiArrowRight className="ml-1" />
          </Link>
        </div>
        {districtsQ.loading ? <Spinner /> : districtsQ.error ? (
          <ErrorState message={districtsQ.error} onRetry={districtsQ.reload} />
        ) : featured.length === 0 && (
          <EmptyState message={t("জনপ্রিয় জেলার তথ্য শীঘ্রই আসছে।", "Featured districts are coming soon.")} action={<Link to="/districts" className="btn btn-primary btn-sm">{t("সব জেলা দেখুন", "Browse all districts")}</Link>} />
        )}
      </div>
      {/* Full-bleed so the curved carousel can run edge to edge. */}
      {!districtsQ.loading && !districtsQ.error && <DistrictCarousel districts={featured} divisions={divisions} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="sm:hidden mt-4 text-center">
          <Link to="/districts" className="btn btn-primary btn-sm">{t("সব জেলা দেখুন", "View all districts")}</Link>
        </div>
      </div>
      </section>

      {/* Divisions */}
      <section className="bg-base-200/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-base-content">{t("৮ বিভাগ", "8 Divisions")}</h2>
              <p className="text-base-content/50 mt-1">{t("বিভাগ ধরে ধরে ঘুরে দেখুন বাংলাদেশ", "Explore Bangladesh division by division")}</p>
            </div>
            <Link to="/map" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
              <HiMap className="mr-1" /> {t("ম্যাপে দেখুন", "View on map")}
            </Link>
          </div>
          {divisionsQ.loading ? <Spinner /> : divisionsQ.error ? (
            <ErrorState message={divisionsQ.error} onRetry={divisionsQ.reload} />
          ) : asArray(divisions).length === 0 ? (
            <EmptyState message={t("কোনো বিভাগ পাওয়া যায়নি।", "No divisions yet.")} />
          ) : (
            <DivisionTiles divisions={asArray(divisions)} districts={districts} counts={countsByDivision} countsReady={!districtsQ.loading && !districtsQ.error} />
          )}
        </div>
      </section>

      {/* Trip Plans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-base-content">{t("ট্রাভেল প্ল্যান", "Travel Plans")}</h2>
            <p className="text-base-content/50 mt-1">{t("সব বাজেটের জন্য তৈরি ভ্রমণসূচি", "Ready-made itineraries for every budget")}</p>
          </div>
          <Link to="/plans" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
            {t("সব প্ল্যান", "All plans")} <HiArrowRight className="ml-1" />
          </Link>
        </div>
        {plansQ.loading ? <Spinner /> : plansQ.error ? (
          <ErrorState message={plansQ.error} onRetry={plansQ.reload} />
        ) : asArray(travelPlans).length === 0 ? (
          <EmptyState message={t("এখনো কোনো ট্রাভেল প্ল্যান নেই।", "No travel plans yet.")} />
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {asArray(travelPlans).slice(0, 3).map(p => <TripCard key={p.id} plan={p} />)}
        </div>
        )}
      </section>

      {/* Shop */}
      <section className="bg-base-200/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-base-content">{t("ট্রাভেল গিয়ার", "Travel Gear")}</h2>
              <p className="text-base-content/50 mt-1">{t("পরের ট্রিপের জন্য গিয়ার কিনুন বা ভাড়া নিন", "Buy or rent gear for your next trip")}</p>
            </div>
            <Link to="/shop" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
              {t("শপে যান", "Visit shop")} <HiArrowRight className="ml-1" />
            </Link>
          </div>
          {productsQ.loading ? <Spinner /> : productsQ.error ? (
            <ErrorState message={productsQ.error} onRetry={productsQ.reload} />
          ) : asArray(productsQ.data).length === 0 ? (
            <EmptyState message={t("এখনো কোনো পণ্য নেই।", "No products yet.")} />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {asArray(productsQ.data).slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
          )}
          <div className="sm:hidden mt-4 text-center">
            <Link to="/shop" className="btn btn-primary btn-sm">{t("শপে যান", "Visit shop")}</Link>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-base-content">{t("ট্রাভেল ব্লগ", "Travel Blog")}</h2>
              <p className="text-base-content/50 mt-1">{t("গাইড, গল্প আর স্থানীয় অভিজ্ঞতা", "Guides, stories, and local insights")}</p>
            </div>
            <Link to="/blog" className="btn btn-ghost btn-sm text-primary hidden sm:flex">
              {t("সব পোস্ট", "All posts")} <HiArrowRight className="ml-1" />
            </Link>
          </div>
          {blogQ.loading ? <Spinner /> : blogQ.error ? (
            <ErrorState message={blogQ.error} onRetry={blogQ.reload} />
          ) : asArray(blogPosts).length === 0 ? (
            <EmptyState message={t("এখনো কোনো ব্লগ পোস্ট নেই।", "No blog posts yet.")} />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {asArray(blogPosts).slice(0, 3).map(b => <BlogCard key={b.id} post={b} />)}
          </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="card bg-primary text-primary-content p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-3">{t("আপনার ৬৪ জেলা চ্যালেঞ্জ শুরু করুন", "Start your 64-district challenge")}</h2>
          <p className="text-primary-content/70 mb-6 max-w-xl mx-auto">{t("অগ্রগতি ট্র্যাক করুন, জেলা ব্যাজ অর্জন করুন, ফটো ফ্রেম সংগ্রহ করুন আর পেয়ে যান ৬৪ জেলা ভ্রমণের চূড়ান্ত সার্টিফিকেট।", "Track your progress, earn district badges, collect photo frames, and get the ultimate 64-district certificate.")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/membership" className="btn bg-base-100 text-primary hover:bg-base-200 border-none">{t("এখনই যোগ দিন — ফ্রি", "Join Now — Free")}</Link>
            <Link to="/frames" className="btn btn-ghost text-primary-content hover:bg-primary-content/10 border-none">{t("ফ্রেম দেখুন", "Browse Frames")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
