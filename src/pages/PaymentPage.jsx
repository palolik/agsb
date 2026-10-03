import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { apiSend } from "../lib/api";
import { BD_PHONE, taka, canPay, isHoldExpired } from "../lib/booking";
import { BookingNotFound, BookingTotals, HoldExpired, HoldNotice } from "./CheckoutPage";
import { HiArrowLeft, HiClipboardCopy, HiCheck, HiCheckCircle, HiDeviceMobile } from "react-icons/hi";
import { asArray } from "../lib/safe";

export default function PaymentPage() {
  const { id } = useParams();
  const { data: booking, loading, error } = useFetch(`/bookings/${id}`);
  const { data: methods, loading: methodsLoading } = useFetch("/payment-methods");
  const [selectedId, setSelectedId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (loading || methodsLoading) return null;
  if (error || !booking) return <BookingNotFound />;
  if (!done && isHoldExpired(booking)) return <HoldExpired booking={booking} />;
  if (!done && !canPay(booking)) return <Navigate to={`/bookings/${id}/checkout`} replace />;

  const selected = asArray(methods).find((m) => m._id === selectedId);

  async function copyNumber(number) {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(number);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // clipboard blocked; the number is still visible to copy by hand
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!selected) return setFormError("Select a payment method");
    if (!BD_PHONE.test(senderNumber.replace(/[\s-]/g, ""))) return setFormError("Enter the number you sent the money from");
    if (!/^[A-Za-z0-9]{6,30}$/.test(transactionId.trim())) return setFormError("Enter the transaction ID from your payment SMS");
    setSubmitting(true);
    try {
      await apiSend(`/bookings/${id}/payment`, "PUT", { paymentMethodId: selected._id, senderNumber, transactionId });
      setDone(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="card bg-base-200 border border-base-300 p-8 text-center">
          <HiCheckCircle className="w-14 h-14 text-success mx-auto mb-3" />
          <h1 className="text-xl font-bold text-base-content">Payment submitted</h1>
          <p className="text-base-content/60 mt-2">
            Booking <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span>. Our team will verify your {taka(booking.advanceAmount)} advance within 24 hours and confirm your seats.
          </p>
          <div className="flex flex-col gap-2 mt-6">
            <Link to={`/bookings/${id}/checkout`} className="btn btn-primary">View booking</Link>
            <Link to="/profile" className="btn btn-ghost btn-sm">My bookings</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to={`/bookings/${id}/checkout`} className="btn btn-sm btn-ghost text-base-content/70 mb-4">
        <HiArrowLeft className="mr-1" /> Back to checkout
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold text-base-content">Pay advance</h1>
      <p className="text-base-content/60 mt-1">
        Send <span className="font-bold text-primary">{taka(booking.advanceAmount)}</span> to one of the numbers below, then enter your transaction ID.
      </p>
      <div className="mt-3 max-w-2xl"><HoldNotice booking={booking} /></div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card bg-base-200 border border-base-300 p-5">
            <h2 className="font-bold text-base-content mb-3">1. Choose a payment method</h2>
            {asArray(methods).length === 0 ? (
              <p className="text-sm text-base-content/50">No payment methods are available right now. Please contact us.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {asArray(methods).map((m) => (
                  <label
                    key={m._id}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors ${selectedId === m._id ? "border-primary bg-primary/10" : "border-base-300 bg-base-300/40 hover:border-primary/40"}`}
                  >
                    <input type="radio" name="method" className="sr-only" checked={selectedId === m._id} onChange={() => setSelectedId(m._id)} />
                    <div className="flex items-center gap-2">
                      <HiDeviceMobile className="w-5 h-5 text-primary shrink-0" />
                      <span className="font-bold text-base-content">{m.method}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="font-mono text-base-content">{m.number}</span>
                      <button type="button" className="btn btn-ghost btn-xs" aria-label={`Copy ${m.method} number`} onClick={(e) => { e.preventDefault(); copyNumber(m.number); }}>
                        {copied === m.number ? <HiCheck className="text-success" /> : <HiClipboardCopy />}
                      </button>
                    </div>
                    {m.extradetails && <p className="text-xs text-base-content/50 mt-1">{m.extradetails}</p>}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-base-200 border border-base-300 p-5">
            <h2 className="font-bold text-base-content mb-1">2. Enter payment details</h2>
            <p className="text-sm text-base-content/50 mb-3">
              {selected ? <>Send {taka(booking.advanceAmount)} to <span className="font-mono text-base-content">{selected.number}</span> ({selected.method}) and use booking ref <span className="font-mono text-base-content">{booking.referenceCode}</span> as the reference.</> : "Select a method above first."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label"><span className="label-text">Sent from number</span></label>
                <input type="tel" required placeholder="01XXXXXXXXX" className="input input-bordered bg-base-300 w-full" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} />
              </div>
              <div>
                <label className="label"><span className="label-text">Transaction ID (TrxID)</span></label>
                <input type="text" required placeholder="e.g. 9CF7A2B1XZ" className="input input-bordered bg-base-300 w-full font-mono uppercase" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 p-5 lg:sticky lg:top-24 space-y-4">
            <h2 className="font-bold text-base-content">{booking.planTitle_en}</h2>
            <BookingTotals booking={booking} />
            {formError && <div className="alert alert-error text-sm py-2">{formError}</div>}
            <button type="submit" className="btn btn-primary w-full" disabled={submitting || !asArray(methods).length}>
              {submitting ? <span className="loading loading-spinner loading-sm" /> : "Payment done"}
            </button>
            <p className="text-xs text-base-content/40 text-center">Payments are checked by our team, usually within 24 hours.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
