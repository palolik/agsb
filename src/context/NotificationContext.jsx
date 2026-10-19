import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiSend } from "../lib/api";
import { isPushAvailable, notificationPermission, onForegroundMessage } from "../lib/firebase";
import { syncPushToken } from "../lib/push";
import { useAuth } from "./AuthContext";

// The signed-in traveller's notifications (navbar bell, /notifications page)
// and web push: unread count polled every minute while the tab is visible,
// device token registered once notifications are allowed, and pushes that
// arrive while the site is open shown as a toast.
const NotificationContext = createContext(null);

const POLL_MS = 60_000;
const RECENT_LIMIT = 8;
const PROMPT_KEY = "agsb_push_prompt_dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(PROMPT_KEY) === "1";
  } catch {
    return false;
  }
}

// Only same-site paths are followed (data.url comes from the backend).
export function notificationPath(n) {
  const url = n?.data?.url;
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : null;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userKey = user ? user._id || user.id || user.email || "me" : null;

  const [unread, setUnread] = useState(0);
  // Recent list for the bell: null until first loaded.
  const [recent, setRecent] = useState(null);
  const [recentError, setRecentError] = useState("");
  const [pushAvailable, setPushAvailable] = useState(false);
  const [permission, setPermission] = useState(notificationPermission);
  const [promptDismissed, setPromptDismissed] = useState(readDismissed);
  const [toast, setToast] = useState(null);

  // Responses for a previous account are dropped.
  const userRef = useRef(userKey);

  const refreshCount = useCallback(async () => {
    const forUser = userRef.current;
    if (!forUser) return;
    try {
      const data = await apiGet("/notifications/me?limit=1");
      if (userRef.current === forUser) setUnread(Number(data?.unread) || 0);
    } catch {
      // keep the last count; the next poll tries again
    }
  }, []);

  const loadRecent = useCallback(async () => {
    const forUser = userRef.current;
    if (!forUser) return;
    try {
      const data = await apiGet(`/notifications/me?limit=${RECENT_LIMIT}`);
      if (userRef.current !== forUser) return;
      setRecent(Array.isArray(data?.items) ? data.items : []);
      setUnread(Number(data?.unread) || 0);
      setRecentError("");
    } catch (err) {
      if (userRef.current === forUser) setRecentError(err.message);
    }
  }, []);

  // Reset on login / logout / account switch, then poll while visible.
  useEffect(() => {
    userRef.current = userKey;
    setUnread(0);
    setRecent(null);
    setRecentError("");
    setToast(null);
    if (!userKey) return undefined;

    refreshCount();
    const tick = () => {
      if (document.visibilityState === "visible") refreshCount();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [userKey, refreshCount]);

  // Web push: register the token silently if already allowed (never prompt
  // here) and listen for pushes that arrive while the site is open.
  useEffect(() => {
    if (!userKey) return undefined;
    let cancelled = false;
    let unsubscribe = null;
    isPushAvailable().then(async (ok) => {
      if (cancelled) return;
      setPushAvailable(ok);
      if (!ok) return;
      setPermission(notificationPermission());
      if (notificationPermission() === "granted") syncPushToken();
      const off = await onForegroundMessage((payload) => {
        const title = payload?.notification?.title || payload?.data?.title || "";
        const body = payload?.notification?.body || payload?.data?.message || payload?.data?.body || "";
        setToast({ id: Date.now(), title, body, url: notificationPath(payload) });
        loadRecent();
      });
      if (cancelled) off();
      else unsubscribe = off;
    });
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [userKey, loadRecent]);

  const markRead = useCallback(async (n) => {
    if (!n || n.isRead) return;
    setRecent((list) => list && list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await apiSend(`/notifications/${n._id}`, "PATCH", { isRead: true });
    } catch {
      refreshCount();
    }
  }, [refreshCount]);

  const markAllRead = useCallback(async () => {
    setRecent((list) => list && list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try {
      await apiSend("/notifications/read-all", "POST", {});
    } catch {
      loadRecent();
    }
  }, [loadRecent]);

  const remove = useCallback(async (n) => {
    setRecent((list) => list && list.filter((x) => x._id !== n._id));
    if (!n.isRead) setUnread((c) => Math.max(0, c - 1));
    try {
      await apiSend(`/notifications/${n._id}`, "DELETE");
    } catch {
      loadRecent();
    }
  }, [loadRecent]);

  // Called from a click (browsers only show the prompt for a user gesture).
  const enablePush = useCallback(async () => {
    if (!pushAvailable) return "unsupported";
    let result = notificationPermission();
    try {
      if (result === "default") result = await Notification.requestPermission();
    } catch {
      result = notificationPermission();
    }
    setPermission(result);
    if (result === "granted") await syncPushToken();
    return result;
  }, [pushAvailable]);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
    try {
      localStorage.setItem(PROMPT_KEY, "1");
    } catch {
      // storage blocked: hidden for this visit only
    }
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const value = useMemo(() => ({
    enabled: Boolean(userKey),
    unread,
    recent,
    recentError,
    loadRecent,
    refreshCount,
    markRead,
    markAllRead,
    remove,
    pushAvailable,
    permission,
    showPushPrompt: pushAvailable && permission === "default" && !promptDismissed,
    enablePush,
    dismissPrompt,
    toast,
    closeToast,
  }), [userKey, unread, recent, recentError, loadRecent, refreshCount, markRead, markAllRead, remove, pushAvailable, permission, promptDismissed, enablePush, dismissPrompt, toast, closeToast]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
