// service-worker.js
const CACHE_NAME = 'health-diary-cache-v1';
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
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Cache addAll error:', error);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
