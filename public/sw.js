// Service worker minimal — gère uniquement les Web Push admin.
// Pas de cache offline pour l'instant (le site est SSR/dynamic, peu de gain).
//
// Étendre vers PWA complète (Workbox + offline) reste possible en gardant
// les listeners push/notificationclick en place.

self.addEventListener("install", (event) => {
  // Active immédiatement le nouveau SW à la place de l'ancien.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { title: "Bonafone", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Bonafone";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon",
    badge: payload.badge || "/icon",
    tag: payload.tag || "bonafone-admin",
    // renotify: chaque nouvel event refait sonner même si un précédent avec
    // même tag est encore visible.
    renotify: true,
    requireInteraction: false,
    data: {
      url: payload.url || "/admin",
      ts: Date.now(),
    },
    // Vibration pattern (mobile uniquement).
    vibrate: [120, 60, 120],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/admin";

  // Réutilise un onglet admin déjà ouvert plutôt que d'en créer un nouveau.
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          // Match large : tout onglet sur /admin → on focus et on navigue.
          if (client.url.includes("/admin") && "focus" in client) {
            client.navigate(target).catch(() => {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }
      }),
  );
});
