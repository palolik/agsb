import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiArrowLeft, HiCalendar, HiHome, HiLocationMarker, HiMinus, HiOfficeBuilding, HiPhone, HiPlus, HiTrash, HiUser } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFetch } from "../hooks/useFetch";
import { apiSend } from "../lib/api";
import { ADVANCE_RATE, BD_PHONE, advanceFor, taka } from "../lib/booking";
import { MAX_QTY, MAX_RENT_DAYS, addDays, lineDeposit, linePrice, optionsLabel, rentDays, rentDatesProblem, todayInDhaka } from "../lib/shop";
import { asArray } from "../lib/safe";
import { EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { useLang } from "../context/LanguageContext";
import { districtName } from "../lib/districtNames";

function CartLine({ item, onQty, onDates, onRemove }) {
  const { lang, t, pick } = useLang();
  const today = todayInDhaka();
  const max = Math.max(1, Math.min(MAX_QTY, Number(item.stock) || MAX_QTY));
  const days = item.kind === "rent" ? rentDays(item.startDate, item.endDate) : 0;
  const datesProblem = item.kind === "rent" ? rentDatesProblem(item.startDate, item.endDate, lang) : "";
  const options = optionsLabel(item.options);
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-base-300/40 border border-base-300">
      <Link to={`/shop/${item.slug}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-base-300">
        <CoverImage image={item.image} alt={pick(item, "name")} sizes="96px" width={192} height={192} />
      </Link>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/shop/${item.slug}`} className="font-bold text-base-content hover:text-primary">{pick(item, "name")}</Link>
              <span className={`badge badge-sm ${item.kind === "rent" ? "badge-accent" : "badge-primary"}`}>{item.kind === "rent" ? t("ভাড়া", "Rent") : t("কেনা", "Buy")}</span>
            </div>
            {options && <p className="text-xs text-base-content/60 mt-0.5">{options}</p>}
          </div>
          <button type="button" className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-error" aria-label={t(`${pick(item, "name")} সরান`, `Remove ${item.name}`)} onClick={onRemove}>
            <HiTrash className="w-4 h-4" />
          </button>
        </div>

        {item.kind === "rent" && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="form-control">
              <span className="text-xs text-base-content/50">{t("শুরু", "From")}</span>
              <input type="date" className="input input-bordered input-sm bg-base-300" min={today} value={item.startDate || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onDates(v, item.endDate && item.endDate >= v ? item.endDate : v);
                }} />
            </label>
            <label className="form-control">
              <span className="text-xs text-base-content/50">{t("ফেরত", "Return")}</span>
              <input type="date" className="input input-bordered input-sm bg-base-300" min={item.startDate || today}
                max={item.startDate ? addDays(item.startDate, MAX_RENT_DAYS - 1) : undefined}
                value={item.endDate || ""} onChange={(e) => onDates(item.startDate, e.target.value)} />
            </label>
            <span className="text-xs text-base-content/60 flex items-center gap-1 pb-2"><HiCalendar className="text-primary" /> {days} {t("দিন", days === 1 ? "day" : "days")}</span>
          </div>
        )}
        {datesProblem && <p className="text-error text-xs">{datesProblem}</p>}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="join">
            <button type="button" className="btn btn-sm join-item" aria-label={t("কমান", "Fewer")} disabled={item.qty <= 1} onClick={() => onQty(item.qty - 1)}><HiMinus /></button>
            <span className="join-item flex items-center justify-center w-10 bg-base-300 font-bold text-base-content">{item.qty}</span>
            <button type="button" className="btn btn-sm join-item" aria-label={t("বাড়ান", "More")} disabled={item.qty >= max} onClick={() => onQty(item.qty + 1)}><HiPlus /></button>
          </div>
          <div className="text-right text-sm">
            <div className="text-base-content/60">
              {item.kind === "rent" ? `${taka(item.rentPerDay)}${t("/দিন", "/day")} × ${days || "–"} × ${item.qty}` : `${taka(item.salePrice)} × ${item.qty}`}
            </div>
            <div className="font-bold text-base-content">{taka(linePrice(item))}</div>
            {lineDeposit(item) > 0 && <div className="text-xs text-base-content/50">+ {taka(lineDeposit(item))} {t("জামানত", "deposit")}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const { items, updateQty, updateDates, removeItem, clear } = useCart();
  const { lang, t, pick } = useLang();
  const { data: districts } = useFetch("/districts");
  const [fulfilment, setFulfilment] = useState("delivery");
  const [contact, setContact] = useState({ name: "", phone: "", address: "", district: "" });
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill contact from the account once it is known (never overwriting
  // anything already typed).
  useEffect(() => {
    if (!user) return;
    const home = asArray(districts).find((d) => d.slug === user.district);
    setContact((c) => ({
      ...c,
      name: c.name || user.name || "",
      phone: c.phone || user.phone || "",
      district: c.district || home?.name_en || "",
    }));
  }, [user, districts]);

  const itemsTotal = items.reduce((sum, i) => sum + linePrice(i), 0);
  const depositTotal = items.reduce((sum, i) => sum + lineDeposit(i), 0);
  const total = itemsTotal + depositTotal;
  const advance = advanceFor(total);

  const setField = (field) => (e) => setContact((c) => ({ ...c, [field]: e.target.value }));

  function validate() {
    for (const i of items) {
      if (i.kind === "rent") {
        const problem = rentDatesProblem(i.startDate, i.endDate, lang);
        if (problem) return `${pick(i, "name")}: ${problem.toLowerCase()}`;
      }
    }
    if (!contact.name.trim()) return t("যোগাযোগের জন্য একটি নাম লিখুন", "Enter a contact name");
    if (!BD_PHONE.test(contact.phone.replace(/[\s-]/g, ""))) return t("01 দিয়ে শুরু হওয়া ১১ সংখ্যার সঠিক ফোন নম্বর দিন", "Enter a valid 11-digit phone number starting with 01");
    if (fulfilment === "delivery" && !contact.address.trim()) return t("ডেলিভারির ঠিকানা লিখুন", "Enter a delivery address");
    return "";
  }

  async function placeOrder(e) {
    e.preventDefault();
    setFormError("");
    const problem = validate();
    if (problem) return setFormError(problem);
    setSubmitting(true);
    try {
      const data = await apiSend("/orders", "POST", {
        items: items.map((i) => ({
          productId: i.productId,
          kind: i.kind,
          qty: i.qty,
          options: i.options || {},
          ...(i.kind === "rent" ? { startDate: i.startDate, endDate: i.endDate } : {}),
        })),
        fulfilment,
        contact: {
          name: contact.name.trim(),
          phone: contact.phone.replace(/[\s-]/g, ""),
          address: fulfilment === "delivery" ? contact.address.trim() : contact.address.trim() || undefined,
          district: contact.district || undefined,
        },
        note: note.trim(),
      });
      clear();
      navigate(`/orders/${data.referenceCode}`);
    } catch (err) {
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  const meta = <PageMeta noindex title={t("কার্ট", "Cart")} description={t("আপনার ট্রাভেল গিয়ারের কার্ট।", "Your travel gear cart.")} />;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {meta}
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("কার্ট", "Cart")}</h1>
        <EmptyState
          message={t("আপনার কার্ট খালি।", "Your cart is empty.")}
          action={<Link to="/shop" className="btn btn-primary btn-sm">{t("শপ ঘুরে দেখুন", "Browse the shop")}</Link>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <Link to="/shop" className="btn btn-sm btn-ghost text-base-content/70 mb-4">
        <HiArrowLeft className="mr-1" /> {t("কেনাকাটা চালিয়ে যান", "Continue shopping")}
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("কার্ট", "Cart")}</h1>

      <form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card bg-base-200 border border-base-300 p-5 space-y-3">
            {items.map((item) => (
              <CartLine
                key={item.key}
                item={item}
                onQty={(q) => updateQty(item.key, q)}
                onDates={(s, e) => updateDates(item.key, s, e)}
                onRemove={() => removeItem(item.key)}
              />
            ))}
          </div>

          {!ready ? null : !user ? (
            <div className="card bg-base-200 border border-base-300 p-6 text-center">
              <h2 className="font-bold text-base-content">{t("অর্ডার করতে লগ ইন করুন", "Log in to order")}</h2>
              <p className="text-base-content/60 mt-1 text-sm">{t("অর্ডার দিতে লগ ইন করুন। আপনার কার্ট সংরক্ষিত আছে।", "Log in to place your order. Your cart is saved.")}</p>
              <div className="flex gap-2 justify-center mt-4">
                <Link to="/login" state={{ from: "/cart" }} className="btn btn-primary btn-sm">{t("লগ ইন", "Log in")}</Link>
                <Link to="/signup" state={{ from: "/cart" }} className="btn btn-ghost btn-sm">{t("সাইন আপ", "Sign up")}</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="card bg-base-200 border border-base-300 p-5">
                <h2 className="font-bold text-base-content mb-3">{t("কীভাবে পেতে চান?", "How do you want it?")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: "delivery", label: t("হোম ডেলিভারি", "Home delivery"), hint: t("আমরা আপনার ঠিকানায় পৌঁছে দেব", "We deliver to your address"), Icon: HiHome },
                    { value: "pickup", label: t("পিকআপ", "Pickup"), hint: t("আমাদের অফিস থেকে সংগ্রহ করুন", "Collect from our office"), Icon: HiOfficeBuilding },
                  ].map(({ value, label, hint, Icon }) => (
                    <label key={value} className={`cursor-pointer rounded-xl border p-4 transition-colors ${fulfilment === value ? "border-primary bg-primary/10" : "border-base-300 bg-base-300/40 hover:border-primary/40"}`}>
                      <input type="radio" name="fulfilment" className="sr-only" checked={fulfilment === value} onChange={() => setFulfilment(value)} />
                      <div className="flex items-center gap-2 font-bold text-base-content"><Icon className="w-5 h-5 text-primary" /> {label}</div>
                      <p className="text-xs text-base-content/50 mt-1">{hint}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="card bg-base-200 border border-base-300 p-5">
                <h2 className="font-bold text-base-content mb-3">{t("যোগাযোগ", "Contact")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="order-name"><span className="label-text">{t("নাম", "Name")}</span></label>
                    <label className="input input-bordered bg-base-300 w-full">
                      <HiUser className="w-5 h-5 shrink-0 text-base-content/40" />
                      <input id="order-name" type="text" required maxLength={100} placeholder={t("পূর্ণ নাম", "Full name")} className="grow" value={contact.name} onChange={setField("name")} />
                    </label>
                  </div>
                  <div>
                    <label className="label" htmlFor="order-phone"><span className="label-text">{t("ফোন", "Phone")}</span></label>
                    <label className="input input-bordered bg-base-300 w-full">
                      <HiPhone className="w-5 h-5 shrink-0 text-base-content/40" />
                      <input id="order-phone" type="tel" required placeholder="01712345678" className="grow" value={contact.phone} onChange={setField("phone")} />
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="order-address"><span className="label-text">{t("ঠিকানা", "Address")}{fulfilment === "pickup" && t(" (ঐচ্ছিক)", " (optional)")}</span></label>
                    <textarea id="order-address" required={fulfilment === "delivery"} maxLength={300} rows={2} placeholder={t("বাড়ি, রোড, এলাকা", "House, road, area")} className="textarea textarea-bordered bg-base-300 w-full" value={contact.address} onChange={setField("address")} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="order-district"><span className="label-text">{t("জেলা", "District")}</span></label>
                    <div className="relative">
                      <HiLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-base-content/40 pointer-events-none" />
                      <select id="order-district" className="select select-bordered bg-base-300 w-full pl-10" value={contact.district} onChange={setField("district")}>
                        <option value="">{t("জেলা বেছে নিন", "Select district")}</option>
                        {asArray(districts).map((d) => (
                          <option key={d.id || d.slug} value={d.name_en}>{lang === "bn" ? d.name_bn || districtName(d.name_en) : districtName(d.name_en)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200 border border-base-300 p-5">
                <label className="label" htmlFor="order-note"><span className="label-text font-bold text-base-content">{t("নোট (ঐচ্ছিক)", "Note (optional)")}</span></label>
                <textarea id="order-note" className="textarea textarea-bordered bg-base-300 w-full h-24" maxLength={1000} placeholder={t("ডেলিভারির সময়, আশপাশের চিহ্ন বা আমাদের জানা দরকার এমন কিছু", "Delivery time, landmarks, anything we should know")} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 p-5 lg:sticky lg:top-24 space-y-4">
            <h2 className="font-bold text-base-content">{t("অর্ডারের সারসংক্ষেপ", "Order summary")}</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-base-content/70"><span>{t("পণ্য", "Items")}</span><span>{taka(itemsTotal)}</span></div>
              {depositTotal > 0 && (
                <div className="flex justify-between text-base-content/70"><span>{t("ফেরতযোগ্য জামানত", "Refundable deposit")}</span><span>{taka(depositTotal)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base-content"><span>{t("মোট", "Total")}</span><span>{taka(total)}</span></div>
              <div className="flex justify-between text-primary font-medium"><span>{t("এখন অগ্রিম", "Advance now")} ({Math.round(ADVANCE_RATE * 100)}%)</span><span>{taka(advance)}</span></div>
              <div className="flex justify-between text-base-content/60"><span>{t("পরে পরিশোধ", "Pay later")}</span><span>{taka(total - advance)}</span></div>
            </div>
            {formError && <div role="alert" className="alert alert-error text-sm py-2">{formError}</div>}
            {user ? (
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-sm" /> : t("অর্ডার করুন", "Place order")}
              </button>
            ) : ready && (
              <Link to="/login" state={{ from: "/cart" }} className="btn btn-primary w-full">{t("অর্ডার করতে লগ ইন করুন", "Log in to order")}</Link>
            )}
            <p className="text-xs text-base-content/40 text-center">{t("অর্ডার দেওয়ার সময় দাম ও স্টক নিশ্চিত করা হয়। অগ্রিম পরিশোধের জন্য পণ্যগুলো ৬০ মিনিট সংরক্ষিত রাখা হয়।", "Prices and stock are confirmed when you place the order. Items are held for 60 minutes while you pay the advance.")}</p>
          </div>
        </div>
      </form>
    </div>
  );
}
