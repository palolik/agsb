import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { formatDateRange } from "../lib/planSchedule";
import { GENDERS, RELATIONS, PAYMENT_STATUS, BOOKING_STATUS, ADVANCE_RATE, taka, canPay, hasTickets, isHoldExpired, holdDeadline, formatHoldTime } from "../lib/booking";
import { asArray } from "../lib/safe";
import { HiCalendar, HiUserGroup, HiLockClosed, HiClock, HiExclamation } from "react-icons/hi";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import { useLang } from "../context/LanguageContext";

// Shown instead of the payment form once an unpaid booking's seat hold ran out.
export function HoldExpired({ booking, message }) {
  const { t } = useLang();
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="card bg-base-200 border border-base-300 p-8 text-center">
        {message && <div role="alert" className="alert alert-error text-sm py-2 mb-4">{message}</div>}
        <HiExclamation className="w-14 h-14 text-warning mx-auto mb-3" />
        <h1 className="text-xl font-bold text-base-content">{t("সিট হোল্ডের সময় শেষ", "Seat hold expired")}</h1>
        <p className="text-base-content/70 mt-1 font-medium">{t("আপনার সিট হোল্ডের মেয়াদ শেষ হয়ে গেছে — অনুগ্রহ করে আবার বুক করুন", "Your seat hold expired — please book again")}</p>
        <p className="text-sm text-base-content/50 mt-2">
          {t("বুকিং", "Booking")} <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span> {t("সময়মতো পরিশোধ না হওয়ায় এর সিটগুলো ছেড়ে দেওয়া হয়েছে।", "wasn't paid in time, so its seats were released.")}
        </p>
        <div className="flex flex-col gap-2 mt-6">
          {booking.planSlug
            ? <Link to={`/plans/${booking.planSlug}`} className="btn btn-primary">{t("আবার বুক করুন", "Book again")}</Link>
            : <Link to="/plans" className="btn btn-primary">{t("ট্রিপ প্ল্যানগুলো দেখুন", "Browse trip plans")}</Link>}
          <Link to="/profile" className="btn btn-ghost btn-sm">{t("আমার বুকিং", "My bookings")}</Link>
        </div>
      </div>
    </div>
  );
}

// "Complete payment by …" while an unpaid booking still holds its seats.
export function HoldNotice({ booking }) {
  const { lang, t } = useLang();
  const deadline = holdDeadline(booking);
  if (!deadline) return null;
  return (
    <div role="status" className="alert alert-warning text-sm py-2">
      <HiClock className="w-5 h-5 shrink-0" />
      <span>{lang === "bn"
        ? <>সিট ধরে রাখতে <span className="font-bold">{formatHoldTime(deadline, lang)}</span>-এর মধ্যে পেমেন্ট সম্পন্ন করুন।</>
        : <>Complete payment by <span className="font-bold">{formatHoldTime(deadline, lang)}</span> to keep your seats.</>}</span>
    </div>
  );
}

const labelOf = (list, value, pick) => {
  const item = list.find((x) => x.value === value);
  return item ? pick(item, "label") : value;
};

export function BookingNotFound() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <EmptyState
        message={t("বুকিংটি পাওয়া যায়নি।", "Booking not found.")}
        action={<Link to="/profile" className="btn btn-primary btn-sm">{t("আমার বুকিংয়ে যান", "Go to my bookings")}</Link>}
      />
    </div>
  );
}

// Loading / error / not-found handling shared by the checkout and payment
// pages. Returns an element to render, or null once the booking is ready.
// 400 (malformed id) and 404 both mean "no such booking"; anything else is
// a real failure the user can retry.
export function bookingFetchState({ loading, error, status, reload, booking }) {
  if (loading) return <Spinner />;
  if (error && status !== 404 && status !== 400) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div>;
  }
  if (!booking) return <BookingNotFound />;
  return null;
}

