import { getSettings, saveSettings } from './storage.js';

// Глобальная переменная для хранения таймера
let reminderTimer = null;

export function initSettings() {
    const settingsForm = document.getElementById('settings-form');
    if (!settingsForm) return;

    const settings = getSettings();

    // Установка значений
    document.getElementById('reminder-toggle').checked = settings.reminderActive || false;
    document.getElementById('reminder-time').value = settings.reminderTime || '20:00';

    // Обработчик сохранения настроек
    settingsForm.addEventListener('submit', e => {
        e.preventDefault();

        const newSettings = {
            reminderActive: document.getElementById('reminder-toggle').checked,
            reminderTime: document.getElementById('reminder-time').value
        };

        saveSettings(newSettings);
        alert('Настройки успешно сохранены!');

        // Перезапускаем напоминания
        setupReminders();
    });

    // Запуск напоминаний
    setupReminders();
}

function setupReminders() {
    // Очищаем предыдущий таймер
    if (reminderTimer) {
        clearInterval(reminderTimer);
    }

    const settings = getSettings();
    if (!settings.reminderActive) return;

    // Запускаем проверку каждую минуту
    reminderTimer = setInterval(checkReminder, 60000);
    checkReminder(); // Проверяем сразу после запуска
}

function checkReminder() {
    const settings = getSettings();
    if (!settings.reminderActive) return;

    const now = new Date();
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);

    // Проверяем совпадение времени
    if (now.getHours() === hours && now.getMinutes() === minutes) {
        const today = new Date().toISOString().split('T')[0];
        const healthData = getHealthData();

        // Проверяем, были ли внесены данные сегодня
        if (!healthData[today] || healthData[today].length === 0) {
            showNotification();
        }
    }
}

function showNotification() {
    if (!('Notification' in window)) {
        alert('Ваш браузер не поддерживает уведомления');
        return;
    }

    if (Notification.permission === 'granted') {
        new Notification('Дневник здоровья', {
            body: 'Пора внести данные за сегодня!'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Дневник здоровья', {
                    body: 'Пора внести данные за сегодня!'
                });
            }
        });
    }
}
