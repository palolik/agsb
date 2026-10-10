import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { formatDateRange } from "../lib/planSchedule";
import { GENDERS, PAYMENT_STATUS, taka, hasTickets } from "../lib/booking";
import { asArray } from "../lib/safe";
import { HiArrowLeft, HiPrinter, HiCalendar, HiUser } from "react-icons/hi";
import PageMeta from "../components/PageMeta";
import LogoMark from "../components/LogoMark";
import { bookingFetchState } from "./CheckoutPage";
import { useLang } from "../context/LanguageContext";

// One ticket per traveller: "AGSB-7K2Q9-01".
const ticketNumber = (booking, i) => `${booking.referenceCode}-${String(i + 1).padStart(2, "0")}`;

function TicketCard({ booking, traveller, index }) {
  const { lang, t, pick } = useLang();
  const gender = GENDERS.find((g) => g.value === traveller.gender);
  const pay = PAYMENT_STATUS[booking.paymentStatus] || PAYMENT_STATUS.unpaid;
  return (
    <article className="ticket-card flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-base-300 bg-base-100 shadow-sm break-inside-avoid">
      {/* Main part */}
      <div className="flex-1 p-5 min-w-0">
        <div className="flex items-center gap-2">
          <LogoMark className="w-8 h-8" />
          <div className="leading-tight">
            <div className="text-xs font-bold text-base-content">আমিঘুরিসারাবাংলাদেশ</div>
            <div className="text-[10px] tracking-wide text-base-content/50">{t("ভ্রমণ টিকিট", "TRAVEL TICKET")}</div>
          </div>
          <span className={`badge badge-sm ml-auto ${pay.badge}`}>{pick(pay, "label")}</span>
        </div>

        <h2 className="text-lg font-bold text-base-content mt-4 leading-snug">{pick(booking, "planTitle")}</h2>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 text-sm">
          <div className="col-span-2">
            <dt className="text-[11px] uppercase tracking-wide text-base-content/40">{t("যাত্রী", "Traveller")}</dt>
            <dd className="font-semibold text-base-content flex items-center gap-1.5"><HiUser className="text-primary shrink-0" aria-hidden="true" /> {traveller.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-base-content/40">{t("বয়স · লিঙ্গ", "Age · Gender")}</dt>
            <dd className="text-base-content">{traveller.age} · {gender ? pick(gender, "label") : traveller.gender}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-base-content/40">{t("ফোন", "Phone")}</dt>
            <dd className="text-base-content">{traveller.phone}</dd>
          </div>
          {booking.start_date && (
            <div className="col-span-2">
              <dt className="text-[11px] uppercase tracking-wide text-base-content/40">{t("ভ্রমণের তারিখ", "Trip dates")}</dt>
              <dd className="text-base-content flex items-center gap-1.5"><HiCalendar className="text-primary shrink-0" aria-hidden="true" /> {formatDateRange(booking.start_date, booking.end_date, lang)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Stub, separated by a perforated edge */}
      <div className="ticket-stub relative sm:w-48 p-5 bg-primary/10 border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-base-300 flex sm:flex-col justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-base-content/40">{t("টিকিট", "Ticket")}</div>
          <div className="font-mono font-bold text-base-content break-all">{ticketNumber(booking, index)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-base-content/40">{t("সিট", "Seat")}</div>
          <div className="font-bold text-base-content">{t(`${index + 1} / ${booking.ticketCount}`, `${index + 1} of ${booking.ticketCount}`)}</div>
        </div>
        <div className="text-right sm:text-left">
          <div className="text-[11px] uppercase tracking-wide text-base-content/40">{t("ভাড়া", "Fare")}</div>
          <div className="font-bold text-base-content">{taka(booking.pricePerPerson)}</div>
        </div>
      </div>
    </article>
  );
}

export default function TicketsPage() {
  const { id } = useParams();
  const { data: booking, loading, error, status, reload } = useFetch(`/bookings/${id}`);
  const { t } = useLang();

  const pending = bookingFetchState({ loading, error, status, reload, booking });
  const meta = <PageMeta noindex title={t("টিকিট", "Tickets")} />;
  if (pending) return <>{meta}{pending}</>;

  const back = (
    <Link to={`/bookings/${booking.referenceCode}/checkout`} className="btn btn-sm btn-ghost text-base-content/70 print:hidden">
      <HiArrowLeft className="mr-1" /> {t("বুকিংয়ের বিস্তারিত", "Booking details")}
    </Link>
  );

  if (!hasTickets(booking)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        {meta}
        {back}
        <div className="card bg-base-200 border border-base-300 p-8 text-center mt-4">
          <h1 className="text-xl font-bold text-base-content">{t("টিকিট এখনো তৈরি হয়নি", "Tickets are not ready yet")}</h1>
          <p className="text-sm text-base-content/60 mt-2">
            {booking.bookingStatus === "cancelled"
              ? t("এই বুকিংটি বাতিল করা হয়েছে।", "This booking was cancelled.")
              : t("অগ্রিম পেমেন্ট যাচাই হলেই আপনার টিকিট এখানে দেখা যাবে।", "Your tickets appear here once your advance payment is verified.")}
          </p>
        </div>
      </div>
    );
  }

  const balance = booking.totalAmount - (booking.paidAmount || 0);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:max-w-none">
      {meta}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        {back}
        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
          <HiPrinter className="mr-1" aria-hidden="true" /> {t("প্রিন্ট / PDF সেভ করুন", "Print / Save PDF")}
        </button>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-base-content mt-4">{t("আপনার টিকিট", "Your tickets")}</h1>
      <p className="text-base-content/60 mt-1">
        {t(
          <>বুকিং <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span> · চেক-ইনের সময় টিকিট দেখান (প্রিন্ট করা বা ফোনে)।</>,
          <>Booking <span className="font-mono font-bold text-base-content">{booking.referenceCode}</span> · show a ticket (printed or on your phone) at check-in.</>
        )}
        {balance > 0 && t(
          <> পৌঁছানোর পর বাকি পরিশোধ করতে হবে: <span className="font-bold text-base-content">{taka(balance)}</span>।</>,
          <> Balance due on arrival: <span className="font-bold text-base-content">{taka(balance)}</span>.</>
        )}
      </p>
      <div className="space-y-4 mt-6">
        {asArray(booking.travellers).map((t, i) => (
          <TicketCard key={i} booking={booking} traveller={t} index={i} />
        ))}
      </div>
    </div>
  );
}