export function BookingTotals({ booking }) {
  const { t } = useLang();
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between text-base-content/70"><span>{taka(booking.pricePerPerson)} × {booking.ticketCount}</span><span>{taka(booking.subtotalAmount ?? booking.totalAmount)}</span></div>
      {booking.discountAmount > 0 && (
        <div className="flex justify-between text-success"><span>{t("কুপন", "Coupon")} {booking.coupon?.code}</span><span>−{taka(booking.discountAmount)}</span></div>
      )}
      <div className="flex justify-between font-bold text-base-content"><span>{t("মোট", "Total")}</span><span>{taka(booking.totalAmount)}</span></div>
      <div className="flex justify-between text-primary font-medium"><span>{t("অগ্রিম", "Advance")} ({Math.round(ADVANCE_RATE * 100)}%)</span><span>{taka(booking.advanceAmount)}</span></div>
      <div className="flex justify-between text-base-content/60"><span>{t("পৌঁছে পরিশোধ", "Pay on arrival")}</span><span>{taka(booking.totalAmount - booking.advanceAmount)}</span></div>
      {booking.paidAmount > 0 && (
        <div className="flex justify-between text-success border-t border-base-300 pt-1.5"><span>{t("এ পর্যন্ত পরিশোধিত", "Paid so far")}</span><span>{taka(booking.paidAmount)}</span></div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { id } = useParams();
  const { data: booking, loading, error, status, reload } = useFetch(`/bookings/${id}`);
  const { lang, t, pick } = useLang();

  const pending = bookingFetchState({ loading, error, status, reload, booking });
  const meta = <PageMeta noindex title={t("চেকআউট", "Checkout")} />;
  if (pending) return <>{meta}{pending}</>;
  if (isHoldExpired(booking)) return <>{meta}<HoldExpired booking={booking} /></>;

  const payStatus = PAYMENT_STATUS[booking.paymentStatus] || PAYMENT_STATUS.unpaid;
  const bookStatus = BOOKING_STATUS[booking.bookingStatus] || BOOKING_STATUS.pending;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("চেকআউট", "Checkout")}</h1>
          <p className="text-base-content/60 mt-1">{t("বুকিং রেফ", "Booking ref")} <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span></p>
        </div>
        <div className="flex gap-2">
          <span className={`badge ${bookStatus.badge}`}>{pick(bookStatus, "label")}</span>
          <span className={`badge ${payStatus.badge}`}>{pick(payStatus, "label")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card bg-base-200 border border-base-300 p-5">
            <h2 className="text-lg font-bold text-base-content">{pick(booking, "planTitle")}</h2>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-base-content/70">
              {booking.start_date && <span className="flex items-center gap-1.5"><HiCalendar className="text-primary" /> {formatDateRange(booking.start_date, booking.end_date, lang)}</span>}
              <span className="flex items-center gap-1.5"><HiUserGroup className="text-primary" /> {booking.ticketCount} {t("টি টিকিট", booking.ticketCount === 1 ? "ticket" : "tickets")}</span>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300 p-5">
            <h2 className="font-bold text-base-content mb-3">{t("যাত্রী", "Travellers")}</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-base-content/50"><th>#</th><th>{t("নাম", "Name")}</th><th>{t("লিঙ্গ", "Gender")}</th><th>{t("বয়স", "Age")}</th><th>{t("ফোন", "Phone")}</th><th>{t("সম্পর্ক", "Relation")}</th></tr>
                </thead>
                <tbody>
                  {asArray(booking.travellers).map((tr, i) => (
                    <tr key={i} className="border-base-300">
                      <td>{i + 1}</td>
                      <td className="font-medium text-base-content">{tr.name}</td>
                      <td>{labelOf(GENDERS, tr.gender, pick)}</td>
                      <td>{tr.age}</td>
                      <td>{tr.phone}</td>
                      <td>{labelOf(RELATIONS, tr.relation, pick)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {booking.note && (
              <div className="mt-4 p-3 rounded-lg bg-base-300/50 text-sm text-base-content/70">
                <span className="font-medium text-base-content">{t("নোট: ", "Note: ")}</span>{booking.note}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 p-5 lg:sticky lg:top-24 space-y-4">
            <h2 className="font-bold text-base-content">{t("পেমেন্ট", "Payment")}</h2>
            <BookingTotals booking={booking} />
            {canPay(booking) ? (
              <>
                <HoldNotice booking={booking} />
                <Link to={`/bookings/${booking.referenceCode}/pay`} className="btn btn-primary w-full">
                  <HiLockClosed className="mr-1" /> {t("এখনই পরিশোধ করুন", "Pay now")} · {taka(booking.advanceAmount)}
                </Link>
                <p className="text-xs text-base-content/40 text-center">{t(`সিট নিশ্চিত করতে এখন ${Math.round(ADVANCE_RATE * 100)}% পরিশোধ করুন। বাকিটা পৌঁছানোর পর দিতে হবে।`, `Pay ${Math.round(ADVANCE_RATE * 100)}% now to confirm your seats. The rest is paid when you arrive.`)}</p>
              </>
            ) : (
              <div className="text-sm text-base-content/60">
                {booking.paymentStatus === "pending_verification" && t("আমরা আপনার পেমেন্টের তথ্য পেয়েছি, ২৪ ঘণ্টার মধ্যে যাচাই করা হবে।", "We received your payment details and will verify them within 24 hours.")}
                {booking.paymentStatus === "advance_paid" && t("আপনার অগ্রিম যাচাই হয়েছে। বাকিটা পৌঁছে পরিশোধ করুন।", "Your advance is verified. Pay the rest on arrival.")}
                {booking.paymentStatus === "paid_full" && t("সম্পূর্ণ পরিশোধিত। শুভ যাত্রা!", "Fully paid. Have a great trip!")}
                {booking.bookingStatus === "cancelled" && t("এই বুকিংটি বাতিল করা হয়েছে।", "This booking was cancelled.")}
              </div>
            )}
            {hasTickets(booking) && (
              <Link to={`/bookings/${booking.referenceCode}/tickets`} className="btn btn-primary w-full">{t("টিকিট দেখুন", "View tickets")}</Link>
            )}
            <Link to="/profile" className="btn btn-ghost btn-sm w-full">{t("আমার বুকিং", "My bookings")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
