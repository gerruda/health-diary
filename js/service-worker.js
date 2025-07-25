self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
    console.log('Service Worker installed');
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    console.log('Service Worker activated');
});

// Простая стратегия кэширования
const CACHE_NAME = 'health-diary-v1';
const urlsToCache = [
    '/health-diary/',
    '/health-diary/index.html',
    '/health-diary/manifest.json',
    '/health-diary/icons/android-icon-192x192.png',
    '/health-diary/icons/android-icon-512x512.png',
    '/health-diary/favicon.ico',
    '/health-diary/style.css',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
