import { useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { useFetch } from "../hooks/useFetch";
import { formatDateRange } from "../lib/planSchedule";
import { PAYMENT_STATUS, BOOKING_STATUS, taka, canPay, hasTickets } from "../lib/booking";
import { MAP_VIEWBOX } from "../data/districtMapPositions";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { HiMail, HiPhone, HiCalendar, HiCamera, HiStar, HiLocationMarker, HiPencil, HiKey, HiCheckCircle } from "react-icons/hi";
import { FaSignOutAlt, FaMedal, FaSuitcaseRolling } from "react-icons/fa";
import { asArray } from "../lib/safe";
import { ORDER_STATUS, FULFILMENT, canPayOrder, itemsSummary } from "../lib/shop";
import { districtName } from "../lib/districtNames";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import BangladeshMap from "../components/BangladeshMap";
import { EditProfileForm, ChangePasswordForm } from "../components/ProfileEditor";

const EMPTY = [];
// Bangladesh has 64 districts; the check-in tracker covers all of them.
const TOTAL_DISTRICTS = ALL_DISTRICTS.length;
const DISTRICT_BY_SLUG = new Map(ALL_DISTRICTS.map((d) => [d.slug, d]));

// Touch devices and small screens confirm a check-in before saving, so
// scrolling or panning across the map can't toggle districts by accident.
const CONFIRM_QUERY = "(hover: none), (pointer: coarse), (max-width: 767px)";
function subscribeConfirmMode(cb) {
  const mq = window.matchMedia(CONFIRM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useConfirmMode() {
  return useSyncExternalStore(
    subscribeConfirmMode,
    () => window.matchMedia(CONFIRM_QUERY).matches,
    () => false,
  );
}

// "2026-10-05" -> "Oct 2026" (bn-BD locale in Bangla); anything unparseable is shown as stored.
function formatJoined(joined, lang) {
  const d = new Date(joined);
  return Number.isNaN(d.getTime()) ? joined : d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { month: "short", year: "numeric" });
}

// District name in the site language (Bangla from name_bn, else modern English spelling).
function localDistrictName(d, lang) {
  return lang === "bn" ? d.name_bn || districtName(d.name_en) : districtName(d.name_en);
}

// One labelled line of account details; empty values show "Not added".
function InfoRow({ icon: Icon, label, value }) {
  const { t } = useLang();
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 text-left">
      <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-base-content/50">{label}</div>
        <div className={`truncate ${value ? "text-base-content" : "text-base-content/40 italic"}`}>{value || t("যোগ করা হয়নি", "Not added")}</div>
      </div>
    </li>
  );
}

export default function ProfilePage() {
  const { user, ready, logout, updateUser } = useAuth();
  const { lang, t } = useLang();
  const [editing, setEditing] = useState(null); // null | "profile" | "password"
  const [accountNotice, setAccountNotice] = useState("");
  const startEditing = (what) => { setAccountNotice(""); setEditing(what); };
  const finishEditing = (notice) => { setEditing(null); setAccountNotice(notice || ""); };
  const [hovered, setHovered] = useState(null);
  const confirmMode = useConfirmMode();
  // Check-in saves: `optimistic` is the list shown while saves are in flight;
  // `desiredRef` always holds the newest wanted list, so every toggle builds on
  // the latest state (never on a stale render) and saves run one at a time.
  const [optimistic, setOptimistic] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pendingSlug, setPendingSlug] = useState(null);
  const desiredRef = useRef(null);
  const inFlightRef = useRef(false);

  const rawVisited = user?.visitedDistricts;
  const savedVisited = useMemo(() => (Array.isArray(rawVisited) ? rawVisited : EMPTY), [rawVisited]);
  const visited = optimistic ?? savedVisited;
  const savedRef = useRef(savedVisited);
  useEffect(() => { savedRef.current = savedVisited; }, [savedVisited]);
  const visitedSet = useMemo(() => new Set(visited), [visited]);
  // Only slugs on the map count; anything else (old or renamed districts)
  // would push the tally past 64 with no badge to show for it.
  const visitedDistricts = useMemo(
    () => visited.map((slug) => DISTRICT_BY_SLUG.get(slug)).filter(Boolean),
    [visited],
  );
  const visitedCount = visitedDistricts.length;

  // District shading (CSS .bd-district.is-*): awaiting confirmation, visited, hovered.
  const districtClass = useCallback(
    (slug) => (slug === pendingSlug ? "is-pending" : visitedSet.has(slug) ? "is-visited" : slug === hovered ? "is-hovered" : ""),
    [pendingSlug, visitedSet, hovered],
  );
  const districtAriaLabel = useCallback(
    (slug) => {
      const d = DISTRICT_BY_SLUG.get(slug);
      const name = d ? localDistrictName(d, lang) : districtName(slug);
      return lang === "bn"
        ? `${name}${visitedSet.has(slug) ? " (ঘোরা হয়েছে)" : ""} — চেক-ইন করুন`
        : `${name}${visitedSet.has(slug) ? " (visited)" : ""} — check in`;
    },
    [visitedSet, lang],
  );

  const meta = <PageMeta title={t("আমার প্রোফাইল", "My Profile")} />;
  if (!ready) return meta;
  if (!user) return <>{meta}<Navigate to="/login" replace state={{ from: "/profile" }} /></>;

  const progress = Math.round((visitedCount / TOTAL_DISTRICTS) * 100);

  async function flushSaves() {
    inFlightRef.current = true;
    setSaving(true);
    try {
      // Keep saving until the server has the newest list (clicks made while
      // a save was in flight are sent by the next pass, not lost).
      let sent = null;
      while (desiredRef.current && desiredRef.current !== sent) {
        sent = desiredRef.current;
        await updateUser({ visitedDistricts: sent });
      }
    } catch (err) {
      setSaveError(t(
        `চেক-ইন সেভ করা যায়নি${err?.message ? `: ${err.message}` : ""}। আপনার ম্যাপ আগের অবস্থায় ফেরানো হয়েছে — আবার চেষ্টা করুন।`,
        `Couldn't save your check-in${err?.message ? `: ${err.message}` : ""}. Your map was restored — please try again.`,
      ));
    } finally {
      // Success: the user record now holds the list. Failure: fall back to
      // the last list the server confirmed.
      desiredRef.current = null;
      setOptimistic(null);
      inFlightRef.current = false;
      setSaving(false);
    }
  }

  function toggleDistrict(slug) {
    // Drop unknown slugs so stale entries don't count against the 64 cap.
    const base = (desiredRef.current ?? savedRef.current).filter((s) => DISTRICT_BY_SLUG.has(s));
    const next = base.includes(slug) ? base.filter((s) => s !== slug) : [...base, slug];
    desiredRef.current = next;
    setOptimistic(next);
    setSaveError("");
    if (!inFlightRef.current) flushSaves();
  }

  function onDistrictClick(slug) {
    if (confirmMode) {
      setPendingSlug((cur) => (cur === slug ? null : slug));
    } else {
      toggleDistrict(slug);
    }
  }

  function confirmPending() {
    if (!pendingSlug) return;
    toggleDistrict(pendingSlug);
    setPendingSlug(null);
  }

  const pendingDistrict = pendingSlug ? DISTRICT_BY_SLUG.get(pendingSlug) : null;
  const pendingIsVisited = pendingSlug ? visitedSet.has(pendingSlug) : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="card bg-base-200 border border-base-300 overflow-hidden">
            {/* Cover band with the avatar overlapping its bottom edge */}
            <div className="h-20 bg-gradient-to-br from-primary to-primary/60" aria-hidden="true" />
            <div className="px-6 pb-6 -mt-10">
              <div className="w-20 h-20 rounded-full bg-primary ring-4 ring-base-200 flex items-center justify-center text-primary-content font-bold text-3xl mx-auto shadow-md">
                {user.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="text-center mt-3">
                <h1 className="text-xl font-bold text-base-content break-words">{user.name}</h1>
                <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-base-content/60">
                  <span className="badge badge-primary badge-soft badge-sm font-medium">{t(`${user.plan || "Explorer"} প্ল্যান`, `${user.plan || "Explorer"} plan`)}</span>
                  {user.joined && <span className="flex items-center gap-1"><HiCalendar /> {t(`${formatJoined(user.joined, lang)} থেকে`, `Since ${formatJoined(user.joined, lang)}`)}</span>}
                </div>
              </div>
              {accountNotice && (
                <div role="status" className="alert alert-success text-sm py-2 mt-4"><HiCheckCircle className="w-5 h-5" /> {accountNotice}</div>
              )}
              {editing === "profile" ? (
                <div className="mt-5"><EditProfileForm user={user} onDone={(saved) => finishEditing(saved && t("প্রোফাইল আপডেট হয়েছে।", "Profile updated."))} /></div>
              ) : editing === "password" ? (
                <div className="mt-5"><ChangePasswordForm onDone={(saved) => finishEditing(saved && t("পাসওয়ার্ড বদলানো হয়েছে।", "Password changed."))} /></div>
              ) : (
                <>
                  <ul className="mt-5 divide-y divide-base-300 rounded-box border border-base-300 bg-base-100 text-sm">
                    <InfoRow icon={HiMail} label={t("ইমেইল", "Email")} value={user.email} />
                    <InfoRow icon={HiPhone} label={t("ফোন", "Phone")} value={user.phone} />
                    <InfoRow icon={HiLocationMarker} label={t("নিজ জেলা", "Home district")} value={user.district && (DISTRICT_BY_SLUG.has(user.district) ? localDistrictName(DISTRICT_BY_SLUG.get(user.district), lang) : districtName(user.district))} />
                  </ul>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button type="button" onClick={() => startEditing("profile")} className="btn btn-primary btn-sm"><HiPencil /> {t("প্রোফাইল এডিট", "Edit profile")}</button>
                    <button type="button" onClick={() => startEditing("password")} className="btn btn-soft btn-sm"><HiKey /> {t("পাসওয়ার্ড", "Password")}</button>
                  </div>
                </>
              )}
              <div className="border-t border-base-300 mt-5 pt-3">
                <button type="button" onClick={logout} className="btn btn-ghost btn-sm w-full text-error hover:bg-error/10">
                  <FaSignOutAlt /> {t("লগআউট", "Log out")}
                </button>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="card bg-base-200 border border-base-300 p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <FaMedal className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-base-content text-sm">{t("৬৪ জেলা চ্যালেঞ্জ", "64-District Challenge")}</h2>
                <p className="text-xs text-base-content/60">{t(`আরও ${TOTAL_DISTRICTS - visitedCount}টি জেলা ঘোরা বাকি`, `${TOTAL_DISTRICTS - visitedCount} districts left to explore`)}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold text-primary leading-none">{visitedCount}</div>
                <div className="text-xs text-base-content/50">{t(`${TOTAL_DISTRICTS}টির মধ্যে`, `of ${TOTAL_DISTRICTS}`)}</div>
              </div>
            </div>
            <progress className="progress progress-primary w-full h-2.5 mt-4" value={visitedCount} max={TOTAL_DISTRICTS}></progress>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="font-medium text-base-content/70">{t(`${progress}% সম্পন্ন`, `${progress}% complete`)}</span>
              <span className="text-base-content/50">{confirmMode ? t("চেক-ইন করতে কোনো জেলায় ট্যাপ করুন", "Tap a district to check in") : t("চেক-ইন করতে কোনো জেলায় ক্লিক করুন", "Click a district to check in")}</span>
            </div>
          </div>

          {/* Visited list */}
          <div className="card bg-base-200 border border-base-300 p-5">
            <h3 className="font-bold text-base-content mb-3 text-sm">{t("ঘোরা জেলাসমূহ", "Visited Districts")}</h3>
            {visitedDistricts.length === 0 ? (
              <p className="text-sm text-base-content/40">{t("এখনো কোনো জেলায় চেক-ইন করা হয়নি।", "No districts checked in yet.")}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visitedDistricts.map((d) => (
                  <span key={d.slug} className="badge badge-success badge-outline">{localDistrictName(d, lang)}</span>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-2">
            <Link to="/frames" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <HiCamera className="w-6 h-6 text-primary mx-auto" />
              <div className="text-xs text-base-content mt-1">{t("ফ্রেম", "Frames")}</div>
            </Link>
            <Link to="/plans" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <FaSuitcaseRolling className="w-6 h-6 text-primary mx-auto" />
              <div className="text-xs text-base-content mt-1">{t("প্ল্যান", "Plans")}</div>
            </Link>
            <Link to="/membership" className="card bg-base-200 border border-base-300 p-3 text-center card-hover">
              <HiStar className="w-6 h-6 text-primary mx-auto" />
              <div className="text-xs text-base-content mt-1">{t("আপগ্রেড", "Upgrade")}</div>
            </Link>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 border border-base-300 p-4">
            {saveError && (
              <div role="alert" className="alert alert-error mb-3 text-sm" data-testid="checkin-error">
                <span>{saveError}</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSaveError("")}>{t("বন্ধ করুন", "Dismiss")}</button>
              </div>
            )}
            <div className="relative w-full" style={{ aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}` }}>
              {/* Click/tap a district (or Tab + Enter) to check in or out. */}
              <BangladeshMap
                districtClass={districtClass}
                className="absolute inset-0"
                onSelect={onDistrictClick}
                ariaLabel={districtAriaLabel}
                onHover={setHovered}
              />
            </div>
          </div>
          <p className="text-xs text-base-content/40 mt-2 text-center" aria-live="polite">
            {saving
              ? t("আপনার চেক-ইন সেভ হচ্ছে…", "Saving your check-ins…")
              : confirmMode
                ? t("কোনো জেলায় ট্যাপ করে নিশ্চিত করুন — ঘোরা হয়েছে বা হয়নি হিসেবে চিহ্নিত হবে।", "Tap a district, then confirm to mark it as visited or unvisited.")
                : t("যেকোনো জেলায় ক্লিক করে ঘোরা হয়েছে বা হয়নি হিসেবে চিহ্নিত করুন।", "Click any district to mark it as visited or unvisited.")}
          </p>
        </div>
      </div>

      <BookingsSection />
      <OrdersSection />

      {confirmMode && pendingDistrict && (
        <div
          className="fixed inset-x-0 bottom-0 z-[1100] px-4 pt-3 bg-base-200/95 backdrop-blur border-t border-base-300 shadow-2xl"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          role="dialog"
          aria-label={t("চেক-ইন নিশ্চিত করুন", "Confirm check-in")}
          data-testid="checkin-confirm"
        >
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <p className="flex-1 text-sm text-base-content">
              {pendingIsVisited
                ? t(`ঘোরা জেলার তালিকা থেকে ${localDistrictName(pendingDistrict, lang)} সরিয়ে দেবেন?`, `Remove ${districtName(pendingDistrict.name_en)} from your visited districts?`)
                : t(`${localDistrictName(pendingDistrict, lang)} ঘোরা হয়েছে হিসেবে চিহ্নিত করবেন?`, `Mark ${districtName(pendingDistrict.name_en)} as visited?`)}
            </p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingSlug(null)}>{t("বাতিল", "Cancel")}</button>
            <button type="button" className={`btn btn-sm ${pendingIsVisited ? "btn-error" : "btn-primary"}`} onClick={confirmPending}>
              {pendingIsVisited ? t("সরান", "Remove") : t("ঘোরা হয়েছে", "Mark visited")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingsSection() {
  const [attempt, setAttempt] = useState(0);
  return <MyBookings key={attempt} onRetry={() => setAttempt((n) => n + 1)} />;
}

function MyBookings({ onRetry }) {
  const { data: bookings, loading, error } = useFetch("/bookings/my");
  const { lang, t, pick } = useLang();

  return (
    <div id="bookings" className="card bg-base-200 border border-base-300 p-5 mt-6">
      <h2 className="font-bold text-base-content mb-3">{t("আমার বুকিং", "My bookings")}</h2>
      {loading ? (
        <Spinner label={t("আপনার বুকিং লোড হচ্ছে…", "Loading your bookings…")} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : asArray(bookings).length === 0 ? (
        <EmptyState
          message={t("এখনো কোনো বুকিং নেই।", "No bookings yet.")}
          action={<Link to="/plans" className="btn btn-primary btn-sm">{t("ট্রিপ প্ল্যান দেখুন", "Browse trip plans")}</Link>}
        />
      ) : (
        <div className="space-y-3">
          {asArray(bookings).map((b) => {
            const pay = PAYMENT_STATUS[b.paymentStatus] || PAYMENT_STATUS.unpaid;
            const status = BOOKING_STATUS[b.bookingStatus] || BOOKING_STATUS.pending;
            return (
              <div key={b._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-base-300/40 border border-base-300">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-base-content">{b.referenceCode}</span>
                    <span className={`badge badge-sm ${status.badge}`}>{pick(status, "label")}</span>
                    <span className={`badge badge-sm ${pay.badge}`}>{pick(pay, "label")}</span>
                  </div>
                  <p className="font-medium text-base-content mt-1 truncate">{pick(b, "planTitle")}</p>
                  <p className="text-xs text-base-content/50">
                    {b.start_date && `${formatDateRange(b.start_date, b.end_date, lang)} · `}{t(`${b.ticketCount}টি টিকিট`, `${b.ticketCount} ticket${b.ticketCount === 1 ? "" : "s"}`)} · {t(`মোট ${taka(b.totalAmount)}`, `${taka(b.totalAmount)} total`)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {hasTickets(b) && <Link to={`/bookings/${b.referenceCode}/tickets`} className="btn btn-sm btn-primary">{t("টিকিট", "Tickets")}</Link>}
                  <Link to={`/bookings/${b.referenceCode}/checkout`} className={`btn btn-sm ${canPay(b) ? "btn-primary" : "btn-ghost"}`}>
                    {canPay(b) ? t(`${taka(b.advanceAmount)} পরিশোধ করুন`, `Pay ${taka(b.advanceAmount)}`) : t("দেখুন", "View")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function OrdersSection() {
  const [attempt, setAttempt] = useState(0);
  return <MyOrders key={attempt} onRetry={() => setAttempt((n) => n + 1)} />;
}

function MyOrders({ onRetry }) {
  const { data: orders, loading, error } = useFetch("/orders/my");
  const { lang, t, pick } = useLang();

  return (
    <div id="orders" className="card bg-base-200 border border-base-300 p-5 mt-6">
      <h2 className="font-bold text-base-content mb-3">{t("আমার অর্ডার", "My orders")}</h2>
      {loading ? (
        <Spinner label={t("আপনার অর্ডার লোড হচ্ছে…", "Loading your orders…")} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : asArray(orders).length === 0 ? (
        <EmptyState
          message={t("এখনো কোনো অর্ডার নেই।", "No orders yet.")}
          action={<Link to="/shop" className="btn btn-primary btn-sm">{t("শপ ঘুরে দেখুন", "Browse the shop")}</Link>}
        />
      ) : (
        <div className="space-y-3">
          {asArray(orders).map((o) => {
            const pay = PAYMENT_STATUS[o.paymentStatus] || PAYMENT_STATUS.unpaid;
            const status = ORDER_STATUS[o.orderStatus] || ORDER_STATUS.pending;
            const payable = canPayOrder(o);
            return (
              <div key={o._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-base-300/40 border border-base-300">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-base-content">{o.referenceCode}</span>
                    <span className={`badge badge-sm ${status.badge}`}>{pick(status, "label")}</span>
                    <span className={`badge badge-sm ${pay.badge}`}>{pick(pay, "label")}</span>
                  </div>
                  <p className="font-medium text-base-content mt-1 truncate">{itemsSummary(o.items, lang)}</p>
                  <p className="text-xs text-base-content/50">
                    {pick(o.fulfilment === "pickup" ? FULFILMENT.pickup : FULFILMENT.delivery, "label")} · {t(`মোট ${taka(o.totalAmount)}`, `${taka(o.totalAmount)} total`)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to={payable ? `/orders/${o.referenceCode}/pay` : `/orders/${o.referenceCode}`} className={`btn btn-sm ${payable ? "btn-primary" : "btn-ghost"}`}>
                    {payable ? t(`${taka(o.advanceAmount)} পরিশোধ করুন`, `Pay ${taka(o.advanceAmount)}`) : t("দেখুন", "View")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
