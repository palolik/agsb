import { Link, useParams } from "react-router-dom";
import { HiCalendar, HiClock, HiExclamation, HiHome, HiLockClosed, HiOfficeBuilding, HiPhone, HiUser } from "react-icons/hi";
import { useFetch } from "../hooks/useFetch";
import { PAYMENT_STATUS, ADVANCE_RATE, taka, formatHoldTime } from "../lib/booking";
import { ORDER_STATUS, canPayOrder, isOrderHoldExpired, orderHoldDeadline, optionsLabel, formatDay } from "../lib/shop";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { useLang } from "../context/LanguageContext";

// Shown instead of the payment form once an unpaid order's stock hold ran out.
export function OrderHoldExpired({ order, message }) {
  const { t } = useLang();
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="card bg-base-200 border border-base-300 p-8 text-center">
        {message && <div role="alert" className="alert alert-error text-sm py-2 mb-4">{message}</div>}
        <HiExclamation className="w-14 h-14 text-warning mx-auto mb-3" />
        <h1 className="text-xl font-bold text-base-content">{t("অর্ডার হোল্ডের সময় শেষ", "Order hold expired")}</h1>
        <p className="text-base-content/70 mt-1 font-medium">{t("আপনার অর্ডার হোল্ডের মেয়াদ শেষ হয়ে গেছে — অনুগ্রহ করে আবার অর্ডার করুন", "Your order hold expired — please order again")}</p>
        <p className="text-sm text-base-content/50 mt-2">
          {t("অর্ডার", "Order")} <span className="font-mono font-bold text-base-content">{order.referenceCode}</span> {t("সময়মতো পরিশোধ না হওয়ায় এর পণ্যগুলো ছেড়ে দেওয়া হয়েছে।", "wasn't paid in time, so its items were released.")}
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <Link to="/shop" className="btn btn-primary">{t("শপে ফিরে যান", "Back to shop")}</Link>
          <Link to="/profile" className="btn btn-ghost btn-sm">{t("আমার অর্ডার", "My orders")}</Link>
        </div>
      </div>
    </div>
  );
}

export function OrderNotFound() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <EmptyState
        message={t("অর্ডারটি পাওয়া যায়নি।", "Order not found.")}
        action={<Link to="/profile" className="btn btn-primary btn-sm">{t("আমার অর্ডারে যান", "Go to my orders")}</Link>}
      />
    </div>
  );
}

// Loading / error / not-found handling shared by the order and payment pages.
export function orderFetchState({ loading, error, status, reload, order }) {
  if (loading) return <Spinner />;
  if (error && status !== 404 && status !== 400) {
    return <div className="max-w-3xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div>;
  }
  if (!order) return <OrderNotFound />;
  return null;
}

export function OrderTotals({ order }) {
  const { t } = useLang();
  const due = order.dueAmount ?? order.totalAmount - (order.paidAmount || 0);
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between text-base-content/70"><span>{t("পণ্য", "Items")}</span><span>{taka(order.itemsTotal)}</span></div>
      {order.depositTotal > 0 && (
        <div className="flex justify-between text-base-content/70"><span>{t("ফেরতযোগ্য জামানত", "Refundable deposit")}</span><span>{taka(order.depositTotal)}</span></div>
      )}
      <div className="flex justify-between font-bold text-base-content"><span>{t("মোট", "Total")}</span><span>{taka(order.totalAmount)}</span></div>
      <div className="flex justify-between text-primary font-medium"><span>{t("অগ্রিম", "Advance")} ({Math.round(ADVANCE_RATE * 100)}%)</span><span>{taka(order.advanceAmount)}</span></div>
      {order.paidAmount > 0 && (
        <div className="flex justify-between text-success border-t border-base-300 pt-1.5"><span>{t("এ পর্যন্ত পরিশোধিত", "Paid so far")}</span><span>{taka(order.paidAmount)}</span></div>
      )}
      <div className="flex justify-between text-base-content/60"><span>{t("বাকি", "Due")}</span><span>{taka(due)}</span></div>
    </div>
  );
}

