import { useMemo, useState } from "react";
import Feedback from "../components/Feedback";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiArrowLeft, HiCalendar, HiCheckCircle, HiMinus, HiPlus, HiShoppingCart, HiTruck } from "react-icons/hi";
import { useFetch } from "../hooks/useFetch";
import { useCart } from "../context/CartContext";
import { renderRichText } from "../lib/richText";
import { taka } from "../lib/booking";
import { MAX_QTY, MAX_RENT_DAYS, addDays, canBuy, canRent, rentDays, rentDatesProblem, stockFor, todayInDhaka } from "../lib/shop";
import { asArray } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";
import { useLang } from "../context/LanguageContext";

function Gallery({ images, alt }) {
  const { t } = useLang();
  const [active, setActive] = useState(0);
  const list = asArray(images);
  const current = list[Math.min(active, list.length - 1)];
  return (
    <div>
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-base-300 border border-base-300">
        <CoverImage image={current} alt={alt} sizes="(min-width: 1024px) 50vw, 100vw" width={1200} height={900} priority />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              aria-label={t(`ছবি ${i + 1} দেখুন`, `Show image ${i + 1}`)}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`w-20 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <CoverImage image={img} alt="" sizes="80px" width={160} height={128} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Fresh state (options, dates, qty) for each product.
export default function ProductDetailPage() {
  const { slug } = useParams();
  return <ProductDetail key={slug} slug={slug} />;
}

function ProductDetail({ slug }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { lang, t, pick } = useLang();
  const { data: product, loading, error, status, reload } = useFetch(`/products/${slug}`);
  const [kindChoice, setKindChoice] = useState(null);
  const [options, setOptions] = useState({});
  const [qty, setQty] = useState(1);
  const today = todayInDhaka();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 1));
  const [formError, setFormError] = useState("");
  const [added, setAdded] = useState(false);

  const descriptionHtml = useMemo(() => renderRichText(product?.description), [product]);

  const notFound = !loading && !product && (!error || status === 404 || status === 400);
  const meta = (
    <PageMeta
      title={product ? pick(product, "name") : notFound ? t("পণ্য পাওয়া যায়নি", "Product not found") : t("শপ", "Shop")}
      description={product?.summary}
      image={asArray(product?.images)[0]}
    />
  );
  if (loading) return <>{meta}<Spinner /></>;
  if (error && !notFound) {
    return <>{meta}<div className="max-w-7xl mx-auto px-4 py-8"><ErrorState message={error} onRetry={reload} /></div></>;
  }
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {meta}
        <EmptyState
          message={t("পণ্যটি পাওয়া যায়নি। হয়তো এটি সরিয়ে ফেলা হয়েছে।", "Product not found. It may have been removed.")}
          action={<Link to="/shop" className="btn btn-primary btn-sm"><HiArrowLeft className="mr-1" /> {t("শপে ফিরে যান", "Back to shop")}</Link>}
        />
      </div>
    );
  }

  const modes = [canBuy(product) && "buy", canRent(product) && "rent"].filter(Boolean);
  // Prefer a mode with stock when the visitor hasn't picked one.
  const kind = modes.includes(kindChoice) ? kindChoice : (modes.find((m) => stockFor(product, m) > 0) || modes[0]);
  const stock = kind ? stockFor(product, kind) : 0;
  const maxQty = Math.min(MAX_QTY, stock);
  const safeQty = Math.max(1, Math.min(qty, maxQty || 1));
  const productOptions = asArray(product.options).filter((o) => o?.name && asArray(o.values).length);
  const days = kind === "rent" ? rentDays(startDate, endDate) : 0;
  const price = kind === "rent" ? product.rentPerDay * days * safeQty : (product.salePrice || 0) * safeQty;
  const deposit = kind === "rent" ? (product.rentDeposit || 0) * safeQty : 0;

  function addToCart(goToCart) {
    setFormError("");
    if (!kind || stock === 0) return setFormError(t("এই মুহূর্তে স্টক নেই", "Out of stock right now"));
    const missing = productOptions.find((o) => !options[o.name]);
    if (missing) return setFormError(t(`${missing.name} বেছে নিন`, `Choose a ${missing.name.toLowerCase()}`));
    if (kind === "rent") {
      const problem = rentDatesProblem(startDate, endDate, lang);
      if (problem) return setFormError(problem);
    }
    const picked = Object.fromEntries(productOptions.map((o) => [o.name, options[o.name]]));
    addItem(product, { kind, qty: safeQty, options: picked, startDate, endDate });
    if (goToCart) navigate("/cart");
    else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <Link to="/shop" className="btn btn-sm btn-ghost text-base-content/70 mb-4">
        <HiArrowLeft className="mr-1" /> {t("শপে ফিরে যান", "Back to shop")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Gallery images={product.images} alt={pick(product, "name")} />

        <div>
          {product.category && (
            <Link to={`/shop?category=${encodeURIComponent(product.category.slug)}`} className="badge badge-ghost border-base-300 hover:border-primary">
              {pick(product.category, "name")}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-base-content mt-2">{pick(product, "name")}</h1>
          {product.summary && <p className="text-base-content/70 mt-3">{product.summary}</p>}
          {asArray(product.tags).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {asArray(product.tags).map((tag) => <span key={tag} className="badge badge-sm badge-ghost border-base-300">#{tag}</span>)}
            </div>
          )}

          <div className="card bg-base-200 border border-base-300 p-5 mt-5 space-y-4">
            {modes.length === 0 ? (
              <p className="text-base-content/60">{t("এই পণ্যটি এখন কেনা বা ভাড়া নেওয়ার জন্য পাওয়া যাচ্ছে না।", "This item is not available to buy or rent right now.")}</p>
            ) : (
              <>
                {modes.length > 1 && (
                  <div role="tablist" aria-label={t("কিনুন বা ভাড়া নিন", "Buy or rent")} className="tabs tabs-box bg-base-300 w-fit">
                    {modes.map((m) => (
                      <button key={m} type="button" role="tab" aria-selected={kind === m} className={`tab ${kind === m ? "tab-active" : ""}`} onClick={() => { setKindChoice(m); setFormError(""); }}>
                        {m === "buy" ? t("কিনুন", "Buy") : t("ভাড়া", "Rent")}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="text-2xl font-bold text-primary">
                    {kind === "rent" ? <>{taka(product.rentPerDay)}<span className="text-base font-medium text-base-content/60">{t("/দিন", "/day")}</span></> : taka(product.salePrice)}
                  </div>
                  <span className={`badge ${stock > 0 ? "badge-success badge-outline" : "badge-error"}`}>
                    {stock > 0 ? t(`স্টকে আছে ${stock}টি`, `${stock} in stock`) : t("স্টক নেই", "Out of stock")}
                  </span>
                </div>
                {kind === "rent" && product.rentDeposit > 0 && (
                  <p className="text-sm text-base-content/60 -mt-2">{t(`+ প্রতি ইউনিটে ${taka(product.rentDeposit)} ফেরতযোগ্য জামানত`, `+ ${taka(product.rentDeposit)} refundable deposit per unit`)}</p>
                )}

                {productOptions.map((o) => (
                  <div key={o.name}>
                    <p className="text-sm font-medium text-base-content mb-2">{o.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {asArray(o.values).map((v) => (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={options[o.name] === v}
                          onClick={() => { setOptions((prev) => ({ ...prev, [o.name]: v })); setFormError(""); }}
                          className={`btn btn-sm ${options[o.name] === v ? "btn-primary" : "btn-outline border-base-300"}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {kind === "rent" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label" htmlFor="rent-start"><span className="label-text">{t("শুরুর তারিখ", "Start date")}</span></label>
                      <input
                        id="rent-start"
                        type="date"
                        className="input input-bordered bg-base-300 w-full"
                        min={today}
                        value={startDate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setStartDate(v);
                          if (v && endDate < v) setEndDate(v);
                        }}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="rent-end"><span className="label-text">{t("ফেরতের তারিখ", "Return date")}</span></label>
                      <input
                        id="rent-end"
                        type="date"
                        className="input input-bordered bg-base-300 w-full"
                        min={startDate || today}
                        max={startDate ? addDays(startDate, MAX_RENT_DAYS - 1) : undefined}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-sm font-medium text-base-content">{t("পরিমাণ", "Quantity")}</span>
                  <div className="join">
                    <button type="button" className="btn join-item" aria-label={t("কমান", "Fewer")} disabled={safeQty <= 1} onClick={() => setQty(safeQty - 1)}><HiMinus /></button>
                    <span className="join-item flex items-center justify-center w-14 bg-base-300 font-bold text-lg text-base-content">{safeQty}</span>
                    <button type="button" className="btn join-item" aria-label={t("বাড়ান", "More")} disabled={safeQty >= maxQty} onClick={() => setQty(safeQty + 1)}><HiPlus /></button>
                  </div>
                </div>

                <div className="border-t border-base-300 pt-3 space-y-1.5 text-sm">
                  {kind === "rent" ? (
                    <>
                      <div className="flex justify-between text-base-content/70">
                        <span className="flex items-center gap-1.5"><HiCalendar className="text-primary" /> {taka(product.rentPerDay)} × {days || "–"} {t("দিন", days === 1 ? "day" : "days")} × {safeQty}</span>
                        <span>{taka(price)}</span>
                      </div>
                      {deposit > 0 && (
                        <div className="flex justify-between text-base-content/60"><span>{t("ফেরতযোগ্য জামানত", "Refundable deposit")}</span><span>{taka(deposit)}</span></div>
                      )}
                      <div className="flex justify-between font-bold text-base-content"><span>{t("মোট", "Total")}</span><span>{taka(price + deposit)}</span></div>
                    </>
                  ) : (
                    <div className="flex justify-between font-bold text-base-content"><span>{taka(product.salePrice)} × {safeQty}</span><span>{taka(price)}</span></div>
                  )}
                </div>

                {formError && <div role="alert" className="alert alert-error text-sm py-2">{formError}</div>}
                {added && (
                  <div role="status" className="alert alert-success text-sm py-2">
                    <HiCheckCircle className="w-5 h-5" /> {t("কার্টে যোগ হয়েছে।", "Added to cart.")} <Link to="/cart" className="link font-medium">{t("কার্ট দেখুন", "View cart")}</Link>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" className="btn btn-outline btn-primary" disabled={stock === 0} onClick={() => addToCart(false)}>
                    <HiShoppingCart className="mr-1" /> {t("কার্টে যোগ করুন", "Add to cart")}
                  </button>
                  <button type="button" className="btn btn-primary" disabled={stock === 0} onClick={() => addToCart(true)}>
                    {kind === "rent" ? t("এখনই ভাড়া নিন", "Rent now") : t("এখনই কিনুন", "Buy now")}
                  </button>
                </div>
              </>
            )}
            {product.deliveryTime && (
              <p className="text-sm text-base-content/60 flex items-center gap-1.5"><HiTruck className="text-primary" /> {t("ডেলিভারি:", "Delivery:")} {product.deliveryTime}</p>
            )}
          </div>
        </div>
      </div>

      {descriptionHtml && (
        <div className="card bg-base-200 border border-base-300 p-5 md:p-6 mt-8">
          <h2 className="text-lg font-bold text-base-content mb-3">{t("বিস্তারিত", "Details")}</h2>
          <div className="prose prose-theme max-w-none prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        </div>
      )}
      <Feedback type="product" target={product.slug} />
    </div>
  );
}
