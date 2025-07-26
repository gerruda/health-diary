self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
    console.log('Service Worker installed');
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    console.log('Service Worker activated');
});
