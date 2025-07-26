const CACHE_NAME = 'health-diary-v1';
const BASE_PATH = '/health-diary/'; // Учитываем поддиректорию проекта

const urlsToCache = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.webmanifest',
    BASE_PATH + 'style.css',
    BASE_PATH + 'js/main.js',
    BASE_PATH + 'js/daily-tracker.js',
    BASE_PATH + 'js/workout.js',
    BASE_PATH + 'js/storage.js',
    BASE_PATH + 'js/history.js',
    BASE_PATH + 'js/analytics.js',
    BASE_PATH + 'js/settings.js',
    BASE_PATH + 'js/export.js',
    BASE_PATH + 'js/theme.js',
    BASE_PATH + 'js/utils.js',
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
    const requestUrl = new URL(event.request.url);

    // Игнорируем запросы к GitHub API
    if (requestUrl.origin === 'https://api.github.com') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэш или сетевой запрос
                return response || fetch(event.request);
            })
    );

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэш или сетевой запрос
                return response || fetch(event.request)
                    .catch(() => {
                        // Fallback для основных страниц
                        if (event.request.mode === 'navigate') {
                            return caches.match(BASE_PATH + 'index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
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
