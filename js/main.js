import { initDailyTracker } from './daily-tracker.js';
import { initWorkoutTracker } from './workout.js';
import { initHistory } from './history.js';
import { initAnalytics } from './analytics.js';
import { initSettings } from './settings.js';
import { initExport } from './export.js';
import { initTabs } from './utils.js';

// Форматирование даты (вынесем позже в utils.js)
function formatDate(date, options) {
    return date.toLocaleDateString('ru-RU', options);
}

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация вкладок должна быть первой!
    initTabs();

    // Затем инициализация всех модулей
    initDailyTracker();
    initWorkoutTracker();
    initHistory();
    initAnalytics();
    initSettings();
    initExport();

    // Установка текущей даты
    const today = new Date();
    document.getElementById('current-date').textContent = formatDate(today, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    console.log('Все модули инициализированы');
});
