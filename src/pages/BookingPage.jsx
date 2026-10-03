import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { apiSend } from "../lib/api";
import { isBookable, formatDateRange, seatsLabel } from "../lib/planSchedule";
import { GENDERS, RELATIONS, MAX_TICKETS, BD_PHONE, taka, advanceFor, ADVANCE_RATE } from "../lib/booking";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import { HiArrowLeft, HiCalendar, HiUserGroup, HiMinus, HiPlus, HiUser, HiPhone } from "react-icons/hi";
import PageMeta from "../components/PageMeta";

const blankTraveller = { name: "", gender: "", phone: "", age: "", relation: "" };

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: plan, loading, error, status, reload } = useFetch(`/plans/${slug}`);
  const [count, setCount] = useState(1);
  const [travellers, setTravellers] = useState([
    { ...blankTraveller, name: user?.name || "", phone: user?.phone || "", relation: "self" },
  ]);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Keep one form per ticket, preserving what was already typed.
  useEffect(() => {
    setTravellers((prev) =>
      prev.length >= count
        ? prev.slice(0, count)
        : [...prev, ...Array.from({ length: count - prev.length }, () => ({ ...blankTraveller }))]
    );
  }, [count]);

  const meta = <PageMeta title={plan ? `বুকিং · Book: ${plan.title_en || plan.title_bn}` : "বুকিং · Book a trip"} description={plan ? `Book seats on ${plan.title_en || plan.title_bn}.` : undefined} image={plan?.image} />;
  if (loading) return <>{meta}<Spinner /></>;
  if (error && status !== 404) {
    return <>{meta}<div className="max-w-3xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div></>;
  }
  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {meta}
        <EmptyState
          message="প্ল্যানটি পাওয়া যায়নি · Travel plan not found. It may have ended or been removed."
          action={<Link to="/plans" className="btn btn-primary btn-sm"><HiArrowLeft className="mr-1" /> Back to Plans</Link>}
        />
      </div>
    );
  }

  const seatLimit = typeof plan.seats_available === "number" ? plan.seats_available : MAX_TICKETS;
  const maxTickets = Math.min(MAX_TICKETS, seatLimit);
  const bookable = isBookable(plan) && plan.price > 0 && maxTickets > 0;
  const total = (plan.price || 0) * count;
  const advance = advanceFor(total);

  const updateTraveller = (i, field, value) =>
    setTravellers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));

  function validate() {
    for (let i = 0; i < travellers.length; i++) {
      const t = travellers[i];
      const label = `Traveller ${i + 1}`;
      if (!t.name.trim()) return `${label}: enter a name`;
      if (!t.gender) return `${label}: select a gender`;
      if (!BD_PHONE.test(t.phone.replace(/[\s-]/g, ""))) return `${label}: enter a valid 11-digit phone number starting with 01`;
      const age = Number(t.age);
      if (t.age === "" || !Number.isInteger(age) || age < 0 || age > 120) return `${label}: enter a valid age`;
      if (!t.relation) return `${label}: select a relation`;
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
        travellers: travellers.map((t) => ({ ...t, age: Number(t.age) })),
        note,
      });
      navigate(`/bookings/${data.bookingId}/checkout`);
    } catch (err) {
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <Link to={`/plans/${plan.slug}`} className="btn btn-sm btn-ghost text-base-content/70 mb-4">
        <HiArrowLeft className="mr-1" /> Back to plan
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold text-base-content">টিকিট বুক করুন</h1>
      <p className="text-base-content/60 mt-1">{plan.title_bn} · {plan.title_en}</p>

      {!bookable ? (
        <div className="card bg-base-200 border border-base-300 p-8 mt-6 text-center">
          <h2 className="text-lg font-bold text-base-content">Booking is not available for this plan right now</h2>
          <p className="text-base-content/60 mt-1">It may be full, closed, or not yet priced for online booking.</p>
          <Link to="/contact" className="btn btn-primary btn-sm mt-4 mx-auto">Contact us</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Ticket count */}
            <div className="card bg-base-200 border border-base-300 p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-base-content">Number of tickets</h2>
                  <p className="text-sm text-base-content/50">{taka(plan.price)} per person · up to {maxTickets} per booking</p>
                </div>
                <div className="join">
                  <button type="button" className="btn join-item" aria-label="Fewer tickets" disabled={count <= 1} onClick={() => setCount((c) => c - 1)}><HiMinus /></button>
                  <span className="join-item flex items-center justify-center w-14 bg-base-300 font-bold text-lg text-base-content">{count}</span>
                  <button type="button" className="btn join-item" aria-label="More tickets" disabled={count >= maxTickets} onClick={() => setCount((c) => c + 1)}><HiPlus /></button>
                </div>
              </div>
            </div>

            {/* One form per ticket */}
            {travellers.map((t, i) => (
              <div key={i} className="card bg-base-200 border border-base-300 p-5">
                <h3 className="font-bold text-base-content mb-3">Traveller {i + 1}{i === 0 && <span className="text-base-content/40 font-normal text-sm"> · lead contact</span>}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="label"><span className="label-text">Name</span></label>
                    <label className="input input-bordered bg-base-300 w-full">
                      <HiUser className="w-5 h-5 shrink-0 text-base-content/40" />
                      <input type="text" required placeholder="Full name" value={t.name} onChange={(e) => updateTraveller(i, "name", e.target.value)} className="grow" />
                    </label>
                  </div>
                  <div>
                    <label className="label"><span className="label-text">Gender</span></label>
                    <select required className="select select-bordered bg-base-300 w-full" value={t.gender} onChange={(e) => updateTraveller(i, "gender", e.target.value)}>
                      <option value="">Select gender</option>
                      {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label"><span className="label-text">Phone</span></label>
                    <label className="input input-bordered bg-base-300 w-full">
                      <HiPhone className="w-5 h-5 shrink-0 text-base-content/40" />
                      <input type="tel" required placeholder="01712345678" value={t.phone} onChange={(e) => updateTraveller(i, "phone", e.target.value)} className="grow" />
                    </label>
                  </div>
                  <div>
                    <label className="label"><span className="label-text">Age</span></label>
                    <input type="number" required min="0" max="120" step="1" placeholder="Age" className="input input-bordered bg-base-300 w-full" value={t.age} onChange={(e) => updateTraveller(i, "age", e.target.value)} />
                  </div>
                  <div>
                    <label className="label"><span className="label-text">Relation</span></label>
                    <select required className="select select-bordered bg-base-300 w-full" value={t.relation} onChange={(e) => updateTraveller(i, "relation", e.target.value)}>
                      <option value="">Select relation</option>
                      {RELATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Note for the whole booking */}
            <div className="card bg-base-200 border border-base-300 p-5">
              <label className="label"><span className="label-text font-bold text-base-content">Note (optional)</span></label>
              <textarea
                className="textarea textarea-bordered bg-base-300 w-full h-28"
                maxLength={1000}
                placeholder="Food preferences, medical needs, pickup point, anything we should know"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="card bg-base-200 border border-base-300 p-5 lg:sticky lg:top-24 space-y-4">
              <h2 className="font-bold text-base-content">Booking summary</h2>
              <div className="space-y-2 text-sm text-base-content/70">
                {plan.start_date && <div className="flex items-center gap-2"><HiCalendar className="text-primary" /> {formatDateRange(plan.start_date, plan.end_date)}</div>}
                {seatsLabel(plan.seats_available) && <div className="flex items-center gap-2"><HiUserGroup className="text-primary" /> {seatsLabel(plan.seats_available)}</div>}
              </div>
              <div className="border-t border-base-300 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-base-content/70"><span>{taka(plan.price)} × {count}</span><span>{taka(total)}</span></div>
                <div className="flex justify-between font-bold text-base-content"><span>Total</span><span>{taka(total)}</span></div>
                <div className="flex justify-between text-primary font-medium"><span>Advance now ({Math.round(ADVANCE_RATE * 100)}%)</span><span>{taka(advance)}</span></div>
                <div className="flex justify-between text-base-content/60"><span>Pay on arrival</span><span>{taka(total - advance)}</span></div>
              </div>
              {formError && <div className="alert alert-error text-sm py-2">{formError}</div>}
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-sm" /> : "Confirm booking"}
              </button>
              <p className="text-xs text-base-content/40 text-center">Seats are held once you confirm. Pay the advance on the next step.</p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
