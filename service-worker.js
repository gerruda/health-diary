const CACHE_NAME = 'health-diary-v1';
const BASE_PATH = '/health-diary/'; // Учитываем поддиректорию проекта

const urlsToCache = [
    BASE_PATH,
    BASE_PATH + 'manifest.webmanifest',
    BASE_PATH + 'style.css',
    BASE_PATH + 'icons/android-icon-192x192.png',
    BASE_PATH + 'icons/android-icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Кэшируем основные файлы, игнорируя ошибки для остальных
                const cachePromises = urlsToCache.map(url => {
                    return cache.add(url).catch(error => {
                        console.log(`Failed to cache ${url}:`, error);
                        return Promise.resolve();
                    });
                });
                return Promise.all(cachePromises);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    // Удаляем старые кэши
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

console.log('Service Worker loaded');
