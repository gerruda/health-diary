import {
    getHealthData,
    saveHealthData,
    getWeightConditions,
    saveWeightConditions,
} from './storage.js';
import { loadHistoryData } from './history.js';

export function initDailyTracker() {
    const dailyForm = document.getElementById('daily-form');
    if (!dailyForm) return;

    // Создаем скрытое поле для времени, если его нет
    let timeInput = document.getElementById('entry-time');
    if (!timeInput) {
        timeInput = document.createElement('input');
        timeInput.type = 'hidden';
        timeInput.id = 'entry-time';
        dailyForm.appendChild(timeInput);
    }

    const dateInput = document.getElementById('entry-date');

    // Обработчик изменения даты
    dateInput.addEventListener('change', () => {
        const newDate = dateInput.value;
        loadTodayData(newDate);
    });

    // Загрузка данных для текущей даты
    const currentDate = dateInput.value || new Date().toISOString().split('T')[0];
    loadTodayData(currentDate);

    // Инициализация RPE
    initRPEVisibility();

    // Инициализация контейнера взвешиваний
    const addWeightBtn = document.getElementById('add-weight');
    if (addWeightBtn) {
        addWeightBtn.addEventListener('click', addWeightEntry);
    }

    // Обработка формы
    dailyForm.addEventListener('submit', (e) => {
        const currentDate = document.getElementById('entry-date').value;
        handleDailySubmit(e, currentDate);
    });
}

function initRPEVisibility() {
    const workoutSelect = document.getElementById('workout-data');
    const rpeContainer = document.getElementById('rpe-container');

    if (workoutSelect && rpeContainer) {
        rpeContainer.style.display = workoutSelect.value !== 'none' ? 'block' : 'none';
        workoutSelect.addEventListener('change', () => {
            rpeContainer.style.display = workoutSelect.value !== 'none' ? 'block' : 'none';
        });
    }
}

function loadTodayData(date) {
    const healthData = getHealthData();
    const timeInput = document.getElementById('entry-time');

    if (healthData[date]?.length > 0) {
        // Берем последнюю запись за день
        const lastEntry = healthData[date][healthData[date].length - 1];
        populateForm(lastEntry);
        // Устанавливаем флаг редактирования
        document.getElementById('daily-form').dataset.editing = `${date}|${lastEntry.time}`;
        // Сохраняем время записи в скрытом поле
        if (lastEntry.time) {
            timeInput.value = lastEntry.time;
        }
    } else {
        // Устанавливаем текущее время для новой записи
        const now = new Date();
        timeInput.value = now.toTimeString().substring(0, 5);
        // Сбрасываем флаг редактирования
        delete document.getElementById('daily-form').dataset.editing;
        // Очищаем форму
        populateForm({});
    }
}

export function populateForm(data) {
    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    };

    // Устанавливаем время только если оно есть в данных
    if (data.time) {
        setValue('entry-time', data.time);
    }

    setValue('pulse', data.pulse);
    setValue('sleep-hours', data.sleepDuration ? data.sleepDuration.split(':')[0] : '');
    setValue('sleep-minutes', data.sleepDuration ? data.sleepDuration.split(':')[1] : '');
    setValue('weight', data.weight);
    setValue('weight-condition', data.weightCondition);
    setValue('steps', data.steps);
    setValue('calories', data.calories);
    setValue('alcohol', data.alcohol);
    setValue('workout-data', data.workout);
    setValue('rpe', data.rpe);
    setValue('mood', data.mood);
    setValue('notes', data.notes);

    // Радио кнопки энергии
    if (data.energyLevel) {
        const energyRadio = document.querySelector(`input[name="energy"][value="${data.energyLevel}"]`);
        if (energyRadio) energyRadio.checked = true;
    }

    // Вес и условия взвешивания
    const weighingsContainer = document.getElementById('weighings-container');
    weighingsContainer.innerHTML = '';

    if (data.weighings && data.weighings.length > 0) {
        data.weighings.forEach(w => addWeightEntry(w.weight, w.condition));
    } else if (data.weight) {
        // Совместимость со старым форматом
        addWeightEntry(data.weight, data.weightCondition);
    } else {
        addWeightEntry(); // Пустое поле
    }
}

function handleDailySubmit(e, date) {
    e.preventDefault();

    const healthData = getHealthData();
    const weightConditions = getWeightConditions();
    const timeInput = document.getElementById('entry-time');
    const time = timeInput.value;

    // Сбор данных о взвешиваниях
    const weighings = [];
    document.querySelectorAll('.weight-entry').forEach(entry => {
        const weight = entry.querySelector('.weight-value').value;
        const condition = entry.querySelector('.weight-condition').value;

        if (weight) {
            weighings.push({
                weight: parseFloat(weight),
                condition: condition || ''
            });

            // Сохранение условия взвешивания
            if (condition && !weightConditions.includes(condition)) {
                weightConditions.push(condition);
            }
        }
    });

    // Сбор данных из формы
    const entry = {
        id: Date.now(),
        time: time,
        pulse: document.getElementById('pulse').value || null,
        sleepDuration: `${document.getElementById('sleep-hours').value || 0}:${document.getElementById('sleep-minutes').value || 0}`,
        energyLevel: document.querySelector('input[name="energy"]:checked')?.value || null,
        weighings: weighings.length > 0 ? weighings : null,
        steps: document.getElementById('steps').value || null,
        calories: document.getElementById('calories').value || null,
        alcohol: document.getElementById('alcohol').value || null,
        workout: document.getElementById('workout-data').value || null,
        rpe: document.getElementById('rpe').value || null,
        mood: document.getElementById('mood').value || null,
        notes: document.getElementById('notes').value || null
    };

    // Сохранение условий взвешивания
    weighings.forEach(w => {
        if (w.condition && !weightConditions.includes(w.condition)) {
            weightConditions.push(w.condition);
        }
    });
    saveWeightConditions(weightConditions);

    // Обновление или добавление записи
    if (!healthData[date]) healthData[date] = [];

    // Проверяем флаг редактирования
    const editingFlag = e.target.dataset.editing;
    let existingIndex = -1;

    if (editingFlag) {
        const [editDate, editTime] = editingFlag.split('|');
        if (editDate === date) {
            existingIndex = healthData[date].findIndex(item => item.time === editTime);
        }
    } else {
        existingIndex = healthData[date].findIndex(item => item.time === time);
    }

    if (existingIndex !== -1) {
        healthData[date][existingIndex] = entry;
    } else {
        healthData[date].push(entry);
    }

    saveHealthData(healthData);

    // Сбрасываем флаг редактирования
    delete e.target.dataset.editing;

    // Оповещение и обновление истории
    alert('Данные сохранены!');
    if (typeof loadHistoryData === 'function') {
        loadHistoryData();
    }
}

function addWeightEntry(weight = '', condition = '') {
    const container = document.getElementById('weighings-container');
    const entry = document.createElement('div');
    entry.className = 'weight-entry';
    entry.innerHTML = `
        <input type="number" class="weight-value" placeholder="Вес (кг)" 
               step="0.1" min="30" max="200" value="${weight}">
        <input type="text" class="weight-condition" list="condition-list" 
               placeholder="Условие" value="${condition}">
        <button type="button" class="btn-remove-weight">×</button>
    `;
    container.appendChild(entry);

    // Обработчик удаления
    entry.querySelector('.btn-remove-weight').addEventListener('click', () => {
        if (document.querySelectorAll('.weight-entry').length > 1) {
            entry.remove();
        } else {
            entry.querySelector('.weight-value').value = '';
            entry.querySelector('.weight-condition').value = '';
        }
    });
}
