const CACHE_NAME = 'health-diary-v6'; // Увеличьте версию
const OFFLINE_URL = 'index.html';
const CACHE_URLS = [
    '/',
    // 'index.html',
    // 'js/main.js',
    // 'js/daily-tracker.js',
    // 'js/history.js',
    // 'js/workout.js',
    // 'js/analytics.js',
    // 'js/settings.js',
    // 'js/export.js',
    // 'js/data-manager.js',
    // 'js/storage.js',
    // 'js/utils.js',
    // 'js/theme.js',
    'manifest.webmanifest',
    'icons/android-icon-192x192.png',
    'icons/android-icon-512x512.png',
    // 'style.css'
];

// Добавляем глобальную переменную для хранения настроек
let appSettings = {
    reminderActive: true,
    reminderTime: '20:00'
};

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        try {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(CACHE_URLS);
            self.skipWaiting();
            console.log('[SW] Установлен и ресурсы закэшированы');
        } catch (err) {
            console.error('[SW] Ошибка при установке:', err);
        }
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        // Удаляем старые кэши
        const keys = await caches.keys();
        await Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) {
                return caches.delete(key);
            }
        }));

        // Загружаем настройки при активации
        await loadSettings();

        // Запускаем фоновую проверку напоминаний
        startBackgroundSync();

        await self.clients.claim();
        console.log('[SW] Активирован и готов к работе');
    })());
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const requestUrl = new URL(request.url);

    // Игнорируем внешние ресурсы и POST-запросы
    if (requestUrl.origin !== self.location.origin || request.method !== 'GET') {
        return;
    }

    event.respondWith((async () => {
        // Для навигационных запросов
        if (request.mode === 'navigate') {
            try {
                return await fetch(request);
            } catch (error) {
                const cache = await caches.open(CACHE_NAME);
                return await cache.match(OFFLINE_URL) || new Response('Офлайн-страница');
            }
        }

        try {
            // Пытаемся получить из кэша
            const cachedResponse = await caches.match(request);
            if (cachedResponse) return cachedResponse;

            // Загружаем из сети
            const networkResponse = await fetch(request);
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        } catch (error) {
            return new Response('Офлайн-контент');
        }
    })());
});

// Функция для загрузки настроек
async function loadSettings() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match('settings-data');

        if (response) {
            appSettings = await response.json();
            console.log('[SW] Настройки загружены:', appSettings);
        }
    } catch (error) {
        console.error('[SW] Ошибка загрузки настроек:', error);
    }
}

// Функция для фоновой проверки напоминаний
function startBackgroundSync() {
    // Проверяем каждые 15 минут
    setInterval(async () => {
        if (!appSettings.reminderActive) return;

        const now = new Date();
        const [hours, minutes] = appSettings.reminderTime.split(':').map(Number);

        // Проверяем совпадение времени (с допуском ±1 минута)
        if (Math.abs(now.getHours() - hours) <= 1 &&
            Math.abs(now.getMinutes() - minutes) <= 1) {

            // Проверяем, были ли внесены данные сегодня
            const hasData = await checkTodayData();

            if (!hasData) {
                showNotification();
            }
        }
    }, 15 * 60 * 1000); // 15 минут
}

// Проверка данных за сегодня
async function checkTodayData() {
    try {
        // Получаем данные из кэша
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match('diary-data');

        if (!response) return false;

        const diaryData = await response.json();
        const today = new Date().toISOString().split('T')[0];

        return diaryData[today] && diaryData[today].length > 0;
    } catch (error) {
        console.error('[SW] Ошибка проверки данных:', error);
        return false;
    }
}

// Показ уведомления
function showNotification() {
    self.registration.showNotification('Дневник здоровья', {
        body: 'Пора внести данные за сегодня!',
        icon: 'icons/android-icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: 'health-reminder'
    });
}

// Обработчик уведомлений
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({type: 'window'}).then(clients => {
            if (clients.length > 0) {
                return clients[0].focus();
            }
            return self.clients.openWindow('/');
        })
    );
});

// Прием сообщений от основного приложения
self.addEventListener('message', event => {
    if (event.data.type === 'UPDATE_SETTINGS') {
        appSettings = event.data.settings;
        console.log('[SW] Настройки обновлены:', appSettings);

        // Сохраняем настройки в кэше
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                const response = new Response(JSON.stringify(appSettings));
                return cache.put('settings-data', response);
            })
        );
    }
});
