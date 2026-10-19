import { useCallback, useEffect, useRef, useState } from "react";
import { HiTrash } from "react-icons/hi";
import { useLang } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { apiGet, apiSend } from "../lib/api";
import PageMeta from "../components/PageMeta";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import { NotificationItem, PushPrompt } from "../components/NotificationBell";

const LIMIT = 20;

// Every notification for the signed-in traveller, newest first.
export default function NotificationsPage() {
  const { t } = useLang();
  const { unread, markAllRead, refreshCount, recent } = useNotifications();
  const [items, setItems] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(async (nextPage) => {
    const id = ++requestRef.current;
    setError("");
    if (nextPage > 1) setLoadingMore(true);
    try {
      const data = await apiGet(`/notifications/me?page=${nextPage}&limit=${LIMIT}${unreadOnly ? "&unread=true" : ""}`);
      if (id !== requestRef.current) return;
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems((prev) => (nextPage > 1 && prev ? [...prev, ...list.filter((n) => !prev.some((p) => p._id === n._id))] : list));
      setPage(nextPage);
      setPages(Number(data?.pages) || 1);
    } catch (err) {
      if (id === requestRef.current) setError(err.message);
    } finally {
      if (id === requestRef.current) setLoadingMore(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    setItems(null);
    load(1);
  }, [load]);

  // Read state changed from the bell or a toast: mirror it here.
  useEffect(() => {
    if (!recent) return;
    setItems((list) => list && list.map((n) => {
      const fresh = recent.find((r) => r._id === n._id);
      return fresh && fresh.isRead !== n.isRead ? { ...n, isRead: fresh.isRead } : n;
    }));
  }, [recent]);

  async function readAll() {
    setItems((list) => list && (unreadOnly ? [] : list.map((n) => ({ ...n, isRead: true }))));
    await markAllRead();
  }

  async function remove(n) {
    setItems((list) => list && list.filter((x) => x._id !== n._id));
    try {
      await apiSend(`/notifications/${n._id}`, "DELETE");
    } catch {
      load(1);
    }
    refreshCount();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <PageMeta noindex title={t("নোটিফিকেশন", "Notifications")} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("নোটিফিকেশন", "Notifications")}</h1>
        <div className="flex items-center gap-2">
          <label className="label cursor-pointer gap-2 text-sm">
            <input type="checkbox" className="toggle toggle-sm toggle-primary" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            {t("শুধু অপঠিত", "Unread only")}
          </label>
          {unread > 0 && (
            <button type="button" onClick={readAll} className="btn btn-ghost btn-sm text-primary">
              {t("সব পড়া হয়েছে", "Mark all read")}
            </button>
          )}
        </div>
      </div>

      <PushPrompt className="mb-4" />

      {items === null && !error && <Spinner />}
      {items === null && error && <ErrorState message={error} onRetry={() => load(1)} />}
      {items && items.length === 0 && (
        <EmptyState message={unreadOnly ? t("কোনো অপঠিত নোটিফিকেশন নেই।", "No unread notifications.") : t("এখনো কোনো নোটিফিকেশন নেই।", "No notifications yet.")} />
      )}
      {items && items.length > 0 && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden divide-y divide-base-300">
          {items.map((n) => (
            <NotificationItem
              key={n._id}
              n={n}
              onOpen={() => setItems((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))}
            >
              <button
                type="button"
                onClick={() => remove(n)}
                aria-label={t("মুছে ফেলুন", "Delete")}
                title={t("মুছে ফেলুন", "Delete")}
                className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error"
              >
                <HiTrash className="w-4 h-4" aria-hidden="true" />
              </button>
            </NotificationItem>
          ))}
        </div>
      )}
      {items && error && <p role="alert" className="text-sm text-error mt-3">{error}</p>}
      {items && page < pages && (
        <div className="text-center mt-6">
          <button type="button" onClick={() => load(page + 1)} disabled={loadingMore} className="btn btn-ghost btn-sm">
            {loadingMore && <span className="loading loading-spinner loading-xs" />} {t("আরও দেখুন", "Load more")}
          </button>
        </div>
      )}
    </div>
  );
}
