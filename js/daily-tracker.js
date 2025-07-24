import {
    getHealthData,
    saveHealthData,
    getWeightConditions,
    saveWeightConditions,
    getFormDraft,
    saveFormDraft
} from './storage.js';
import { loadHistoryData } from './history.js';

// Глобальная переменная для отслеживания изменений
let isFormChanged = false;
let currentDate = '';

export function initDailyTracker() {
    const dailyForm = document.getElementById('daily-form');
    if (!dailyForm) return;

    // Создаем скрытое поле для времени
    let timeInput = document.getElementById('entry-time');
    if (!timeInput) {
        timeInput = document.createElement('input');
        timeInput.type = 'hidden';
        timeInput.id = 'entry-time';
        dailyForm.appendChild(timeInput);
    }

    const dateInput = document.getElementById('entry-date');

    // Устанавливаем текущую дату при загрузке
    currentDate = dateInput.value || new Date().toISOString().split('T')[0];
    dateInput.value = currentDate; // Убедимся, что в поле ввода актуальная дата

    // Создаем кнопку "Сегодня"
    const todayButton = document.createElement('button');
    todayButton.textContent = 'Сегодня';
    todayButton.type = 'button';
    todayButton.className = 'btn-today';
    dateInput.parentNode.insertBefore(todayButton, dateInput.nextSibling);

    // Обработчик для кнопки "Сегодня"
    todayButton.addEventListener('click', () => {
        // Сохраняем черновик для текущей даты
        saveDraft(currentDate);

        // Устанавливаем сегодняшнюю дату
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;

        // Удаляем черновик для сегодняшней даты, чтобы не мешал
        const drafts = JSON.parse(localStorage.getItem('dailyFormDrafts') || '{}');
        delete drafts[today];
        localStorage.setItem('dailyFormDrafts', JSON.stringify(drafts));

        // Обновляем текущую дату
        currentDate = today;

        // Загружаем данные для сегодня
        loadTodayData(today);
    });

    // Обработчик изменения даты
    dateInput.addEventListener('change', () => {
        // Сохраняем черновик для текущей даты
        saveDraft(currentDate);

        // Загружаем данные для новой даты
        currentDate = dateInput.value;
        loadTodayData(currentDate);
    });

    // Загрузка данных для текущей даты
    loadTodayData(currentDate);

    // Инициализация RPE
    initRPEVisibility();

    // Инициализация контейнера взвешиваний
    const addWeightBtn = document.getElementById('add-weight');
    if (addWeightBtn) {
        addWeightBtn.addEventListener('click', () => addWeightEntry());
    }

    // Обработка формы
    dailyForm.addEventListener('submit', (e) => {
        const currentDate = document.getElementById('entry-date').value;
        handleDailySubmit(e, currentDate);
    });

    // Обработчики изменений для автосохранения
    setupAutoSave();
}

