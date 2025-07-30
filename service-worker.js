const CACHE_NAME = 'health-diary-v5'; // Увеличьте версию
const OFFLINE_URL = 'index.html';
const CACHE_URLS = [
    '/',  // Важно добавить корневой путь
    'index.html',
    // Раскомментируйте реальные пути к файлам
    // 'css/main.css',
    // 'js/app.js',
    // 'js/daily-tracker.js',
    // 'js/history.js',
    // 'js/workout.js',
    // 'js/analytics.js',
    // 'js/data-manager.js',
    // 'js/storage.js',
    // 'js/utils.js',
    'manifest.webmanifest',
    'icons/android-icon-192x192.png',
    'icons/android-icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        try {
            const cache = await caches.open(CACHE_NAME);

            // Кэшируем основные ресурсы с обработкой ошибок
            await Promise.all(CACHE_URLS.map(url => {
                return cache.add(url).catch(err => {
                    console.warn(`[SW] Не удалось кэшировать ${url}:`, err);
                });
            }));

            // Принудительно переводим SW в активное состояние
            self.skipWaiting();

            console.log('[SW] Установлен и ресурсы закэшированы');
        } catch (err) {
            console.error('[SW] Критическая ошибка при установке:', err);
        }
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        // Удаляем старые кэши
        const keys = await caches.keys();
        await Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) {
                console.log(`[SW] Удаляем старый кэш: ${key}`);
                return caches.delete(key);
            }
        }));

        // Требуем контроля над всеми клиентами
        await self.clients.claim();
        console.log('[SW] Активирован и готов к работе');
    })());
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const requestUrl = new URL(request.url);

    // Игнорируем запросы к GitHub API и внешние ресурсы
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    // Игнорируем POST-запросы и другие методы
    if (request.method !== 'GET') {
        return;
    }

    event.respondWith((async () => {
        // Для навигационных запросов - особый подход
        if (request.mode === 'navigate') {
            try {
                // Пытаемся загрузить из сети
                const networkResponse = await fetch(request);
                return networkResponse;
            } catch (error) {
                // Возвращаем офлайн-страницу из кэша
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(OFFLINE_URL);
                return cachedResponse || new Response('Офлайн-страница');
            }
        }

        try {
            // Пытаемся получить из кэша
            const cachedResponse = await caches.match(request);
            if (cachedResponse) return cachedResponse;

            // Загружаем из сети
            const networkResponse = await fetch(request);

            // Клонируем и кэшируем ответ
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, responseToCache);

            return networkResponse;
        } catch (error) {
            // Возвращаем заглушку для API запросов
            if (requestUrl.pathname.startsWith('/api')) {
                return new Response(JSON.stringify({ error: 'Офлайн режим' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Для статических ресурсов возвращаем заглушки
            if (requestUrl.pathname.endsWith('.css')) {
                return new Response('/* Офлайн CSS */', { headers: { 'Content-Type': 'text/css' }});
            }

            if (requestUrl.pathname.endsWith('.js')) {
                return new Response('// Офлайн JS', { headers: { 'Content-Type': 'application/javascript' }});
            }

            return new Response('Офлайн-контент');
        }
    })());
});
