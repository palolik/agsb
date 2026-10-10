import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useNow } from "../hooks/useNow";
import { apiSend } from "../lib/api";
import { taka, canPay, isHoldExpired, holdDeadline } from "../lib/booking";
import { BookingTotals, HoldExpired, bookingFetchState } from "./CheckoutPage";
import { HoldCountdown, PaymentMethodPicker, PaymentDetailsFields, paymentFormProblem, useRefetchOnFocus } from "../components/PaymentFields";
import { HiArrowLeft, HiCheckCircle } from "react-icons/hi";
import { asArray } from "../lib/safe";
import PageMeta from "../components/PageMeta";
import { useLang } from "../context/LanguageContext";

export default function PaymentPage() {
  const { id } = useParams();
  const { t, pick } = useLang();
  const { data: booking, loading, error, status, reload } = useFetch(`/bookings/${id}`);
  const { data: methods, loading: methodsLoading, error: methodsError, reload: reloadMethods } = useFetch("/payment-methods");
  const [selectedId, setSelectedId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [conflict, setConflict] = useState(""); // server message from a 409
  const deadline = done ? null : holdDeadline(booking);
  const now = useNow(1000, !!deadline);

  useRefetchOnFocus(reload, !done);

  // Background refetches keep the current booking on screen (and the form
  // filled in) instead of flashing the spinner.
  const pending = bookingFetchState({ loading: loading && !booking, error, status, reload, booking });
  const meta = <PageMeta noindex title={t("পেমেন্ট", "Payment")} />;
  if (pending) return <>{meta}{pending}</>;
  if (!done && isHoldExpired(booking, now)) return <>{meta}<HoldExpired booking={booking} message={conflict} /></>;
  if (!done && !canPay(booking, now)) {
    // A 409 (e.g. payment already submitted) reloaded the booking: keep the
    // server's message visible instead of silently redirecting.
    if (conflict) {
      return (
        <div className="max-w-lg mx-auto px-4 py-16">
          {meta}
          <div className="card bg-base-200 border border-base-300 p-8 text-center">
            <div role="alert" className="alert alert-error text-sm py-2">{conflict}</div>
            <Link to={`/bookings/${id}/checkout`} className="btn btn-primary mt-6">{t("বুকিং দেখুন", "View booking")}</Link>
          </div>
        </div>
      );
    }
    return <>{meta}<Navigate to={`/bookings/${id}/checkout`} replace /></>;
  }

  const selected = asArray(methods).find((m) => m._id === selectedId);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const problem = paymentFormProblem({ selected, senderNumber, transactionId }, t);
    if (problem) return setFormError(problem);
    setSubmitting(true);
    try {
      await apiSend(`/bookings/${booking._id}/payment`, "PUT", { paymentMethodId: selected._id, senderNumber, transactionId });
      setDone(true);
    } catch (err) {
      setFormError(err.message);
      // 409: hold expired or payment already submitted; reload so the page
      // shows the booking's real state.
      if (err.status === 409) {
        setConflict(err.message);
        reload();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        {meta}
        <div className="card bg-base-200 border border-base-300 p-8 text-center">
          <HiCheckCircle className="w-14 h-14 text-success mx-auto mb-3" />
          <h1 className="text-xl font-bold text-base-content">{t("পেমেন্ট জমা হয়েছে", "Payment submitted")}</h1>
          <p className="text-base-content/60 mt-2">
            {t(
              <>বুকিং <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span>। আমাদের টিম 24 ঘণ্টার মধ্যে আপনার {taka(booking.advanceAmount)} অগ্রিম যাচাই করে সিট নিশ্চিত করবে।</>,
              <>Booking <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span>. Our team will verify your {taka(booking.advanceAmount)} advance within 24 hours and confirm your seats.</>
            )}
          </p>
          <div className="flex flex-col gap-2 mt-6">
            <Link to={`/bookings/${id}/checkout`} className="btn btn-primary">{t("বুকিং দেখুন", "View booking")}</Link>
            <Link to="/profile" className="btn btn-ghost btn-sm">{t("আমার বুকিং", "My bookings")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <Link to={`/bookings/${id}/checkout`} className="btn btn-sm btn-ghost text-base-content/70 mb-4">
        <HiArrowLeft className="mr-1" /> {t("চেকআউটে ফিরে যান", "Back to checkout")}
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("অগ্রিম পরিশোধ করুন", "Pay advance")}</h1>
      <p className="text-base-content/60 mt-1">
        {t(
          <>নিচের যেকোনো একটি নম্বরে <span className="font-bold text-primary">{taka(booking.advanceAmount)}</span> পাঠান, তারপর ট্রানজেকশন আইডি লিখুন।</>,
          <>Send <span className="font-bold text-primary">{taka(booking.advanceAmount)}</span> to one of the numbers below, then enter your transaction ID.</>
        )}
      </p>
      {deadline && <div className="mt-3 max-w-2xl"><HoldCountdown deadline={deadline} now={now} /></div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-5">
          <PaymentMethodPicker
            methods={methods}
            loading={methodsLoading}
            error={methodsError}
            onRetry={reloadMethods}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <PaymentDetailsFields
            hint={selected
              ? t(
                <><span className="font-mono text-base-content">{selected.number}</span> ({selected.method}) নম্বরে {taka(booking.advanceAmount)} পাঠান এবং রেফারেন্স হিসেবে বুকিং রেফ <span className="font-mono text-base-content">{booking.referenceCode}</span> ব্যবহার করুন।</>,
                <>Send {taka(booking.advanceAmount)} to <span className="font-mono text-base-content">{selected.number}</span> ({selected.method}) and use booking ref <span className="font-mono text-base-content">{booking.referenceCode}</span> as the reference.</>
              )
              : t("আগে উপরে থেকে একটি মেথড বেছে নিন।", "Select a method above first.")}
            senderNumber={senderNumber}
            onSenderNumber={setSenderNumber}
            transactionId={transactionId}
            onTransactionId={setTransactionId}
          />
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 p-5 lg:sticky lg:top-24 space-y-4">
            <h2 className="font-bold text-base-content">{pick(booking, "planTitle")}</h2>
            <BookingTotals booking={booking} />
            {formError && <div className="alert alert-error text-sm py-2">{formError}</div>}
            <button type="submit" className="btn btn-primary w-full" disabled={submitting || methodsLoading || !asArray(methods).length}>
              {submitting ? <span className="loading loading-spinner loading-sm" /> : t("পেমেন্ট সম্পন্ন", "Payment done")}
            </button>
            <p className="text-xs text-base-content/40 text-center">{t("আমাদের টিম পেমেন্ট যাচাই করে, সাধারণত 24 ঘণ্টার মধ্যে।", "Payments are checked by our team, usually within 24 hours.")}</p>
          </div>
        </div>
      </form>
    </div>
  );
}
