import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiBell, HiX } from "react-icons/hi";
import { useNotifications } from "../context/NotificationContext";
import { useLang } from "../context/LanguageContext";

const TOAST_MS = 8000;

// Shows a push that arrived while the site was open, and follows clicks on
// background notifications (public/firebase-messaging-sw.js posts
// { type: "agsb:navigate", url } to an already open tab).
export default function NotificationToast() {
  const { t } = useLang();
  const { toast, closeToast } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return undefined;
    const onMessage = (e) => {
      const url = e.data?.type === "agsb:navigate" ? e.data.url : null;
      if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) navigate(url);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(closeToast, TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, closeToast]);

  if (!toast) return null;

  return (
    <div className="toast toast-end toast-bottom z-[60] print:hidden max-w-[calc(100vw-2rem)]">
      <div role="status" aria-live="polite" className="alert bg-base-200 border border-base-300 shadow-xl w-80 max-w-full items-start text-left">
        <HiBell className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {toast.title && <p className="font-semibold text-sm text-base-content">{toast.title}</p>}
          {toast.body && <p className="text-sm text-base-content/70 mt-0.5 line-clamp-3 whitespace-normal">{toast.body}</p>}
          {toast.url && (
            <Link to={toast.url} onClick={closeToast} className="btn btn-primary btn-xs mt-2">
              {t("দেখুন", "View")}
            </Link>
          )}
        </div>
        <button type="button" onClick={closeToast} aria-label={t("বন্ধ করুন", "Close")} className="btn btn-ghost btn-xs btn-circle">
          <HiX className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
