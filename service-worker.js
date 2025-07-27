const CACHE_NAME = 'health-diary-v4';
const OFFLINE_URL = 'index.html';
const CACHE_URLS = [
    'index.html',
    // 'css/main.css',
    // 'js/app.js',
    // 'js/diary.js',
    // 'js/training.js',
    // 'js/analytics.js',
    // 'js/export.js',
    // 'js/importData.js',
    // 'js/settings.js',
    // 'js/utils.js',
    'manifest.webmanifest',
    'icons/android-icon-192x192.png',
    'icons/android-icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        try {
            const cache = await caches.open(CACHE_NAME);

            // Кэшируем основные ресурсы
            await cache.addAll(CACHE_URLS);

            // Кэшируем fallback страницу
            await cache.add(OFFLINE_URL);

            console.log('[SW] Установлен и ресурсы закэшированы');
        } catch (err) {
            console.error('[SW] Ошибка при установке:', err);
            throw err;
        }
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) {
                console.log(`[SW] Удаляем старый кэш: ${key}`);
                return caches.delete(key);
            }
        }));
        console.log('[SW] Активирован');
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const { request } = event;

    // Пропускаем POST-запросы и внешние ресурсы
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
        return event.respondWith(fetch(request));
    }

    event.respondWith((async () => {
        try {
            // Пытаемся получить из кэша
            const cachedResponse = await caches.match(request);
            if (cachedResponse) return cachedResponse;

            // Загружаем из сети
            const networkResponse = await fetch(request);

            // Клонируем ответ для кэширования
            const responseToCache = networkResponse.clone();

            // Кэшируем только успешные ответы
            if (networkResponse.status === 200) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, responseToCache);
            }

            return networkResponse;
        } catch (error) {
            // Fallback для навигационных запросов
            if (request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
            }

            console.error('[SW] Ошибка fetch:', error);
            throw error;
        }
    })());
});
