// Service Worker — ATS Tech Control
// Gère les push notifications en arrière-plan (app fermée ou onglet inactif)

self.addEventListener('push', event => {
  const data = event.data?.json() ?? { title: 'ATS Tech', body: 'Nouvelle notification' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [300, 100, 300],
      data: { link: data.link ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.navigate(link);
        return existing.focus();
      }
      return clients.openWindow(link);
    })
  );
});
