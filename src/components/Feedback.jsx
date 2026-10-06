import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiStar, HiOutlineStar, HiBadgeCheck, HiTrash, HiChatAlt2, HiPencil, HiLockClosed, HiPaperAirplane } from "react-icons/hi";
import { apiGet, apiSend } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { Spinner, ErrorState } from "./StateViews";

// Ratings, reviews and comments for a trip plan, product or blog post.
// type: "plan" | "product" | "blog"; target: the item's slug.
// Backend: /reviews/:type/:target (see reviewController.js).

const MAX_BODY = 2000;

// Read-only stars; `value` may be fractional (rounded to the nearest half).
export function Stars({ value = 0, className = "w-4 h-4" }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center text-warning" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="relative inline-block">
          <HiOutlineStar className={`${className} opacity-40`} />
          {rounded >= n - 0.5 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: rounded >= n ? "100%" : "50%" }}>
              <HiStar className={className} />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

// Compact "★ 4.5 (12)" for cards; nothing when there are no ratings yet.
export function RatingBadge({ rating, className = "" }) {
  const { t } = useLang();
  if (!rating?.count) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-base-content/70 ${className}`}
      aria-label={t(`৫-এর মধ্যে ${rating.avg} রেটিং, ${rating.count}টি রিভিউ`, `Rated ${rating.avg} out of 5 from ${rating.count} review${rating.count === 1 ? "" : "s"}`)}>
      <HiStar className="w-4 h-4 text-warning" aria-hidden="true" />
      <span className="font-semibold text-base-content">{rating.avg.toFixed(1)}</span>
      <span>({rating.count})</span>
    </span>
  );
}

function StarPicker({ value, onChange, disabled }) {
  const { t } = useLang();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label={t("রেটিং", "Rating")} className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t(`${n} স্টার`, `${n} star${n === 1 ? "" : "s"}`)}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="p-0.5 text-warning disabled:opacity-50"
        >
          {shown >= n ? <HiStar className="w-7 h-7" /> : <HiOutlineStar className="w-7 h-7 opacity-50" />}
        </button>
      ))}
    </div>
  );
}


const PAGE = 4;

// "3 days ago" / "৩ দিন আগে"; older than a month shows the date.
function timeAgo(iso, lang) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const locale = lang === "bn" ? "bn-BD" : "en-GB";
  const secs = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(secs);
  if (abs >= 30 * 86400) return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs >= 86400) return rtf.format(Math.round(secs / 86400), "day");
  if (abs >= 3600) return rtf.format(Math.round(secs / 3600), "hour");
  if (abs >= 60) return rtf.format(Math.round(secs / 60), "minute");
  return rtf.format(0, "second");
}

// Same name, same colour.
const AVATAR_TONES = ["bg-primary/15 text-primary", "bg-secondary/15 text-secondary", "bg-accent/15 text-accent", "bg-info/15 text-info", "bg-warning/15 text-warning", "bg-success/15 text-success"];
function Avatar({ name, size = "w-10 h-10" }) {
  const n = String(name || "?");
  const tone = AVATAR_TONES[[...n].reduce((h, ch) => h + ch.codePointAt(0), 0) % AVATAR_TONES.length];
  return (
    <div className={`${size} ${tone} rounded-full flex items-center justify-center font-bold shrink-0`} aria-hidden="true">
      {n[0]?.toUpperCase()}
    </div>
  );
}

function ReviewCard({ entry, own, onEdit, onDelete, busy }) {
  const { t, lang } = useLang();
  return (
    <article className={`rounded-box border p-4 sm:p-5 ${own ? "border-primary/40 bg-primary/5" : "border-base-300 bg-base-100"}`}>
      <header className="flex items-start gap-3">
        <Avatar name={entry.userName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base-content">{entry.userName}</span>
            {own && <span className="badge badge-primary badge-sm">{t("আপনার রিভিউ", "Your review")}</span>}
            {entry.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 rounded-full px-2 py-0.5">
                <HiBadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {t("যাচাইকৃত ক্রেতা", "Verified customer")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Stars value={entry.rating} />
            <span className="sr-only">{t(`৫-এর মধ্যে ${entry.rating}`, `${entry.rating} out of 5`)}</span>
            <time dateTime={entry.updatedAt || entry.createdAt} className="text-xs text-base-content/50">{timeAgo(entry.updatedAt || entry.createdAt, lang)}</time>
          </div>
        </div>
        {own && (
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button type="button" onClick={onEdit} className="btn btn-ghost btn-xs btn-square" aria-label={t("সম্পাদনা", "Edit")} title={t("সম্পাদনা", "Edit")}>
                <HiPencil className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={onDelete} disabled={busy} className="btn btn-ghost btn-xs btn-square text-error" aria-label={t("মুছে ফেলুন", "Delete")} title={t("মুছে ফেলুন", "Delete")}>
              <HiTrash className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>
      {entry.body && <p className="text-sm leading-relaxed text-base-content/80 mt-3 whitespace-pre-line break-words">{entry.body}</p>}
      {own && entry.status === "hidden" && (
        <p className="text-xs text-warning mt-3">{t("এই রিভিউটি মডারেটর লুকিয়ে রেখেছেন, তাই অন্যরা এটি দেখতে পাচ্ছেন না।", "A moderator has hidden this review, so others can't see it.")}</p>
      )}
    </article>
  );
}

function ReviewForm({ initial, editing, busy, error, onSubmit, onCancel }) {
  const { t } = useLang();
  const [rating, setRating] = useState(initial?.rating || 0);
  const [text, setText] = useState(initial?.body || "");
  const hints = [t("খুব খারাপ", "Poor"), t("মোটামুটি", "Fair"), t("ভালো", "Good"), t("খুব ভালো", "Very good"), t("অসাধারণ", "Excellent")];
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(rating, text); }} className="rounded-box border border-primary/40 bg-base-100 p-4 sm:p-5 space-y-4">
      <h3 className="font-bold text-base-content">{editing ? t("আপনার রিভিউ সম্পাদনা করুন", "Edit your review") : t("আপনার অভিজ্ঞতা জানান", "Share your experience")}</h3>
      <div className="flex items-center gap-3 flex-wrap">
        <StarPicker value={rating} onChange={setRating} disabled={busy} />
        <span className="text-sm font-medium text-base-content/70 min-h-5">{rating ? hints[rating - 1] : t("স্টার বেছে নিন", "Tap a star")}</span>
      </div>
      <div>
        <textarea
          className="textarea textarea-bordered bg-base-200 w-full"
          rows={4}
          maxLength={MAX_BODY}
          placeholder={t("কী ভালো লেগেছে, কী আরও ভালো হতে পারত? (ঐচ্ছিক)", "What did you like, and what could be better? (optional)")}
          aria-label={t("রিভিউ", "Review")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="text-right text-xs text-base-content/40">{text.length}/{MAX_BODY}</div>
      </div>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy && <span className="loading loading-spinner loading-xs" />}
          {editing ? t("আপডেট করুন", "Update review") : t("রিভিউ পোস্ট করুন", "Post review")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>{t("বাতিল", "Cancel")}</button>
      </div>
    </form>
  );
}

function Summary({ data, filter, onFilter, action }) {
  const { t } = useLang();
  const count = data.rating?.count || 0;
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-5 lg:sticky lg:top-24">
      <div className="flex items-center gap-4 lg:block">
        {count > 0 && <div className="text-5xl font-bold text-base-content leading-none">{data.rating.avg.toFixed(1)}</div>}
        <div className={count > 0 ? "lg:mt-3" : ""}>
          <Stars value={data.rating?.avg || 0} className="w-5 h-5" />
          <p className="text-sm text-base-content/60 mt-1">
            {count ? t(`${count}টি রিভিউয়ের ভিত্তিতে`, `Based on ${count} review${count === 1 ? "" : "s"}`) : t("এখনো কোনো রিভিউ নেই", "No reviews yet")}
          </p>
        </div>
      </div>
      {count > 0 && (
        <div className="mt-5 space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => {
            const k = data.breakdown[n] || 0;
            const active = filter === n;
            return (
              <button
                key={n}
                type="button"
                disabled={!k}
                onClick={() => onFilter(active ? 0 : n)}
                aria-pressed={active}
                className={`w-full flex items-center gap-2 text-xs rounded-md px-1.5 py-1 transition-colors disabled:opacity-40 ${active ? "bg-warning/15" : "hover:bg-base-200"}`}
              >
                <span className="w-3 text-base-content/70 font-medium">{n}</span>
                <HiStar className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
                <span className="flex-1 h-2 rounded-full bg-base-300 overflow-hidden">
                  <span className="block h-full bg-warning rounded-full" style={{ width: `${(k / count) * 100}%` }} />
                </span>
                <span className="w-7 text-right text-base-content/60">{Math.round((k / count) * 100)}%</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-5 pt-5 border-t border-base-300">{action}</div>
    </div>
  );
}

export default function Feedback({ type, target }) {
  // Trip plans and products: only customers with a completed booking/order
  // may review (the server decides; `canReview` in the response).
  const { user } = useAuth();
  const { t, lang } = useLang();
  const location = useLocation();
  const path = `/reviews/${type}/${encodeURIComponent(target)}`;
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [tab, setTab] = useState("reviews");
  const [writing, setWriting] = useState(false);
  const [starFilter, setStarFilter] = useState(0);
  const [sort, setSort] = useState("newest");
  const [shown, setShown] = useState(PAGE);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState("");
  const [formError, setFormError] = useState({ review: "", comment: "" });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await apiGet(path);
      setState({ data, loading: false, error: "" });
    } catch (err) {
      setState({ data: null, loading: false, error: err.message });
    }
  }, [path]);

  // Reload when the item or the signed-in user changes (`mine` depends on it).
  useEffect(() => { load(); }, [load, user?.email]);

  const data = state.data;
  const mine = data?.mine;

  const reviews = useMemo(() => {
    const list = (data?.reviews || []).filter((r) => !r.own && (!starFilter || r.rating === starFilter));
    if (sort === "highest") return [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "lowest") return [...list].sort((a, b) => a.rating - b.rating);
    return list;
  }, [data, starFilter, sort]);

  async function submitReview(rating, body) {
    if (!rating) return setFormError((e) => ({ ...e, review: t("স্টার দিয়ে রেটিং দিন।", "Choose a star rating.") }));
    setBusy("review");
    setFormError((e) => ({ ...e, review: "" }));
    try {
      await apiSend(path, "POST", { kind: "review", rating, body });
      setWriting(false);
      await load();
    } catch (err) {
      setFormError((e) => ({ ...e, review: err.message }));
    } finally {
      setBusy("");
    }
  }

  async function submitComment() {
    if (!commentText.trim()) return setFormError((e) => ({ ...e, comment: t("আগে কিছু লিখুন।", "Write something first.") }));
    setBusy("comment");
    setFormError((e) => ({ ...e, comment: "" }));
    try {
      await apiSend(path, "POST", { kind: "comment", body: commentText });
      setCommentText("");
      await load();
    } catch (err) {
      setFormError((e) => ({ ...e, comment: err.message }));
    } finally {
      setBusy("");
    }
  }

  async function remove(entry) {
    setBusy(`del-${entry._id}`);
    try {
      await apiSend(`/reviews/${entry._id}`, "DELETE", {});
      if (entry.kind === "review") setWriting(false);
      await load();
    } catch (err) {
      setFormError((e) => ({ ...e, [entry.kind]: err.message }));
    } finally {
      setBusy("");
    }
  }

  const loginLink = (label) => (
    <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary btn-sm w-full">{label}</Link>
  );

  // Trip plans / products: shown instead of the forms until the user has a
  // completed booking / order.
  const lockedNote = (
    <div className="flex gap-2.5 text-sm text-base-content/70">
      <HiLockClosed className="w-4 h-4 mt-0.5 shrink-0 text-base-content/40" aria-hidden="true" />
      <p>
        {type === "plan"
          ? t("ট্রিপটি সম্পন্ন করার পর আপনি রেটিং, রিভিউ ও মন্তব্য দিতে পারবেন।", "You can rate, review and comment once you've completed this trip.")
          : t("পণ্যটি কেনার (অর্ডার সম্পন্ন হওয়ার) পর আপনি রেটিং, রিভিউ ও মন্তব্য দিতে পারবেন।", "You can rate, review and comment once you've bought this product (order completed).")}
      </p>
    </div>
  );

  // Sidebar call to action under the rating summary.
  let action;
  if (!user) {
    action = (
      <>
        <p className="text-sm text-base-content/70 mb-3">{t("অভিজ্ঞতা শেয়ার করতে লগ ইন করুন।", "Log in to share your experience.")}</p>
        {loginLink(t("লগ ইন করুন", "Log in"))}
      </>
    );
  } else if (mine) {
    action = <p className="text-sm text-base-content/70">{t("ধন্যবাদ! আপনার রিভিউ নিচে দেখা যাচ্ছে।", "Thanks! Your review is shown in the list.")}</p>;
  } else if (data?.canReview) {
    action = (
      <>
        <p className="text-sm text-base-content/70 mb-3">
          {type === "blog" ? t("লেখাটি কেমন লাগল? রেটিং দিন।", "Enjoyed this post? Give it a rating.") : t("অন্য ভ্রমণকারীদের সিদ্ধান্ত নিতে সাহায্য করুন।", "Help other travellers decide.")}
        </p>
        <button type="button" className="btn btn-primary btn-sm w-full" onClick={() => { setWriting(true); setTab("reviews"); }} disabled={writing}>
          <HiPencil className="w-4 h-4" /> {type === "blog" ? t("রেটিং দিন", "Rate this post") : t("রিভিউ লিখুন", "Write a review")}
        </button>
      </>
    );
  } else {
    action = lockedNote;
  }

  const reviewCount = data?.rating?.count || 0;
  const commentCount = data?.comments?.length || 0;
  const tabs = [
    { key: "reviews", label: t("রিভিউ", "Reviews"), count: reviewCount },
    { key: "comments", label: t("মন্তব্য", "Comments"), count: commentCount },
  ];

  return (
    <section className="mt-12" aria-labelledby="feedback-heading">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <h2 id="feedback-heading" className="text-2xl font-bold text-base-content">{t("ভ্রমণকারীরা যা বলছেন", "What travellers say")}</h2>
        {data && (
          <div role="tablist" aria-label={t("রিভিউ ও মন্তব্য", "Reviews and comments")} className="inline-flex rounded-full bg-base-200 border border-base-300 p-1">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                type="button"
                role="tab"
                aria-selected={tab === tb.key}
                onClick={() => setTab(tb.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === tb.key ? "bg-primary text-primary-content shadow-sm" : "text-base-content/70 hover:text-base-content"}`}
              >
                {tb.label} <span className={tab === tb.key ? "opacity-80" : "text-base-content/40"}>{tb.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {state.loading && !data ? <Spinner /> : state.error && !data ? (
        <ErrorState message={state.error} onRetry={load} />
      ) : data && tab === "reviews" ? (
        <div role="tabpanel" className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] items-start">
          <Summary data={data} filter={starFilter} onFilter={(n) => { setStarFilter(n); setShown(PAGE); }} action={action} />

          <div className="space-y-3 min-w-0">
            {writing && data.canReview && (
              <ReviewForm
                key={mine?._id || "new"}
                initial={mine}
                editing={Boolean(mine)}
                busy={busy === "review"}
                error={formError.review}
                onSubmit={submitReview}
                onCancel={() => { setWriting(false); setFormError((e) => ({ ...e, review: "" })); }}
              />
            )}
            {mine && !writing && (
              <ReviewCard entry={mine} own busy={Boolean(busy)} onDelete={() => remove(mine)} onEdit={data.canReview ? () => setWriting(true) : null} />
            )}
            {formError.review && !writing && <p role="alert" className="text-sm text-error">{formError.review}</p>}

            {(reviewCount > 0 || starFilter > 0) && (
              <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                <p className="text-sm text-base-content/60">
                  {starFilter
                    ? <>{t(`${starFilter} স্টারের রিভিউ`, `Showing ${starFilter}-star reviews`)} · <button type="button" className="link link-primary" onClick={() => setStarFilter(0)}>{t("সব দেখুন", "Show all")}</button></>
                    : t("সব রিভিউ", "All reviews")}
                </p>
                <select className="select select-bordered select-sm bg-base-200 w-auto" aria-label={t("সাজান", "Sort")} value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">{t("নতুন আগে", "Newest first")}</option>
                  <option value="highest">{t("বেশি রেটিং আগে", "Highest rated")}</option>
                  <option value="lowest">{t("কম রেটিং আগে", "Lowest rated")}</option>
                </select>
              </div>
            )}

            {reviews.length === 0 && !mine ? (
              <div className="rounded-box border border-dashed border-base-300 p-10 text-center">
                <HiStar className="w-10 h-10 mx-auto text-warning/60" aria-hidden="true" />
                <p className="font-semibold text-base-content mt-2">{t("এখনো কোনো রিভিউ নেই", "No reviews yet")}</p>
                <p className="text-sm text-base-content/60 mt-1">
                  {type === "blog" ? t("এই লেখাটি পড়ে কেমন লাগল জানান।", "Tell others what you thought of this post.") : data.canReview ? t("প্রথম রিভিউটি হতে পারে আপনার।", "Be the first to share your experience.") : t("যাঁরা কিনেছেন বা ট্রিপ সম্পন্ন করেছেন, তাঁদের রিভিউ এখানে দেখা যাবে।", "Reviews from customers who bought it or completed the trip will appear here.")}
                </p>
              </div>
            ) : (
              reviews.slice(0, shown).map((r) => <ReviewCard key={r._id} entry={r} />)
            )}
            {reviews.length > shown && (
              <button type="button" className="btn btn-soft btn-sm w-full" onClick={() => setShown((n) => n + PAGE * 2)}>
                {t(`আরও রিভিউ দেখুন (${reviews.length - shown})`, `Show more reviews (${reviews.length - shown})`)}
              </button>
            )}
          </div>
        </div>
      ) : data ? (
        <div role="tabpanel" className="max-w-3xl space-y-4">
          {user && !data.canReview ? (
            <div className="rounded-box border border-base-300 bg-base-100 p-4">{lockedNote}</div>
          ) : user ? (
            <form onSubmit={(e) => { e.preventDefault(); submitComment(); }} className="flex gap-3 items-start">
              <Avatar name={user.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-end gap-2 rounded-box border border-base-300 bg-base-100 p-2 focus-within:border-primary">
                  <textarea
                    className="flex-1 bg-transparent resize-none outline-none text-sm px-2 py-1.5 min-h-10"
                    rows={commentText.includes("\n") || commentText.length > 80 ? 3 : 1}
                    maxLength={MAX_BODY}
                    placeholder={t("আপনার মন্তব্য লিখুন…", "Write a comment…")}
                    aria-label={t("মন্তব্য", "Comment")}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm btn-square" disabled={busy === "comment" || !commentText.trim()} aria-label={t("পোস্ট করুন", "Post")} title={t("পোস্ট করুন", "Post")}>
                    {busy === "comment" ? <span className="loading loading-spinner loading-xs" /> : <HiPaperAirplane className="w-4 h-4 rotate-90" />}
                  </button>
                </div>
                {formError.comment && <p role="alert" className="text-sm text-error mt-1">{formError.comment}</p>}
              </div>
            </form>
          ) : (
            <div className="rounded-box border border-base-300 bg-base-100 p-4 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-base-content/70">{t("মন্তব্য করতে লগ ইন করুন।", "Log in to comment.")}</p>
              <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary btn-sm">{t("লগ ইন করুন", "Log in")}</Link>
            </div>
          )}

          {commentCount === 0 ? (
            <div className="rounded-box border border-dashed border-base-300 p-10 text-center">
              <HiChatAlt2 className="w-10 h-10 mx-auto text-primary/50" aria-hidden="true" />
              <p className="font-semibold text-base-content mt-2">{t("এখনো কোনো মন্তব্য নেই", "No comments yet")}</p>
              <p className="text-sm text-base-content/60 mt-1">{data.canReview || !user ? t("প্রথম মন্তব্যটি হতে পারে আপনার।", "Be the first to comment.") : t("এখানে এখনো কেউ মন্তব্য করেননি।", "Nobody has commented here yet.")}</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {data.comments.map((c) => (
                <li key={c._id} className="flex gap-3 items-start">
                  <Avatar name={c.userName} />
                  <div className="min-w-0 flex-1">
                    <div className="rounded-box rounded-tl-none bg-base-200 border border-base-300 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-base-content">{c.userName}</span>
                        {c.own && (
                          <button type="button" onClick={() => remove(c)} disabled={Boolean(busy)} className="btn btn-ghost btn-xs btn-square text-error" aria-label={t("মুছে ফেলুন", "Delete")} title={t("মুছে ফেলুন", "Delete")}>
                            <HiTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-base-content/80 mt-1 whitespace-pre-line break-words">{c.body}</p>
                    </div>
                    <time dateTime={c.createdAt} className="block text-xs text-base-content/40 mt-1 ml-1">{timeAgo(c.createdAt, lang)}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