export function OrderStatusBadges({ order, size = "" }) {
  const { pick } = useLang();
  const pay = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.unpaid;
  const st = ORDER_STATUS[order.orderStatus] || ORDER_STATUS.pending;
  return (
    <>
      <span className={`badge ${size} ${st.badge}`}>{pick(st, "label")}</span>
      <span className={`badge ${size} ${pay.badge}`}>{pick(pay, "label")}</span>
    </>
  );
}

export function OrderItems({ items }) {
  const { lang, t, pick } = useLang();
  return (
    <div className="space-y-3">
      {asArray(items).map((i, idx) => {
        const options = optionsLabel(i.options);
        return (
          <div key={idx} className="flex gap-3">
            <Link to={i.slug ? `/shop/${i.slug}` : "/shop"} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-base-300">
              <CoverImage image={i.image} alt={pick(i, "name")} sizes="64px" width={128} height={128} />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-base-content">{pick(i, "name")}</span>
                    <span className={`badge badge-sm ${i.kind === "rent" ? "badge-accent" : "badge-primary"}`}>{i.kind === "rent" ? t("ভাড়া", "Rent") : t("কেনা", "Buy")}</span>
                  </div>
                  {options && <p className="text-xs text-base-content/60">{options}</p>}
                  {i.kind === "rent" && i.startDate && (
                    <p className="text-xs text-base-content/60 flex items-center gap-1"><HiCalendar className="text-primary" /> {formatDay(i.startDate, lang)} – {formatDay(i.endDate, lang)}{i.days ? ` · ${i.days} ${t("দিন", i.days === 1 ? "day" : "days")}` : ""}</p>
                  )}
                  <p className="text-xs text-base-content/50">{taka(i.unitPrice)}{i.kind === "rent" ? t("/দিন", "/day") : ""} × {i.qty}</p>
                </div>
                <div className="text-right text-sm shrink-0">
                  <div className="font-bold text-base-content">{taka(i.lineTotal)}</div>
                  {i.deposit > 0 && <div className="text-xs text-base-content/50">+ {taka(i.deposit)} {t("জামানত", "deposit")}</div>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function statusMessage(order, t) {
  if (order.orderStatus === "cancelled") return t("এই অর্ডারটি বাতিল করা হয়েছে।", "This order was cancelled.");
  if (order.paymentStatus === "pending_verification") return t("আমরা আপনার পেমেন্টের তথ্য পেয়েছি, ২৪ ঘণ্টার মধ্যে যাচাই করা হবে।", "We received your payment details and will verify them within 24 hours.");
  if (order.paymentStatus === "advance_paid") {
    return order.orderStatus === "pending" ? t("আপনার অগ্রিম যাচাই হয়েছে। শিগগিরই আপনার অর্ডার নিশ্চিত করা হবে।", "Your advance is verified. We'll confirm your order shortly.") : t("আপনার অগ্রিম যাচাই হয়েছে। বাকিটা ডেলিভারি বা পিকআপের সময় পরিশোধ করুন।", "Your advance is verified. Pay the rest on delivery or pickup.");
  }
  if (order.paymentStatus === "paid_full") return t("সম্পূর্ণ পরিশোধিত। ধন্যবাদ!", "Fully paid. Thank you!");
  return "";
}

export default function OrderPage() {
  const { id } = useParams();
  const { data: order, loading, error, status, reload } = useFetch(`/orders/${id}`);
  const { lang, t } = useLang();

  const pending = orderFetchState({ loading, error, status, reload, order });
  const meta = <PageMeta title={t("অর্ডার", "Order")} />;
  if (pending) return <>{meta}{pending}</>;
  if (isOrderHoldExpired(order)) return <>{meta}<OrderHoldExpired order={order} /></>;

  const deadline = orderHoldDeadline(order);
  const contact = order.contact || {};
  const delivery = order.fulfilment !== "pickup";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("অর্ডার", "Order")}</h1>
          <p className="text-base-content/60 mt-1">{t("অর্ডার রেফ", "Order ref")} <span className="font-mono font-bold text-base-content">{order.referenceCode}</span></p>
        </div>
        <div className="flex gap-2"><OrderStatusBadges order={order} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card bg-base-200 border border-base-300 p-5">
            <h2 className="font-bold text-base-content mb-3">{t("পণ্য", "Items")}</h2>
            <OrderItems items={order.items} />
          </div>

          <div className="card bg-base-200 border border-base-300 p-5">
            <h2 className="font-bold text-base-content mb-3 flex items-center gap-2">
              {delivery ? <HiHome className="text-primary" /> : <HiOfficeBuilding className="text-primary" />}
              {delivery ? t("হোম ডেলিভারি", "Home delivery") : t("পিকআপ", "Pickup")}
            </h2>
            <div className="space-y-1.5 text-sm text-base-content/70">
              {contact.name && <div className="flex items-center gap-2"><HiUser className="text-base-content/40" /> {contact.name}</div>}
              {contact.phone && <div className="flex items-center gap-2"><HiPhone className="text-base-content/40" /> {contact.phone}</div>}
              {(contact.address || contact.district) && (
                <div className="flex items-start gap-2"><HiHome className="text-base-content/40 mt-0.5" /> {[contact.address, contact.district].filter(Boolean).join(", ")}</div>
              )}
            </div>
            {order.note && (
              <div className="mt-4 p-3 rounded-lg bg-base-300/50 text-sm text-base-content/70">
                <span className="font-medium text-base-content">{t("নোট: ", "Note: ")}</span>{order.note}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 p-5 lg:sticky lg:top-24 space-y-4">
            <h2 className="font-bold text-base-content">{t("পেমেন্ট", "Payment")}</h2>
            <OrderTotals order={order} />
            {canPayOrder(order) ? (
              <>
                {deadline && (
                  <div role="status" className="alert alert-warning text-sm py-2">
                    <HiClock className="w-5 h-5 shrink-0" />
                    <span>{lang === "bn"
                      ? <>পণ্যগুলো ধরে রাখতে <span className="font-bold">{formatHoldTime(deadline, lang)}</span>-এর মধ্যে পেমেন্ট সম্পন্ন করুন।</>
                      : <>Complete payment by <span className="font-bold">{formatHoldTime(deadline, lang)}</span> to keep your items.</>}</span>
                  </div>
                )}
                {order.paymentStatus === "failed" && (
                  <div role="alert" className="alert alert-error text-sm py-2">{t("আপনার আগের পেমেন্টটি যাচাই করা যায়নি। অনুগ্রহ করে আবার পরিশোধ করুন।", "We couldn't verify your last payment. Please pay again.")}</div>
                )}
                <Link to={`/orders/${order.referenceCode}/pay`} className="btn btn-primary w-full">
                  <HiLockClosed className="mr-1" /> {t("এখনই পরিশোধ করুন", "Pay now")} · {taka(order.advanceAmount)}
                </Link>
                <p className="text-xs text-base-content/40 text-center">{t(`অর্ডার নিশ্চিত করতে এখন ${Math.round(ADVANCE_RATE * 100)}% পরিশোধ করুন। বাকিটা ডেলিভারি বা পিকআপের সময় দিতে হবে।`, `Pay ${Math.round(ADVANCE_RATE * 100)}% now to confirm your order. The rest is paid on delivery or pickup.`)}</p>
              </>
            ) : (
              <p className="text-sm text-base-content/60">{statusMessage(order, t)}</p>
            )}
            <Link to="/profile" className="btn btn-ghost btn-sm w-full">{t("আমার অর্ডার", "My orders")}</Link>
            <Link to="/shop" className="btn btn-ghost btn-sm w-full">{t("কেনাকাটা চালিয়ে যান", "Continue shopping")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
