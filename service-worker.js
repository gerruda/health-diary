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
    // Для API-запросов используем StaleWhileRevalidate
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            caches.open('api-cache').then(cache => {
                return cache.match(event.request).then(response => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return response || fetchPromise;
                });
            })
        );
    }
    // Для статических ресурсов - CacheFirst
    else {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
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
