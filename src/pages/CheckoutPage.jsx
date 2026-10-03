import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { formatDateRange } from "../lib/planSchedule";
import { GENDERS, RELATIONS, PAYMENT_STATUS, BOOKING_STATUS, ADVANCE_RATE, taka, canPay, isHoldExpired, holdDeadline, formatHoldTime } from "../lib/booking";
import { asArray } from "../lib/safe";
import { HiCalendar, HiUserGroup, HiLockClosed, HiClock, HiExclamation } from "react-icons/hi";

// Shown instead of the payment form once an unpaid booking's seat hold ran out.
export function HoldExpired({ booking }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="card bg-base-200 border border-base-300 p-8 text-center">
        <HiExclamation className="w-14 h-14 text-warning mx-auto mb-3" />
        <h1 className="text-xl font-bold text-base-content">সিট হোল্ডের সময় শেষ</h1>
        <p className="text-base-content/70 mt-1 font-medium">Your seat hold expired — please book again</p>
        <p className="text-sm text-base-content/50 mt-2">
          Booking <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span> wasn't paid in time, so its seats were released.
        </p>
        <div className="flex flex-col gap-2 mt-6">
          {booking.planSlug
            ? <Link to={`/plans/${booking.planSlug}`} className="btn btn-primary">Book again</Link>
            : <Link to="/plans" className="btn btn-primary">Browse trip plans</Link>}
          <Link to="/profile" className="btn btn-ghost btn-sm">My bookings</Link>
        </div>
      </div>
    </div>
  );
}

// "Complete payment by …" while an unpaid booking still holds its seats.
export function HoldNotice({ booking }) {
  const deadline = holdDeadline(booking);
  if (!deadline) return null;
  return (
    <div role="status" className="alert alert-warning text-sm py-2">
      <HiClock className="w-5 h-5 shrink-0" />
      <span>Complete payment by <span className="font-bold">{formatHoldTime(deadline)}</span> to keep your seats.</span>
    </div>
  );
}

const labelOf = (list, value) => list.find((x) => x.value === value)?.label || value;

export function BookingNotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Booking not found</h1>
      <Link to="/profile" className="btn btn-primary mt-4">Go to my bookings</Link>
    </div>
  );
}

export function BookingTotals({ booking }) {
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between text-base-content/70"><span>{taka(booking.pricePerPerson)} × {booking.ticketCount}</span><span>{taka(booking.totalAmount)}</span></div>
      <div className="flex justify-between font-bold text-base-content"><span>Total</span><span>{taka(booking.totalAmount)}</span></div>
      <div className="flex justify-between text-primary font-medium"><span>Advance ({Math.round(ADVANCE_RATE * 100)}%)</span><span>{taka(booking.advanceAmount)}</span></div>
      <div className="flex justify-between text-base-content/60"><span>Pay on arrival</span><span>{taka(booking.totalAmount - booking.advanceAmount)}</span></div>
      {booking.paidAmount > 0 && (
        <div className="flex justify-between text-success border-t border-base-300 pt-1.5"><span>Paid so far</span><span>{taka(booking.paidAmount)}</span></div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { id } = useParams();
  const { data: booking, loading, error } = useFetch(`/bookings/${id}`);

  if (loading) return null;
  if (error || !booking) return <BookingNotFound />;
  if (isHoldExpired(booking)) return <HoldExpired booking={booking} />;

  const payStatus = PAYMENT_STATUS[booking.paymentStatus] || PAYMENT_STATUS.unpaid;
  const bookStatus = BOOKING_STATUS[booking.bookingStatus] || BOOKING_STATUS.pending;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-base-content">Checkout</h1>
          <p className="text-base-content/60 mt-1">Booking ref <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span></p>
        </div>
        <div className="flex gap-2">
          <span className={`badge ${bookStatus.badge}`}>{bookStatus.label}</span>
          <span className={`badge ${payStatus.badge}`}>{payStatus.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card bg-base-200 border border-base-300 p-5">
            <h2 className="text-lg font-bold text-base-content">{booking.planTitle_bn}</h2>
            <p className="text-sm text-base-content/60">{booking.planTitle_en}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-base-content/70">
              {booking.start_date && <span className="flex items-center gap-1.5"><HiCalendar className="text-primary" /> {formatDateRange(booking.start_date, booking.end_date)}</span>}
              <span className="flex items-center gap-1.5"><HiUserGroup className="text-primary" /> {booking.ticketCount} ticket{booking.ticketCount === 1 ? "" : "s"}</span>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300 p-5">
            <h2 className="font-bold text-base-content mb-3">Travellers</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-base-content/50"><th>#</th><th>Name</th><th>Gender</th><th>Age</th><th>Phone</th><th>Relation</th></tr>
                </thead>
                <tbody>
                  {asArray(booking.travellers).map((t, i) => (
                    <tr key={i} className="border-base-300">
                      <td>{i + 1}</td>
                      <td className="font-medium text-base-content">{t.name}</td>
                      <td>{labelOf(GENDERS, t.gender)}</td>
                      <td>{t.age}</td>
                      <td>{t.phone}</td>
                      <td>{labelOf(RELATIONS, t.relation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {booking.note && (
              <div className="mt-4 p-3 rounded-lg bg-base-300/50 text-sm text-base-content/70">
                <span className="font-medium text-base-content">Note: </span>{booking.note}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 p-5 lg:sticky lg:top-24 space-y-4">
            <h2 className="font-bold text-base-content">Payment</h2>
            <BookingTotals booking={booking} />
            {canPay(booking) ? (
              <>
                <HoldNotice booking={booking} />
                <Link to={`/bookings/${booking._id}/pay`} className="btn btn-primary w-full">
                  <HiLockClosed className="mr-1" /> Pay now · {taka(booking.advanceAmount)}
                </Link>
                <p className="text-xs text-base-content/40 text-center">Pay {Math.round(ADVANCE_RATE * 100)}% now to confirm your seats. The rest is paid when you arrive.</p>
              </>
            ) : (
              <div className="text-sm text-base-content/60">
                {booking.paymentStatus === "pending_verification" && "We received your payment details and will verify them within 24 hours."}
                {booking.paymentStatus === "advance_paid" && "Your advance is verified. Pay the rest on arrival."}
                {booking.paymentStatus === "paid_full" && "Fully paid. Have a great trip!"}
                {booking.bookingStatus === "cancelled" && "This booking was cancelled."}
              </div>
            )}
            <Link to="/profile" className="btn btn-ghost btn-sm w-full">My bookings</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
