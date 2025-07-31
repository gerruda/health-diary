import { getSettings, saveSettings } from './storage.js';

export function initSettings() {
    const settingsForm = document.getElementById('settings-form');
    if (!settingsForm) return;

    const settings = getSettings();

    document.getElementById('reminder-toggle').checked = settings.reminderActive || false;
    document.getElementById('reminder-time').value = settings.reminderTime || '20:00';

    settingsForm.addEventListener('submit', e => {
        e.preventDefault();

        const newSettings = {
            reminderActive: document.getElementById('reminder-toggle').checked,
            reminderTime: document.getElementById('reminder-time').value
        };

        saveSettings(newSettings);
        alert('Настройки успешно сохранены!');

        // Отправляем настройки в Service Worker
        sendSettingsToSW(newSettings);

        // Запрашиваем разрешение на уведомления
        requestNotificationPermission();
    });

    // Инициализируем Service Worker
    initServiceWorker();
}

// Инициализация Service Worker
function initServiceWorker() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Запрашиваем разрешение на уведомления
        requestNotificationPermission();

        // Отправляем текущие настройки в SW
        const settings = getSettings();
        sendSettingsToSW(settings);
    }
}

// Отправка настроек в Service Worker
function sendSettingsToSW(settings) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_SETTINGS',
            settings: settings
        });
    }
}

// Запрос разрешения на уведомления
function requestNotificationPermission() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Разрешение на уведомления получено');
            }
        });
    }
}

// Функция для сохранения данных в кэше (чтобы SW мог проверить)
export function saveDiaryData(data) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_DIARY_DATA',
            data: data
        });
    }
}
