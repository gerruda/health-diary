import { getWeightConditions, saveWeightConditions } from './storage.js';
import { loadHistoryData } from './history.js';
import { saveDiaryData } from "./settings.js";

let isFormChanged = false;
let currentDate = '';
let lastChangeTimestamp = 0;
let saveTimer = null;
let dataManagerInstance;

export function initDailyTracker(dataManager) {
    initWeightConditionsList();

    dataManagerInstance = dataManager;

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
    currentDate = dateInput.value || new Date().toISOString().split('T')[0];
    dateInput.value = currentDate;

    // Добавляем подсказку для формата даты
    dateInput.placeholder = 'ГГГГ-ММ-ДД';
    dateInput.title = 'Формат: ГГГГ-ММ-ДД';

    const dateContainer = document.createElement('div');
    dateContainer.className = 'date-container';
    dateInput.parentNode.insertBefore(dateContainer, dateInput);
    dateContainer.appendChild(dateInput);

    // Кнопка выбора даты
    const datePickerBtn = document.createElement('button');
    datePickerBtn.innerHTML = '📅';
    datePickerBtn.type = 'button';
    datePickerBtn.className = 'btn-datepicker';
    datePickerBtn.title = 'Выбрать дату из календаря';
    dateContainer.appendChild(datePickerBtn);

    // Кнопка "Сегодня"
    const todayButton = document.createElement('button');
    todayButton.textContent = 'Сегодня';
    todayButton.type = 'button';
    todayButton.className = 'btn-today';
    dateContainer.appendChild(todayButton);

    // Обработчики событий
    datePickerBtn.addEventListener('click', () => dateInput.showPicker());

    todayButton.addEventListener('click', () => {
        saveDraft(currentDate);
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        currentDate = today;
        loadTodayData(today);
    });

    dateInput.addEventListener('change', () => {
        saveDraft(currentDate);
        currentDate = dateInput.value;
        loadTodayData(currentDate);
    });

    loadTodayData(currentDate);
    initRPEVisibility();

    const addWeightBtn = document.getElementById('add-weight');
    if (addWeightBtn) {
        addWeightBtn.addEventListener('click', () => addWeightEntry());
    }

    dailyForm.addEventListener('submit', (e) => {
        const currentDate = document.getElementById('entry-date').value;
        handleDailySubmit(e, currentDate);
    });

    setupAutoSave();
}

