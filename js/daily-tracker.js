import {
    getHealthData,
    saveHealthData,
    getWeightConditions,
    saveWeightConditions
} from './storage.js';

export function initDailyTracker() {
    // Показ/скрытие поля RPE в зависимости от выбора тренировки
    const workoutSelect = document.getElementById('workout');
    const rpeContainer = document.getElementById('rpe-container');

    workoutSelect.addEventListener('change', () => {
        if (workoutSelect.value !== 'none') {
            rpeContainer.style.display = 'block';
        } else {
            rpeContainer.style.display = 'none';
        }
    });

    const dailyForm = document.getElementById('daily-form');
    if (!dailyForm) return;

    // Установка текущей даты
    const entryDateInput = document.getElementById('entry-date');
    if (entryDateInput) {
        const today = new Date().toISOString().split('T')[0];
        entryDateInput.value = today;
    } else {
        console.error('Элемент с ID "entry-date" не найден');
    }

    // Загрузка данных за сегодня
    loadTodayData();

    // Обработка отправки формы
    dailyForm.addEventListener('submit', handleDailySubmit);

    // Добавление взвешиваний
    document.getElementById('add-weight-entry')?.addEventListener('click', addWeightEntry);
}

function loadTodayData() {
    const healthData = getHealthData();
    const today = new Date().toISOString().split('T')[0];

    if (healthData[today]?.length > 0) {
        const lastEntry = healthData[today][healthData[today].length - 1];
        populateForm(lastEntry);
    }
}

function populateForm(data) {
    // ... (код заполнения формы)
}

function handleDailySubmit(e) {
    e.preventDefault();

    const healthData = getHealthData();
    const weightConditions = getWeightConditions();
    const today = new Date().toISOString().split('T')[0];

    // Сбор данных из формы
    const entry = {
        id: Date.now(),
        time: new Date().toTimeString().substring(0, 5),
        // ... (сбор данных из полей формы)
    };

    // Добавляем RPE только если была тренировка
    if (workoutSelect.value !== 'none') {
        const rpe = document.getElementById('rpe').value;
        entry.rpe = rpe ? parseInt(rpe) : null;
    }

    // Сохранение условия взвешивания
    if (entry.weightCondition && !weightConditions.includes(entry.weightCondition)) {
        weightConditions.push(entry.weightCondition);
        saveWeightConditions(weightConditions);
    }

    // Добавление записи
    if (!healthData[today]) healthData[today] = [];
    healthData[today].push(entry);
    saveHealthData(healthData);

    // Оповещение и сброс формы
    alert('Данные сохранены!');
    dailyForm.reset();
    document.getElementById('entry-date').value = today;
}

function addWeightEntry() {
    const container = document.querySelector('.weight-entries');
    const entry = document.createElement('div');
    entry.className = 'weight-entry';
    entry.innerHTML = `
    <input type="number" class="weight-value" placeholder="Вес, кг" step="0.1" min="30" max="200">
    <input type="text" class="weight-condition" list="condition-list" placeholder="Условия">
    <button type="button" class="btn-remove-weight"><i class="fas fa-times"></i></button>
  `;
    container.appendChild(entry);
}
