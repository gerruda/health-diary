import DataManager from './data-manager.js';
import { initDailyTracker } from './daily-tracker.js';
import { initWorkoutTracker } from './workout.js';
import { initHistory } from './history.js';
import { initAnalytics } from './analytics.js';
import { initSettings } from './settings.js';
import { initExport } from './export.js';
import { initTabs } from './utils.js';
import { cleanupExercisesList, cleanupWorkoutHistory, migrateData } from "./storage.js";
import { initTheme } from './theme.js';

function formatDate(date, options) {
    return date.toLocaleDateString('ru-RU', options);
}

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация DataManager
    const dataManager = new DataManager();

    initTabs();
    migrateData();
    cleanupWorkoutHistory();
    cleanupExercisesList();

    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
        const registerSW = async () => {
            try {
                // Определяем базовый путь для GitHub Pages
                const basePath = location.pathname.includes('health-diary')
                    ? '/health-diary/'
                    : '/';

                const registration = await navigator.serviceWorker.register(
                    `${basePath}service-worker.js`,
                    { scope: basePath }
                );

                console.log('[SW] Зарегистрирован:', registration);

                // Принудительно обновляем Service Worker при первой загрузке
                if (!navigator.serviceWorker.controller) {
                    await registration.update();
                }
            } catch (error) {
                console.error('[SW] Ошибка регистрации:', error);
            }
        };

        window.addEventListener('load', registerSW);
    }

    try {
        initTheme();
    } catch (e) {
        console.error('Ошибка инициализации темы:', e);
    }

    try {
        initDailyTracker(dataManager);
    } catch (e) {
        console.error('Ошибка инициализации ежедневного трекера:', e);
    }

    try {
        initWorkoutTracker(dataManager); // Также передаем в трекер тренировок
    } catch (e) {
        console.error('Ошибка инициализации трекера тренировок:', e);
    }

    try {
        initHistory(dataManager);
    } catch (e) {
        console.error('Ошибка инициализации истории:', e);
    }

    try {
        initAnalytics(dataManager); // И в аналитику
    } catch (e) {
        console.error('Ошибка инициализации аналитики:', e);
    }

    try {
        initSettings();
    } catch (e) {
        console.error('Ошибка инициализации настроек:', e);
    }

    try {
        initExport(dataManager); // И в экспорт
    } catch (e) {
        console.error('Ошибка инициализации экспорта:', e);
    }

    try {
        const today = new Date();
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            currentDateElement.textContent = formatDate(today, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch (e) {
        console.error('Ошибка форматирования даты:', e);
    }

    const timeInput = document.getElementById('entry-time');
    if (timeInput) {
        setInterval(() => {
            const now = new Date();
            timeInput.value = now.toTimeString().substring(0, 5);
        }, 60000);
    }
});