function setupAutoSave() {
    const fieldsToTrack = [
        'pulse', 'sleep-hours', 'sleep-minutes', 'steps',
        'calories', 'alcohol', 'workout-data', 'rpe', 'mood', 'notes'
    ];

    fieldsToTrack.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.addEventListener('input', () => markFormChanged());
        }
    });

    document.querySelectorAll('input[name="energy"]').forEach(radio => {
        radio.addEventListener('change', () => markFormChanged());
    });

    document.getElementById('weighings-container')?.addEventListener('input', (e) => {
        if (e.target.classList.contains('weight-value') ||
            e.target.classList.contains('weight-condition')) {
            markFormChanged();
        }
    });

    window.addEventListener('beforeunload', (e) => {
        if (isFormChanged) {
            saveDraft(currentDate);
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Автосохранение каждую секунду для проверки таймаута
    setInterval(() => {
        if (isFormChanged && Date.now() - lastChangeTimestamp > 30000) {
            saveAsRegularEntry(currentDate);
        }
    }, 1000);
}

function markFormChanged() {
    isFormChanged = true;
    lastChangeTimestamp = Date.now();
    document.getElementById('daily-form').classList.add('unsaved-changes');

    // Сбрасываем предыдущий таймер
    if (saveTimer) clearTimeout(saveTimer);

    // Устанавливаем новый таймер на 30 секунд
    saveTimer = setTimeout(() => {
        if (isFormChanged) {
            saveAsRegularEntry(currentDate);
        }
    }, 30000);
}

function saveDraft(date) {
    // Сохраняем черновик только для сегодняшней даты
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) return;

    if (!isFormChanged) return;

    const draft = {
        time: document.getElementById('entry-time').value,
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

    document.querySelectorAll('.weight-entry').forEach(entry => {
        const weight = entry.querySelector('.weight-value').value;
        const condition = entry.querySelector('.weight-condition').value;
        if (weight || condition) {
            draft.weighings.push({ weight, condition });
        }
    });

    // Удаляем предыдущие черновики за эту дату
    dataManagerInstance.deleteDraft(date);

    // Сохраняем новый черновик
    dataManagerInstance.saveEntry('diary', date, draft, true);

    isFormChanged = false;
    document.getElementById('daily-form').classList.remove('unsaved-changes');
    console.log('Черновик сохранен', new Date().toLocaleTimeString());
}

function saveAsRegularEntry(date) {
    if (!isFormChanged) return;

    const form = document.getElementById('daily-form');
    const timeInput = document.getElementById('entry-time');
    const time = timeInput.value;

    // Сбор данных взвешивания
    const weighings = [];
    document.querySelectorAll('.weight-entry').forEach(entry => {
        const weight = entry.querySelector('.weight-value').value;
        const condition = entry.querySelector('.weight-condition').value;

        if (weight) {
            weighings.push({
                weight: parseFloat(weight),
                condition: condition || ''
            });
        }
    });

    // Формируем данные записи
    const entryData = {
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

    // Обновляем условия взвешивания
    const weightConditions = getWeightConditions();
    weighings.forEach(w => {
        if (w.condition && !weightConditions.includes(w.condition)) {
            weightConditions.push(w.condition);
        }
    });
    saveWeightConditions(weightConditions);

    // Получаем или создаем ID записи
    let entryId = form.dataset.editingId;

    // Если ID нет, проверяем существующую запись за эту дату
    if (!entryId) {
        const existingEntry = dataManagerInstance.getAllEntries().find(
            e => e.type === 'diary' &&
                e.date === date &&
                !e.isDraft
        );

        if (existingEntry) {
            entryId = existingEntry.id;
        } else {
            entryId = Date.now().toString();
        }
    }

    // Формируем полную запись
    const entry = {
        id: entryId,
        ...entryData
    };

    // Сохраняем через DataManager
    dataManagerInstance.saveEntry('diary', date, entry, false);

    // Удаляем черновик
    dataManagerInstance.deleteDraft(date);

    // Обновляем состояние формы
    form.dataset.editingId = entryId;
    isFormChanged = false;
    document.getElementById('daily-form').classList.remove('unsaved-changes');

    console.log('Автосохранено как обычная запись', new Date().toLocaleTimeString());

    // Обновляем историю
    if (typeof loadHistoryData === 'function') {
        loadHistoryData(dataManagerInstance);
    }

    // +++ ВЫЗОВ ДЛЯ УВЕДОМЛЕНИЙ +++
    // Получаем актуальные данные для Service Worker
    const today = new Date().toISOString().split('T')[0];
    const hasData = dataManagerInstance.getAllEntries().some(
        e => e.type === 'diary' &&
            !e.isDraft &&
            e.date === today
    );

    // Сохраняем информацию о наличии данных за сегодня
    saveDiaryData({ date: today, hasData });
}

export function loadTodayData(date) {
    const timeInput = document.getElementById('entry-time');
    const form = document.getElementById('daily-form');

    // Если форма находится в режиме редактирования истории, пропускаем загрузку
    if (form.dataset.editingHistory === 'true') {
        return;
    }

    // Удаляем старые черновики (старше 1 дня)
    const allEntries = dataManagerInstance.getAllEntries();
    const now = Date.now();
    allEntries.forEach(entry => {
        if (entry.isDraft && now - entry.timestamp > 86400000) {
            dataManagerInstance.deleteEntry(entry.id);
        }
    });

    // Определяем, сегодня ли это дата
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

    // Для сегодняшней даты: загружаем черновик или сохраненную запись
    if (isToday) {
        // Поиск актуального черновика
        const drafts = dataManagerInstance.getAllEntries().filter(
            e => e.isDraft && e.type === 'diary' && e.date === date
        );

        if (drafts.length > 0) {
            // Берем последний черновик
            const latestDraft = drafts.reduce((latest, current) =>
                current.timestamp > latest.timestamp ? current : latest
            );

            populateForm(latestDraft.data);
            form.dataset.editingId = latestDraft.id;
            return;
        }
    }

    // Поиск сохраненных записей (для любой даты)
    const savedEntries = dataManagerInstance.getAllEntries().filter(
        e => !e.isDraft && e.type === 'diary' && e.date === date
    );

    if (savedEntries.length > 0) {
        savedEntries.sort((a, b) => b.timestamp - a.timestamp);
        const lastEntry = savedEntries[0];
        populateForm(lastEntry.data);
        form.dataset.editingId = lastEntry.id;

        if (lastEntry.data.time) {
            timeInput.value = lastEntry.data.time;
        }
    } else {
        const now = new Date();
        timeInput.value = now.toTimeString().substring(0, 5);
        delete form.dataset.editingId;
        clearDailyForm();
    }
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

export function populateDiaryForm(entry) {
    const form = document.getElementById('daily-form');
    if (!form) return;

    // Устанавливаем флаг редактирования истории
    form.dataset.editingHistory = 'true';

    // Устанавливаем дату записи
    const dateInput = document.getElementById('entry-date');
    if (dateInput) {
        dateInput.value = entry.date;
        currentDate = entry.date;
    }

    // Заполняем форму данными из записи
    populateForm(entry.data);

    // Устанавливаем ID редактируемой записи
    form.dataset.editingId = entry.id;

    // Сбрасываем флаг изменений
    isFormChanged = false;
    form.classList.remove('unsaved-changes');
}

export function populateForm(data) {
    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    };

    if (data.time) {
        setValue('entry-time', data.time);
    }

    setValue('pulse', data.pulse);

    // Обработка продолжительности сна
    if (data.sleepDuration) {
        const [hours, minutes] = data.sleepDuration.split(':');
        setValue('sleep-hours', hours);
        setValue('sleep-minutes', minutes);
    } else {
        setValue('sleep-hours', '7');
        setValue('sleep-minutes', '30');
    }

    setValue('steps', data.steps);
    setValue('calories', data.calories);
    setValue('alcohol', data.alcohol);
    setValue('workout-data', data.workout);
    setValue('rpe', data.rpe);
    setValue('mood', data.mood);
    setValue('notes', data.notes);

    if (data.energyLevel) {
        const energyRadio = document.querySelector(`input[name="energy"][value="${data.energyLevel}"]`);
        if (energyRadio) energyRadio.checked = true;
    }

    const weighingsContainer = document.getElementById('weighings-container');
    weighingsContainer.innerHTML = '';

    if (data.weighings && data.weighings.length > 0) {
        data.weighings.forEach(w => addWeightEntry(w.weight, w.condition));
    } else if (data.weight) {
        addWeightEntry(data.weight, data.weightCondition);
    } else {
        addWeightEntry();
    }

    // Обновляем видимость RPE
    initRPEVisibility();
}

function handleDailySubmit(e, date) {
    e.preventDefault();

    // Проверяем, есть ли уже сохраненная запись за этот день
    const existingEntries = dataManagerInstance.getAllEntries().filter(
        e => e.type === 'diary' &&
            e.date === date &&
            !e.isDraft
    );

    let entryId;
    if (existingEntries.length > 0) {
        // Используем ID первой найденной записи
        entryId = existingEntries[0].id;
    } else {
        entryId = document.getElementById('daily-form').dataset.editingId || Date.now().toString();
    }

    const weightConditions = getWeightConditions();
    const timeInput = document.getElementById('entry-time');
    const time = timeInput.value;

    const weighings = [];
    document.querySelectorAll('.weight-entry').forEach(entry => {
        const weight = entry.querySelector('.weight-value').value;
        const condition = entry.querySelector('.weight-condition').value;

        if (weight) {
            weighings.push({
                weight: parseFloat(weight),
                condition: condition || ''
            });

            if (condition) {
                addWeightCondition(condition);
            }
        }
    });

    const entryData = {
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

    weighings.forEach(w => {
        if (w.condition && !weightConditions.includes(w.condition)) {
            weightConditions.push(w.condition);
        }
    });
    saveWeightConditions(weightConditions);

    // Формируем полную запись для сохранения
    const entry = {
        id: entryId,
        ...entryData
    };

    // Сохраняем через DataManager
    dataManagerInstance.saveEntry('diary', date, entry, false);

    // Удаляем черновик
    dataManagerInstance.deleteDraft(date);

    // Сбрасываем состояние формы
    const form = document.getElementById('daily-form');
    delete form.dataset.editingId;
    delete form.dataset.editingHistory;
    alert('Данные сохранены!');

    // Обновляем историю
    if (typeof loadHistoryData === 'function') {
        loadHistoryData(dataManagerInstance);
    }

    // +++ ВЫЗОВ ДЛЯ УВЕДОМЛЕНИЙ +++
    // Получаем актуальные данные для Service Worker
    const today = new Date().toISOString().split('T')[0];
    const hasData = dataManagerInstance.getAllEntries().some(
        e => e.type === 'diary' &&
            !e.isDraft &&
            e.date === today
    );

    // Сохраняем информацию о наличии данных за сегодня
    saveDiaryData({ date: today, hasData });
}

function addWeightEntry(weight = '', condition = '') {
    const container = document.getElementById('weighings-container');
    const entry = document.createElement('div');
    entry.className = 'weight-entry';

    const defaultCondition = condition || getWeightConditions()[0] || '';

    entry.innerHTML = `
        <input type="number" class="weight-value" placeholder="Вес (кг)" 
               step="0.1" min="30" max="200" value="${weight}">
        <input type="text" class="weight-condition" list="condition-list" 
               placeholder="Условие" value="${defaultCondition}">
        <button type="button" class="btn-remove-weight">×</button>
    `;
    container.appendChild(entry);

    initWeightConditionsList();

    const removeBtn = entry.querySelector('.btn-remove-weight');
    removeBtn.addEventListener('click', () => {
        if (document.querySelectorAll('.weight-entry').length > 1) {
            entry.remove();
        } else {
            entry.querySelector('.weight-value').value = '';
            entry.querySelector('.weight-condition').value = '';
        }
        markFormChanged();
    });

    entry.querySelector('.weight-value').addEventListener('input', markFormChanged);
    entry.querySelector('.weight-condition').addEventListener('input', markFormChanged);

    entry.querySelector('.weight-condition').addEventListener('change', function() {
        if (this.value) {
            addWeightCondition(this.value);
        }
    });
}

function initWeightConditionsList() {
    const conditions = getWeightConditions();
    const datalist = document.getElementById('condition-list');
    if (!datalist) return;

    datalist.innerHTML = '';

    conditions.forEach(condition => {
        if (condition) {
            const option = document.createElement('option');
            option.value = condition;
            datalist.appendChild(option);
        }
    });
}

function addWeightCondition(condition) {
    const conditions = getWeightConditions();

    if (condition && !conditions.includes(condition)) {
        conditions.push(condition);
        saveWeightConditions(conditions);
        initWeightConditionsList();
    }
}

function clearDailyForm() {
    document.getElementById('pulse').value = '';
    document.getElementById('sleep-hours').value = '7';
    document.getElementById('sleep-minutes').value = '30';
    document.querySelectorAll('input[name="energy"]').forEach(radio => radio.checked = false);

    const weighingsContainer = document.getElementById('weighings-container');
    weighingsContainer.innerHTML = '';
    addWeightEntry();

    document.getElementById('steps').value = '';
    document.getElementById('calories').value = '';
    document.getElementById('alcohol').value = '';
    document.getElementById('workout-data').value = 'none';
    document.getElementById('rpe').value = '';
    document.getElementById('mood').value = '';
    document.getElementById('notes').value = '';

    initRPEVisibility();
}
