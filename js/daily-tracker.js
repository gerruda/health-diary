import {
    getHealthData,
    saveHealthData,
    getWeightConditions,
    saveWeightConditions,
} from './storage.js';
import { loadHistoryData } from './history.js'; // Импортируем функцию обновления истории

export function initDailyTracker() {
    const workoutSelect = document.getElementById('workout');
    const rpeContainer = document.getElementById('rpe-container');
    const dailyForm = document.getElementById('daily-form');

    if (!dailyForm) return;

    // Установка текущей даты и времени
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('entry-date').value = dateStr;

    // Инициализация поля времени
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.id = 'entry-time';
    timeInput.value = today.toTimeString().substring(0, 5);
    document.querySelector('.form-group:last-child').prepend(timeInput);

    // Показ/скрытие RPE
    workoutSelect.addEventListener('change', () => {
        rpeContainer.style.display = workoutSelect.value !== 'none' ? 'block' : 'none';
    });

    // Загрузка данных за сегодня
    loadTodayData(dateStr);

    // Обработка отправки формы
    dailyForm.addEventListener('submit', (e) => handleDailySubmit(e, dateStr));
}

function loadTodayData(date) {
    const healthData = getHealthData();

    if (healthData[date]?.length > 0) {
        const lastEntry = healthData[date][healthData[date].length - 1];
        populateForm(lastEntry);
    }
}

function populateForm(data) {
    if (data.pulse) document.getElementById('pulse').value = data.pulse;
    if (data.sleepDuration) {
        const [hours, minutes] = data.sleepDuration.split(':');
        document.getElementById('sleep-hours').value = hours;
        document.getElementById('sleep-minutes').value = minutes;
    }
    if (data.energyLevel) {
        document.querySelector(`input[name="energy"][value="${data.energyLevel}"]`).checked = true;
    }
    if (data.weight) document.getElementById('weight').value = data.weight;
    if (data.weightCondition) document.getElementById('weight-condition').value = data.weightCondition;
    if (data.steps) document.getElementById('steps').value = data.steps;
    if (data.calories) document.getElementById('calories').value = data.calories;
    if (data.alcohol) document.getElementById('alcohol').value = data.alcohol;
    if (data.workout) document.getElementById('workout').value = data.workout;
    if (data.rpe) document.getElementById('rpe').value = data.rpe;
    if (data.mood) document.getElementById('mood').value = data.mood;
    if (data.notes) document.getElementById('notes').value = data.notes;
    if (data.time) document.getElementById('entry-time').value = data.time;
}

function handleDailySubmit(e, date) {
    e.preventDefault();

    const healthData = getHealthData();
    const weightConditions = getWeightConditions();
    const time = document.getElementById('entry-time').value;

    // Сбор данных из формы
    const entry = {
        id: Date.now(),
        time: time,
        pulse: document.getElementById('pulse').value || null,
        sleepDuration: `${document.getElementById('sleep-hours').value || 0}:${document.getElementById('sleep-minutes').value || 0}`,
        energyLevel: document.querySelector('input[name="energy"]:checked')?.value || null,
        weight: document.getElementById('weight').value || null,
        weightCondition: document.getElementById('weight-condition').value || null,
        steps: document.getElementById('steps').value || null,
        calories: document.getElementById('calories').value || null,
        alcohol: document.getElementById('alcohol').value || null,
        workout: document.getElementById('workout').value || null,
        rpe: document.getElementById('rpe').value || null,
        mood: document.getElementById('mood').value || null,
        notes: document.getElementById('notes').value || null
    };

    // Сохранение условия взвешивания
    if (entry.weightCondition && !weightConditions.includes(entry.weightCondition)) {
        weightConditions.push(entry.weightCondition);
        saveWeightConditions(weightConditions);
    }

    // Обновление существующей записи или добавление новой
    if (!healthData[date]) healthData[date] = [];

    // Проверяем, есть ли запись с таким же временем
    const existingIndex = healthData[date].findIndex(item => item.time === time);

    if (existingIndex !== -1) {
        // Обновляем существующую запись
        healthData[date][existingIndex] = entry;
    } else {
        // Добавляем новую запись
        healthData[date].push(entry);
    }

    saveHealthData(healthData);

    // Оповещение и обновление истории
    alert('Данные сохранены!');
    loadHistoryData(); // Обновляем историю
}
