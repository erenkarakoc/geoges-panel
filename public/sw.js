/**
 * Service worker of the panel (TASK-0108, REQ-TSK-010, D-132/D-252). It exists for phone
 * notifications only: nothing is cached and no request is intercepted, so the panel always
 * shows live data. The message carries the same words as the panel notification.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = {};
  }
  const title = message.title || "GEOGES Panel";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: message.body || undefined,
      icon: "/assets/brand/icon_primary.svg",
      badge: "/assets/brand/icon_primary.svg",
      lang: "tr",
      tag: message.url || title,
      data: { url: message.url || "/today" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/today", self.location.origin);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === target.origin) {
          return client.focus().then(() => client.navigate(target.href));
        }
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
