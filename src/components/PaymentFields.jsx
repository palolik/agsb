import { useEffect, useState } from "react";
import { HiClipboardCopy, HiCheck, HiClock, HiDeviceMobile, HiExclamation } from "react-icons/hi";
import { BD_PHONE, formatHoldTime, formatCountdown } from "../lib/booking";
import { asArray } from "../lib/safe";
import { useLang } from "../context/LanguageContext";
import { Spinner, ErrorState } from "./StateViews";

// Payment UI shared by trip bookings (PaymentPage) and shop orders
// (OrderPaymentPage): send money by mobile banking, then enter the sender
// number and TrxID for the team to verify.

// Warn harder in the last few minutes so nobody sends money just before the
// hold runs out.
const HOLD_WARN_MS = 5 * 60_000;

// Live "mm:ss left" for a seat / stock hold. Pass the text props already
// localized; in Bangla `what` reads like "সিট হোল্ডের সময়" ("আপনার … প্রায়
// শেষ") and `againLabel` like "আবার বুক করুন" ("বরং …").
export function HoldCountdown({ deadline, now, what, released, againLabel }) {
  const { lang, t } = useLang();
  what ??= t("সিট হোল্ডের সময়", "seat hold");
  released ??= t("এরপর আপনার সিট ছেড়ে দেওয়া হবে।", "Your seats are released after that.");
  againLabel ??= t("আবার বুক করুন", "book again");
  const left = deadline.getTime() - now;
  const urgent = left < HOLD_WARN_MS;
  return (
    <div role="status" className={`alert text-sm py-2 ${urgent ? "alert-error" : "alert-warning"}`}>
      {urgent ? <HiExclamation className="w-5 h-5 shrink-0" /> : <HiClock className="w-5 h-5 shrink-0" />}
      {lang === "bn" ? (
        <span>
          পেমেন্ট করতে আর <span className="font-mono font-bold">{formatCountdown(left)}</span> বাকি ({formatHoldTime(deadline, lang)} পর্যন্ত)।
          {urgent ? ` আপনার ${what} প্রায় শেষ; সময়মতো শেষ করতে না পারলে টাকা পাঠাবেন না — বরং ${againLabel}।` : ` ${released}`}
        </span>
      ) : (
        <span>
          <span className="font-mono font-bold">{formatCountdown(left)}</span> left to pay (until {formatHoldTime(deadline)}).
          {urgent ? ` Your ${what} is almost over; if you can't finish in time, don't send money — ${againLabel} instead.` : ` ${released}`}
        </span>
      )}
    </div>
  );
}

// Refetch when the tab comes back into view (the hold may have run out, or
// payment been submitted elsewhere, while it was in the background).
export function useRefetchOnFocus(reload, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    let last = 0;
    const refresh = () => {
      // focus and visibilitychange usually fire together; refetch once.
      if (document.visibilityState !== "visible" || Date.now() - last < 2000) return;
      last = Date.now();
      reload();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, reload]);
}

// Validates sender number and TrxID; returns an error message or "".
// Pass `t` from useLang() for localized messages (English without it).
export function paymentFormProblem({ selected, senderNumber, transactionId }, t = (bn, en) => en) {
  if (!selected) return t("একটি পেমেন্ট মেথড বেছে নিন", "Select a payment method");
  if (!BD_PHONE.test(senderNumber.replace(/[\s-]/g, ""))) return t("যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি লিখুন", "Enter the number you sent the money from");
  if (!/^[A-Za-z0-9]{6,30}$/.test(transactionId.trim())) return t("পেমেন্টের SMS থেকে ট্রানজেকশন আইডি লিখুন", "Enter the transaction ID from your payment SMS");
  return "";
}

// "1. Choose a payment method" card with copyable numbers.
export function PaymentMethodPicker({ methods, loading, error, onRetry, selectedId, onSelect }) {
  const { t } = useLang();
  const [copied, setCopied] = useState("");

  async function copyNumber(number) {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(number);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // clipboard blocked; the number is still visible to copy by hand
    }
  }

  return (
    <div className="card bg-base-200 border border-base-300 p-5">
      <h2 className="font-bold text-base-content mb-3">{t("1. পেমেন্ট মেথড বেছে নিন", "1. Choose a payment method")}</h2>
      {loading ? (
        <Spinner label={t("পেমেন্ট মেথড লোড হচ্ছে…", "Loading payment methods…")} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : asArray(methods).length === 0 ? (
        <p className="text-sm text-base-content/50">{t("এই মুহূর্তে কোনো পেমেন্ট মেথড নেই। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।", "No payment methods are available right now. Please contact us.")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {asArray(methods).map((m) => (
            <label
              key={m._id}
              className={`cursor-pointer rounded-xl border p-4 transition-colors ${selectedId === m._id ? "border-primary bg-primary/10" : "border-base-300 bg-base-300/40 hover:border-primary/40"}`}
            >
              <input type="radio" name="method" className="sr-only" checked={selectedId === m._id} onChange={() => onSelect(m._id)} />
              <div className="flex items-center gap-2">
                <HiDeviceMobile className="w-5 h-5 text-primary shrink-0" />
                <span className="font-bold text-base-content">{m.method}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <span className="font-mono text-base-content">{m.number}</span>
                <button type="button" className="btn btn-ghost btn-xs" aria-label={t(`${m.method} নম্বর কপি করুন`, `Copy ${m.method} number`)} onClick={(e) => { e.preventDefault(); copyNumber(m.number); }}>
                  {copied === m.number ? <HiCheck className="text-success" /> : <HiClipboardCopy />}
                </button>
              </div>
              {m.extradetails && <p className="text-xs text-base-content/50 mt-1">{m.extradetails}</p>}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// "2. Enter payment details" card. `hint` explains what to send where.
export function PaymentDetailsFields({ hint, senderNumber, onSenderNumber, transactionId, onTransactionId }) {
  const { t } = useLang();
  return (
    <div className="card bg-base-200 border border-base-300 p-5">
      <h2 className="font-bold text-base-content mb-1">{t("2. পেমেন্টের তথ্য দিন", "2. Enter payment details")}</h2>
      <p className="text-sm text-base-content/50 mb-3">{hint}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="pay-sender"><span className="label-text">{t("যে নম্বর থেকে পাঠিয়েছেন", "Sent from number")}</span></label>
          <input id="pay-sender" type="tel" required placeholder="01712345678" className="input input-bordered bg-base-300 w-full" value={senderNumber} onChange={(e) => onSenderNumber(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pay-trx"><span className="label-text">{t("ট্রানজেকশন আইডি (TrxID)", "Transaction ID (TrxID)")}</span></label>
          <input id="pay-trx" type="text" required placeholder={t("যেমন 9CF7A2B1XZ", "e.g. 9CF7A2B1XZ")} className="input input-bordered bg-base-300 w-full font-mono uppercase" value={transactionId} onChange={(e) => onTransactionId(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
