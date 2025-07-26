import { initDailyTracker } from './daily-tracker.js';
import { initWorkoutTracker } from './workout.js';
import { initHistory } from './history.js';
import { initAnalytics } from './analytics.js';
import { initSettings } from './settings.js';
import { initExport } from './export.js';
import { initTabs } from './utils.js';
import {migrateData} from "./storage.js";
import { initTheme } from './theme.js';

// Форматирование даты (вынесем позже в utils.js)
function formatDate(date, options) {
    return date.toLocaleDateString('ru-RU', options);
}


document.addEventListener('DOMContentLoaded', () => {
    // Регистрация Service Worker
    // if ('serviceWorker' in navigator) {
    //     navigator.serviceWorker.register('js/service-worker.js')
    //         .then(reg => console.log('SW registered:', reg))
    //         .catch(err => console.error('SW registration failed:', err));
    // }

    // Сначала инициализация вкладок
    initTabs();
    migrateData();

    // Затем инициализация всех модулей с проверкой
    try {
        initTheme();
    } catch (e) {
        console.error('Ошибка инициализации темы:', e);
    }
    try {
        initDailyTracker();
    } catch (e) {
        console.error('Ошибка инициализации ежедневного трекера:', e);
    }

    try {
        initWorkoutTracker();
    } catch (e) {
        console.error('Ошибка инициализации трекера тренировок:', e);
    }

    try {
        initHistory();
    } catch (e) {
        console.error('Ошибка инициализации истории:', e);
    }

    try {
        initAnalytics();
    } catch (e) {
        console.error('Ошибка инициализации аналитики:', e);
    }

    try {
        initSettings();
    } catch (e) {
        console.error('Ошибка инициализации настроек:', e);
    }

    try {
        initExport();
    } catch (e) {
        console.error('Ошибка инициализации экспорта:', e);
    }

    // Установка текущей даты
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
        } else {
            console.warn('Элемент #current-date не найден');
        }
    } catch (e) {
        console.error('Ошибка форматирования даты:', e);
    }

    // Проверяем существование элемента перед установкой интервала
    const timeInput = document.getElementById('entry-time');
    if (timeInput) {
        setInterval(() => {
            const now = new Date();
            timeInput.value = now.toTimeString().substring(0, 5);
        }, 60000);
    }
});
