// Firebase Cloud Messaging (web push) for the signed-in traveller.
//
// Push is optional: when the VITE_FIREBASE_* config or the VAPID key is
// missing, or the browser can't do web push, every helper here quietly
// returns null / false and the rest of the site works as before.
// The Firebase SDK is loaded on demand so it stays out of the main bundle.

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || "",
};
const VAPID_KEY = env.VITE_FIREBASE_VAPID_KEY || "";

// The service worker can't read Vite env, so it gets the config in its URL
// (see public/firebase-messaging-sw.js). Its own scope keeps it from
// controlling the site's pages.
const SW_URL = "/firebase-messaging-sw.js";
const SW_SCOPE = "/firebase-cloud-messaging-push-scope";

export const pushConfigured = Boolean(
  VAPID_KEY && firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId
);

let messagingPromise = null;

// Resolves to { messaging, mod } (mod = the firebase/messaging module), or
// null when push isn't available here.
function loadMessaging() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (!pushConfigured || typeof window === "undefined") return null;
      if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
      const [{ initializeApp, getApps }, mod] = await Promise.all([
        import("firebase/app"),
        import("firebase/messaging"),
      ]);
      if (!(await mod.isSupported())) return null;
      const app = getApps()[0] || initializeApp(firebaseConfig);
      return { messaging: mod.getMessaging(app), mod };
    })().catch(() => null);
  }
  return messagingPromise;
}

// True when this browser can receive pushes from this site.
export async function isPushAvailable() {
  return Boolean(await loadMessaging());
}

// "granted" | "denied" | "default", or "unsupported" without the API.
export function notificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

let registrationPromise = null;
function registerWorker() {
  if (!registrationPromise) {
    const params = new URLSearchParams(
      Object.entries(firebaseConfig).filter(([, value]) => value)
    );
    registrationPromise = navigator.serviceWorker
      .register(`${SW_URL}?${params}`, { scope: SW_SCOPE })
      .catch((err) => {
        registrationPromise = null;
        throw err;
      });
  }
  return registrationPromise;
}

// The FCM token for this browser, or null. Never asks for permission: only
// works once the visitor has already allowed notifications.
export async function getPushToken() {
  if (notificationPermission() !== "granted") return null;
  const loaded = await loadMessaging();
  if (!loaded) return null;
  try {
    const serviceWorkerRegistration = await registerWorker();
    return (await loaded.mod.getToken(loaded.messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration })) || null;
  } catch {
    return null;
  }
}

// Invalidates this browser's FCM token (logout). Best effort.
export async function deletePushToken() {
  const loaded = await loadMessaging();
  if (!loaded) return;
  try {
    await loaded.mod.deleteToken(loaded.messaging);
  } catch {
    // no token, or the network is down: nothing more to do
  }
}

// Calls handler(payload) for pushes that arrive while a tab is visible
// (FCM doesn't show those itself). Resolves to an unsubscribe function.
export async function onForegroundMessage(handler) {
  const loaded = await loadMessaging();
  if (!loaded) return () => {};
  return loaded.mod.onMessage(loaded.messaging, handler);
}
