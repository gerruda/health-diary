import { getSettings, saveSettings } from './storage.js';

export function initSettings() {
    const saveSettingsBtn = document.getElementById('save-settings');
    if (!saveSettingsBtn) return;

    const settings = getSettings();

    // Установка текущих настроек
    document.getElementById('reminder-time').value = settings.reminderTime;
    document.getElementById('reminder-active').checked = settings.reminderActive;

    // Обработчик сохранения настроек
    saveSettingsBtn.addEventListener('click', saveSettingsHandler);

    // Проверка напоминаний
    checkReminders();
    setInterval(checkReminders, 60000);
}

function saveSettingsHandler() {
    const settings = {
        reminderTime: document.getElementById('reminder-time').value,
        reminderActive: document.getElementById('reminder-active').checked
    };

    saveSettings(settings);
    alert('Настройки сохранены!');
}

function checkReminders() {
    if (!settings.reminderActive) return;

    const now = new Date();
    const [reminderHours, reminderMinutes] = settings.reminderTime.split(':').map(Number);

    if (
        now.getHours() === reminderHours &&
        now.getMinutes() === reminderMinutes &&
        now.getSeconds() < 5 // Чтобы срабатывало только один раз в минуту
    ) {
        // Проверяем, были ли сегодня введены данные
        const today = new Date().toISOString().split('T')[0];
        const hasEntries = healthData[today] && healthData[today].length > 0;

        if (!hasEntries) {
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
    }
}