function setupAutoSave() {
    // Список всех полей формы, которые нужно отслеживать
    const fieldsToTrack = [
        'pulse', 'sleep-hours', 'sleep-minutes', 'steps',
        'calories', 'alcohol', 'workout-data', 'rpe', 'mood', 'notes'
    ];

    // Обработчики для обычных полей ввода
    fieldsToTrack.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.addEventListener('input', () => markFormChanged());
        }
    });

    // Обработчики для радио-кнопок энергии
    document.querySelectorAll('input[name="energy"]').forEach(radio => {
        radio.addEventListener('change', () => markFormChanged());
    });

    // Обработчики для полей веса (динамически добавляемые)
    document.getElementById('weighings-container')?.addEventListener('input', (e) => {
        if (e.target.classList.contains('weight-value') ||
            e.target.classList.contains('weight-condition')) {
            markFormChanged();
        }
    });

    // Автосохранение при закрытии вкладки/страницы
    window.addEventListener('beforeunload', (e) => {
        if (isFormChanged) {
            saveDraft(currentDate);
            // Предупреждение для пользователя
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Автосохранение каждые 30 секунд
    setInterval(() => {
        if (isFormChanged) {
            saveDraft(currentDate);
            console.log('Автосохранение черновика');
        }
    }, 30000);
}

function markFormChanged() {
    isFormChanged = true;
    // Визуальный индикатор изменений
    document.getElementById('daily-form').classList.add('unsaved-changes');
}

function saveDraft(date) {
    if (!isFormChanged) return;

    const draft = {
        pulse: document.getElementById('pulse').value,
        sleepHours: document.getElementById('sleep-hours').value,
        sleepMinutes: document.getElementById('sleep-minutes').value,
        energyLevel: document.querySelector('input[name="energy"]:checked')?.value,
        steps: document.getElementById('steps').value,
        calories: document.getElementById('calories').value,
        alcohol: document.getElementById('alcohol').value,
        workout: document.getElementById('workout-data').value,
        rpe: document.getElementById('rpe').value,
        mood: document.getElementById('mood').value,
        notes: document.getElementById('notes').value,
        weighings: []
    };

    // Сохраняем данные о взвешиваниях
    document.querySelectorAll('.weight-entry').forEach(entry => {
        const weight = entry.querySelector('.weight-value').value;
        const condition = entry.querySelector('.weight-condition').value;
        if (weight || condition) {
            draft.weighings.push({ weight, condition });
        }
    });

    saveFormDraft(date, draft);
    isFormChanged = false;
    document.getElementById('daily-form').classList.remove('unsaved-changes');
}

function loadTodayData(date) {
    const healthData = getHealthData();
    const timeInput = document.getElementById('entry-time');

    // Проверяем, есть ли черновик для этой даты
    const draft = getFormDraft(date);
    if (draft) {
        populateFormFromDraft(draft);
        console.log('Загружен черновик для', date);
        return;
    }

    // Если нет черновика, загружаем сохраненные данные
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
        clearDailyForm();
    }
}

function populateFormFromDraft(draft) {
    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    };

    setValue('pulse', draft.pulse);
    setValue('sleep-hours', draft.sleepHours);
    setValue('sleep-minutes', draft.sleepMinutes);
    setValue('steps', draft.steps);
    setValue('calories', draft.calories);
    setValue('alcohol', draft.alcohol);
    setValue('workout-data', draft.workout);
    setValue('rpe', draft.rpe);
    setValue('mood', draft.mood);
    setValue('notes', draft.notes);

    // Радио кнопки энергии
    if (draft.energyLevel) {
        const energyRadio = document.querySelector(`input[name="energy"][value="${draft.energyLevel}"]`);
        if (energyRadio) energyRadio.checked = true;
    }

    // Вес и условия взвешивания
    const weighingsContainer = document.getElementById('weighings-container');
    weighingsContainer.innerHTML = '';

    if (draft.weighings && draft.weighings.length > 0) {
        draft.weighings.forEach(w => addWeightEntry(w.weight, w.condition));
    } else {
        addWeightEntry(); // Пустое поле
    }

    // Обновляем видимость RPE
    initRPEVisibility();
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

    // Удаляем черновик после сохранения
    const drafts = JSON.parse(localStorage.getItem('dailyFormDrafts') || '{}');
    delete drafts[date];
    localStorage.setItem('dailyFormDrafts', JSON.stringify(drafts));

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
    const removeBtn = entry.querySelector('.btn-remove-weight');
    removeBtn.addEventListener('click', () => {
        if (document.querySelectorAll('.weight-entry').length > 1) {
            entry.remove();
        } else {
            entry.querySelector('.weight-value').value = '';
            entry.querySelector('.weight-condition').value = '';
        }
        markFormChanged(); // Помечаем форму как измененную
    });

    // Обработчики изменений в полях взвешивания
    entry.querySelector('.weight-value').addEventListener('input', markFormChanged);
    entry.querySelector('.weight-condition').addEventListener('input', markFormChanged);
}

// Функция для очистки формы
function clearDailyForm() {
    document.getElementById('pulse').value = '';
    document.getElementById('sleep-hours').value = '';
    document.getElementById('sleep-minutes').value = '';
    document.querySelectorAll('input[name="energy"]').forEach(radio => radio.checked = false);

    const weighingsContainer = document.getElementById('weighings-container');
    weighingsContainer.innerHTML = '';
    addWeightEntry(); // Добавляем одно пустое поле для веса

    document.getElementById('steps').value = '';
    document.getElementById('calories').value = '';
    document.getElementById('alcohol').value = '';
    document.getElementById('workout-data').value = 'none';
    document.getElementById('rpe').value = '';
    document.getElementById('mood').value = '';
    document.getElementById('notes').value = '';

    // Обновляем видимость RPE
    initRPEVisibility();
}
