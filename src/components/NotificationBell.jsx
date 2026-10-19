import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiBell, HiOutlineBell, HiX } from "react-icons/hi";
import { notificationPath, useNotifications } from "../context/NotificationContext";
import { useLang } from "../context/LanguageContext";
import { timeAgo } from "../lib/timeAgo";

// One notification row. Clicking marks it read and opens its data.url.
export function NotificationItem({ n, onOpen, children }) {
  const { t, lang } = useLang();
  const { markRead } = useNotifications();
  const navigate = useNavigate();
  const path = notificationPath(n);

  function open() {
    markRead(n);
    onOpen?.();
    if (path) navigate(path);
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${n.isRead ? "" : "bg-primary/5"}`}>
      <span
        aria-hidden="true"
        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? "bg-transparent" : "bg-primary"}`}
      />
      <button type="button" onClick={open} className="min-w-0 flex-1 text-left group">
        <span className={`block text-sm leading-snug group-hover:text-primary ${n.isRead ? "text-base-content/80" : "font-semibold text-base-content"}`}>
          {n.title}
          {!n.isRead && <span className="sr-only"> ({t("অপঠিত", "unread")})</span>}
        </span>
        {n.message && <span className="block text-sm text-base-content/60 mt-0.5 line-clamp-2">{n.message}</span>}
        <time dateTime={n.createdAt} className="block text-xs text-base-content/40 mt-1">{timeAgo(n.createdAt, lang)}</time>
      </button>
      {children}
    </div>
  );
}

// "Turn on notifications" card. Permission is only requested on click.
export function PushPrompt({ className = "" }) {
  const { t } = useLang();
  const { showPushPrompt, enablePush, dismissPrompt } = useNotifications();
  const [busy, setBusy] = useState(false);
  if (!showPushPrompt) return null;

  async function enable() {
    setBusy(true);
    try {
      await enablePush();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex items-start gap-3 rounded-box border border-primary/30 bg-primary/10 p-3 ${className}`}>
      <HiBell className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-base-content">{t("বুকিংয়ের আপডেট পেতে নোটিফিকেশন চালু করুন", "Turn on notifications for booking updates")}</p>
        <button type="button" onClick={enable} disabled={busy} className="btn btn-primary btn-xs mt-2">
          {busy && <span className="loading loading-spinner loading-xs" />} {t("চালু করুন", "Turn on")}
        </button>
      </div>
      <button type="button" onClick={dismissPrompt} aria-label={t("বন্ধ করুন", "Dismiss")} className="btn btn-ghost btn-xs btn-circle">
        <HiX className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function NotificationBell() {
  const { t } = useLang();
  const { enabled, unread, recent, recentError, loadRecent, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  // Load the list on open; close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    loadRecent();
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, loadRecent]);

  if (!enabled) return null;
  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread ? t(`নোটিফিকেশন (${unread}টি অপঠিত)`, `Notifications (${unread} unread)`) : t("নোটিফিকেশন", "Notifications")}
        title={t("নোটিফিকেশন", "Notifications")}
        className={`btn btn-ghost btn-sm btn-circle relative ${open ? "text-primary" : ""}`}
      >
        {unread > 0 ? <HiBell className="w-5 h-5" aria-hidden="true" /> : <HiOutlineBell className="w-5 h-5" aria-hidden="true" />}
        {unread > 0 && (
          <span aria-hidden="true" className="badge badge-error badge-xs absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] font-bold">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 z-50 rounded-box bg-base-200 border border-base-300 shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-base-300">
            <h2 className="font-semibold text-base-content">{t("নোটিফিকেশন", "Notifications")}</h2>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="btn btn-ghost btn-xs text-primary">
                {t("সব পড়া হয়েছে", "Mark all read")}
              </button>
            )}
          </div>

          <PushPrompt className="m-3" />

          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto divide-y divide-base-300">
            {recent === null && !recentError && (
              <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" aria-label={t("লোড হচ্ছে…", "Loading…")} /></div>
            )}
            {recent === null && recentError && (
              <p role="alert" className="px-4 py-6 text-sm text-center text-base-content/60">{recentError}</p>
            )}
            {recent && recent.length === 0 && (
              <p className="px-4 py-8 text-sm text-center text-base-content/50">{t("এখনো কোনো নোটিফিকেশন নেই।", "No notifications yet.")}</p>
            )}
            {recent && recent.map((n) => <NotificationItem key={n._id} n={n} onOpen={close} />)}
          </div>

          <Link to="/notifications" onClick={close} className="block px-4 py-2.5 text-sm text-center text-primary border-t border-base-300 hover:bg-base-300/50">
            {t("সব নোটিফিকেশন দেখুন", "See all notifications")}
          </Link>
        </div>
      )}
    </div>
  );
}
