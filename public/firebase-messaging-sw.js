/* global firebase, importScripts */
// Firebase Cloud Messaging service worker (background web push).
//
// Registered by src/lib/firebase.js as
//   /firebase-messaging-sw.js?apiKey=...&projectId=...&messagingSenderId=...&appId=...
// because a service worker can't read Vite env vars.
// Keep FIREBASE_VERSION on the same version as the `firebase` npm package.
const FIREBASE_VERSION = "13.0.0";

// Clicks: open data.url (a site path such as /bookings/AB12CD/tickets).
// Registered before the Firebase scripts so it runs instead of Firebase's own
// handler, which only focuses an open tab without navigating it.
self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data || {};
  const fcm = data.FCM_MSG || {};
  const target = (fcm.data && fcm.data.url) || data.url || (fcm.fcmOptions && fcm.fcmOptions.link) || "/";
  let url;
  try {
    url = new URL(target, self.location.origin);
  } catch {
    url = new URL("/", self.location.origin);
  }
  if (url.origin !== self.location.origin) url = new URL("/", self.location.origin);

  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const tab = windows.find((c) => new URL(c.url).origin === self.location.origin);
    if (tab) {
      // The app navigates itself (src/components/NotificationToast.jsx).
      await tab.focus();
      tab.postMessage({ type: "agsb:navigate", url: url.pathname + url.search + url.hash });
      return;
    }
    await self.clients.openWindow(url.href);
  })());
});

const params = new URLSearchParams(self.location.search);
const config = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain") || undefined,
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket") || undefined,
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
  importScripts(
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`,
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`
  );
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Messages with a `notification` payload are shown by FCM itself; only
  // data-only messages need showing here.
  messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return;
    const data = payload.data || {};
    if (!data.title) return;
    self.registration.showNotification(data.title, {
      body: data.message || data.body || "",
      icon: "/favicon.svg",
      data: { url: data.url || "/" },
    });
  });
}
