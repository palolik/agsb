import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { apiSend } from "../lib/api";
import { isBookable, hasStarted, formatDateRange } from "../lib/planSchedule";
import { GENDERS, RELATIONS, MAX_TICKETS, BD_PHONE, taka, advanceFor, ADVANCE_RATE } from "../lib/booking";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import { HiArrowLeft, HiCalendar, HiMinus, HiPlus, HiUser, HiPhone } from "react-icons/hi";
import PageMeta from "../components/PageMeta";
import SeatsMeter from "../components/SeatsMeter";
import { useLang } from "../context/LanguageContext";

const blankTraveller = { name: "", gender: "", phone: "", age: "", relation: "" };

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t, pick } = useLang();
  const { data: plan, loading, error, status, reload } = useFetch(`/plans/${slug}`);
  const [count, setCount] = useState(1);
  const [travellers, setTravellers] = useState([
    { ...blankTraveller, name: user?.name || "", phone: user?.phone || "", relation: "self" },
  ]);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discount, description } once applied
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // Keep one form per ticket, preserving what was already typed.
  useEffect(() => {
    setTravellers((prev) =>
      prev.length >= count
        ? prev.slice(0, count)
        : [...prev, ...Array.from({ length: count - prev.length }, () => ({ ...blankTraveller }))]
    );
  }, [count]);

  // The discount depends on the ticket count, so a changed count needs a re-apply.
  useEffect(() => {
    setCoupon(null);
  }, [count]);

  const meta = (
    <PageMeta
      title={plan ? t(`বুকিং: ${pick(plan, "title")}`, `Book: ${plan.title_en || plan.title_bn}`) : t("ট্রিপ বুক করুন", "Book a trip")}
      description={plan ? t(`${pick(plan, "title")} — সিট বুক করুন।`, `Book seats on ${plan.title_en || plan.title_bn}.`) : undefined}
      image={plan?.image}
    />
  );
  if (loading) return <>{meta}<Spinner /></>;
  if (error && status !== 404) {
    return <>{meta}<div className="max-w-3xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div></>;
  }
  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {meta}
        <EmptyState
          message={t("প্ল্যানটি পাওয়া যায়নি। এটি শেষ হয়ে গেছে বা সরিয়ে ফেলা হয়েছে।", "Travel plan not found. It may have ended or been removed.")}
          action={<Link to="/plans" className="btn btn-primary btn-sm"><HiArrowLeft className="mr-1" /> {t("প্ল্যানে ফিরে যান", "Back to Plans")}</Link>}
        />
      </div>
    );
  }

  const seatLimit = typeof plan.seats_available === "number" ? plan.seats_available : MAX_TICKETS;
  const maxTickets = Math.min(MAX_TICKETS, seatLimit);
  const bookable = isBookable(plan) && plan.price > 0 && maxTickets > 0;
  const subtotal = (plan.price || 0) * count;
  const discount = coupon ? coupon.discount : 0;
  const total = subtotal - discount;
  const advance = advanceFor(total);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCouponError("");
    if (!code) return;
    setCheckingCoupon(true);
    try {
      const data = await apiSend("/coupons/check", "POST", { code, planSlug: plan.slug, ticketCount: count });
      setCoupon({ code: data.code, discount: data.discount, description: data.description });
    } catch (err) {
      setCoupon(null);
      setCouponError(err.message);
    } finally {
      setCheckingCoupon(false);
    }
  }

  const removeCoupon = () => { setCoupon(null); setCouponInput(""); setCouponError(""); };

  const updateTraveller = (i, field, value) =>
    setTravellers((prev) => prev.map((tr, idx) => (idx === i ? { ...tr, [field]: value } : tr)));

  function validate() {
    for (let i = 0; i < travellers.length; i++) {
      const tr = travellers[i];
      const label = t(`যাত্রী ${i + 1}`, `Traveller ${i + 1}`);
      if (!tr.name.trim()) return `${label}: ${t("নাম লিখুন", "enter a name")}`;
      if (!tr.gender) return `${label}: ${t("লিঙ্গ বেছে নিন", "select a gender")}`;
      if (!BD_PHONE.test(tr.phone.replace(/[\s-]/g, ""))) return `${label}: ${t("01 দিয়ে শুরু হওয়া সঠিক 11 সংখ্যার ফোন নম্বর লিখুন", "enter a valid 11-digit phone number starting with 01")}`;
      const age = Number(tr.age);
      if (tr.age === "" || !Number.isInteger(age) || age < 0 || age > 120) return `${label}: ${t("সঠিক বয়স লিখুন", "enter a valid age")}`;
      if (!tr.relation) return `${label}: ${t("সম্পর্ক বেছে নিন", "select a relation")}`;
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiSend("/bookings", "POST", {
        planSlug: plan.slug,
        ticketCount: count,
        travellers: travellers.map((tr) => ({ ...tr, age: Number(tr.age) })),
        note,
        ...(coupon ? { couponCode: coupon.code } : {}),
      });
      navigate(`/bookings/${data.referenceCode}/checkout`);
    } catch (err) {
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <Link to={`/plans/${plan.slug}`} className="btn btn-sm btn-ghost text-base-content/70 mb-4">
        <HiArrowLeft className="mr-1" /> {t("প্ল্যানে ফিরে যান", "Back to plan")}
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("টিকিট বুক করুন", "Book tickets")}</h1>
      <p className="text-base-content/60 mt-1">{pick(plan, "title")}</p>

      {!bookable ? (
        <div className="card bg-base-200 border border-base-300 p-8 mt-6 text-center">
          <h2 className="text-lg font-bold text-base-content">{t("এই প্ল্যানে এখন বুকিং করা যাচ্ছে না", "Booking is not available for this plan right now")}</h2>
          <p className="text-base-content/60 mt-1">
            {hasStarted(plan) ? t("এই ট্রিপ ইতিমধ্যে শুরু হয়ে গেছে।", "This trip has already started.") : t("সিট পূর্ণ, বুকিং বন্ধ, অথবা অনলাইন বুকিংয়ের জন্য এখনো দাম ঠিক হয়নি।", "It may be full, closed, or not yet priced for online booking.")}
          </p>
          <Link to="/contact" className="btn btn-primary btn-sm mt-4 mx-auto">{t("যোগাযোগ করুন", "Contact us")}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Ticket count */}
            <div className="card bg-base-200 border border-base-300 p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-base-content">{t("টিকিটের সংখ্যা", "Number of tickets")}</h2>
                  <p className="text-sm text-base-content/50">{t(`জনপ্রতি ${taka(plan.price)} · প্রতি বুকিংয়ে সর্বোচ্চ ${maxTickets}টি`, `${taka(plan.price)} per person · up to ${maxTickets} per booking`)}</p>
                </div>
                <div className="join">
                  <button type="button" className="btn join-item" aria-label={t("টিকিট কমান", "Fewer tickets")} disabled={count <= 1} onClick={() => setCount((c) => c - 1)}><HiMinus /></button>
                  <span className="join-item flex items-center justify-center w-14 bg-base-300 font-bold text-lg text-base-content">{count}</span>
                  <button type="button" className="btn join-item" aria-label={t("টিকিট বাড়ান", "More tickets")} disabled={count >= maxTickets} onClick={() => setCount((c) => c + 1)}><HiPlus /></button>
                </div>
              </div>
            </div>

            {/* One form per ticket */}
            {travellers.map((tr, i) => (
              <div key={i} className="card bg-base-200 border border-base-300 p-5">
                <h3 className="font-bold text-base-content mb-3">{t(`যাত্রী ${i + 1}`, `Traveller ${i + 1}`)}{i === 0 && <span className="text-base-content/40 font-normal text-sm"> · {t("প্রধান যোগাযোগ", "lead contact")}</span>}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="label"><span className="label-text">{t("নাম", "Name")}</span></label>
                    <label className="input input-bordered bg-base-300 w-full">
                      <HiUser className="w-5 h-5 shrink-0 text-base-content/40" />
                      <input type="text" required placeholder={t("পূর্ণ নাম", "Full name")} value={tr.name} onChange={(e) => updateTraveller(i, "name", e.target.value)} className="grow" />
                    </label>
                  </div>
                  <div>
                    <label className="label"><span className="label-text">{t("লিঙ্গ", "Gender")}</span></label>
                    <select required className="select select-bordered bg-base-300 w-full" value={tr.gender} onChange={(e) => updateTraveller(i, "gender", e.target.value)}>
                      <option value="">{t("লিঙ্গ বেছে নিন", "Select gender")}</option>
                      {GENDERS.map((g) => <option key={g.value} value={g.value}>{pick(g, "label")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label"><span className="label-text">{t("ফোন", "Phone")}</span></label>
                    <label className="input input-bordered bg-base-300 w-full">
                      <HiPhone className="w-5 h-5 shrink-0 text-base-content/40" />
                      <input type="tel" required placeholder="01712345678" value={tr.phone} onChange={(e) => updateTraveller(i, "phone", e.target.value)} className="grow" />
                    </label>
                  </div>
                  <div>
                    <label className="label"><span className="label-text">{t("বয়স", "Age")}</span></label>
                    <input type="number" required min="0" max="120" step="1" placeholder={t("বয়স", "Age")} className="input input-bordered bg-base-300 w-full" value={tr.age} onChange={(e) => updateTraveller(i, "age", e.target.value)} />
                  </div>
                  <div>
                    <label className="label"><span className="label-text">{t("সম্পর্ক", "Relation")}</span></label>
                    <select required className="select select-bordered bg-base-300 w-full" value={tr.relation} onChange={(e) => updateTraveller(i, "relation", e.target.value)}>
                      <option value="">{t("সম্পর্ক বেছে নিন", "Select relation")}</option>
                      {RELATIONS.map((r) => <option key={r.value} value={r.value}>{pick(r, "label")}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Note for the whole booking */}
            <div className="card bg-base-200 border border-base-300 p-5">
              <label className="label"><span className="label-text font-bold text-base-content">{t("নোট (ঐচ্ছিক)", "Note (optional)")}</span></label>
              <textarea
                className="textarea textarea-bordered bg-base-300 w-full h-28"
                maxLength={1000}
                placeholder={t("খাবারের পছন্দ, চিকিৎসা-সংক্রান্ত প্রয়োজন, পিকআপ পয়েন্ট — আমাদের যা জানা দরকার", "Food preferences, medical needs, pickup point, anything we should know")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="card bg-base-200 border border-base-300 p-5 lg:sticky lg:top-24 space-y-4">
              <h2 className="font-bold text-base-content">{t("বুকিং সারসংক্ষেপ", "Booking summary")}</h2>
              <div className="space-y-2 text-sm text-base-content/70">
                {plan.start_date && <div className="flex items-center gap-2"><HiCalendar className="text-primary" /> {formatDateRange(plan.start_date, plan.end_date, lang)}</div>}
                <SeatsMeter plan={plan} />
              </div>
              <div className="border-t border-base-300 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-base-content/70"><span>{taka(plan.price)} × {count}</span><span>{taka(subtotal)}</span></div>
                {coupon && <div className="flex justify-between text-success"><span>{t("কুপন", "Coupon")} {coupon.code}</span><span>−{taka(coupon.discount)}</span></div>}
                <div className="flex justify-between font-bold text-base-content"><span>{t("মোট", "Total")}</span><span>{taka(total)}</span></div>
                <div className="flex justify-between text-primary font-medium"><span>{t("এখন অগ্রিম", "Advance now")} ({Math.round(ADVANCE_RATE * 100)}%)</span><span>{taka(advance)}</span></div>
                <div className="flex justify-between text-base-content/60"><span>{t("পৌঁছে পরিশোধ", "Pay on arrival")}</span><span>{taka(total - advance)}</span></div>
              </div>
              <div className="border-t border-base-300 pt-3">
                {coupon ? (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-success">{t(<>কুপন <strong>{coupon.code}</strong> প্রয়োগ হয়েছে</>, <>Coupon <strong>{coupon.code}</strong> applied</>)}{coupon.description ? ` · ${coupon.description}` : ""}</span>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={removeCoupon}>{t("সরান", "Remove")}</button>
                  </div>
                ) : (
                  <>
                    <label className="label py-1" htmlFor="booking-coupon"><span className="label-text text-sm">{t("কুপন কোড", "Coupon code")}</span></label>
                    <div className="join w-full">
                      <input
                        id="booking-coupon"
                        className="input input-bordered input-sm bg-base-300 join-item w-full uppercase"
                        maxLength={30}
                        placeholder={t("ঐচ্ছিক", "Optional")}
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); if (couponError) setCouponError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                      />
                      <button type="button" className="btn btn-sm join-item" disabled={checkingCoupon || !couponInput.trim()} onClick={applyCoupon}>
                        {checkingCoupon ? <span className="loading loading-spinner loading-xs" /> : t("প্রয়োগ করুন", "Apply")}
                      </button>
                    </div>
                    {couponError && <p className="text-error text-xs mt-1">{couponError}</p>}
                  </>
                )}
              </div>
              {formError && <div className="alert alert-error text-sm py-2">{formError}</div>}
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-sm" /> : t("বুকিং নিশ্চিত করুন", "Confirm booking")}
              </button>
              <p className="text-xs text-base-content/40 text-center">{t("নিশ্চিত করলেই সিট আপনার জন্য রাখা হবে। পরের ধাপে অগ্রিম পরিশোধ করুন।", "Seats are held once you confirm. Pay the advance on the next step.")}</p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
