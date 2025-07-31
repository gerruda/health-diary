import { formatDate, activateTab, confirmAction } from './utils.js';
import { populateWorkoutForm } from './workout.js';
import { populateDiaryForm } from './daily-tracker.js';
import { initExport } from "./export.js";

export function initHistory(dataManager) {
    // Создаем и добавляем блок экспорта
    initExport(dataManager);

    // Переносим блок экспорта в нужное место
    const dataControls = document.getElementById('data-controls');
    const exportSection = initExport(dataManager);
    if (dataControls && exportSection) {
        dataControls.appendChild(exportSection);
    }
    const historyTab = document.getElementById('history');
    historyTab.insertBefore(exportSection, historyTab.firstChild); // Добавляем в начало

    // Загрузка истории
    loadHistoryData(dataManager);

    // Обработчики событий
    document.getElementById('export-range')?.addEventListener('change', () => loadHistoryData(dataManager));
    document.getElementById('start-date')?.addEventListener('change', () => loadHistoryData(dataManager));
    document.getElementById('end-date')?.addEventListener('change', () => loadHistoryData(dataManager));

    dataManager.on('entry-updated', () => loadHistoryData(dataManager));
    dataManager.on('entry-deleted', () => loadHistoryData(dataManager));
}

export function loadHistoryData(dataManager) {
    const historyList = document.getElementById('history-list');
    const historyTab = document.getElementById('history');

    if (!historyList || !historyTab) return;

    // Очистка предыдущих данных
    historyList.innerHTML = '';

    // Получаем выбранный период из блока экспорта
    const rangeSelector = document.getElementById('export-range');
    const range = rangeSelector ? rangeSelector.value : 'all';

    // Получаем пользовательские даты, если выбраны
    let startDate, endDate;
    if (range === 'custom') {
        const startInput = document.getElementById('start-date');
        const endInput = document.getElementById('end-date');

        startDate = startInput?.value ? new Date(startInput.value) : null;
        endDate = endInput?.value ? new Date(endInput.value) : null;

        // Корректировка времени для правильного сравнения
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);
    }

    // Получаем и фильтруем записи
    const allEntries = dataManager.getAllEntries().filter(entry => {
        if (!entry.date || entry.isDraft) return false;

        const entryDate = new Date(entry.date);
        entryDate.setHours(12, 0, 0, 0); // Нормализация времени

        // Фильтрация по периоду
        switch (range) {
            case 'current-week':
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
                startOfWeek.setHours(0, 0, 0, 0);
                return entryDate >= startOfWeek;

            case 'last-week':
                const lastWeekStart = new Date();
                lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 6);
                lastWeekStart.setHours(0, 0, 0, 0);
                const lastWeekEnd = new Date(lastWeekStart);
                lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
                lastWeekEnd.setHours(23, 59, 59, 999);
                return entryDate >= lastWeekStart && entryDate <= lastWeekEnd;

            case 'custom':
                if (!startDate || !endDate) return true;
                return entryDate >= startDate && entryDate <= endDate;

            default: // 'all'
                return true;
        }
    });

    // Группировка записей по дате
    const entriesByDate = {};
    allEntries.forEach(entry => {
        if (!entriesByDate[entry.date]) {
            entriesByDate[entry.date] = { diary: [], training: [] };
        }

        if (entry.type === 'diary') {
            entriesByDate[entry.date].diary.push(entry);
        } else if (entry.type === 'training') {
            entriesByDate[entry.date].training.push(entry);
        }
    });

    // Сортировка дат (от новых к старым)
    const dates = Object.keys(entriesByDate).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    // Отображение результатов
    if (dates.length === 0) {
        historyList.innerHTML = '<div class="empty-history">История записей пуста для выбранного периода</div>';
        return;
    }

    // Создаем элементы для каждой даты
    dates.forEach(date => {
        const dateSection = document.createElement('div');
        dateSection.className = 'history-date-section';

        const dateHeader = document.createElement('h3');
        dateHeader.className = 'history-date-header';
        dateHeader.textContent = formatDate(new Date(date), {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateSection.appendChild(dateHeader);

        // Добавляем дневные записи
        if (entriesByDate[date].diary.length > 0) {
            entriesByDate[date].diary.forEach(entry => {
                dateSection.appendChild(createDiaryEntryElement(entry, date));
            });
        }

        // Добавляем тренировки
        if (entriesByDate[date].training.length > 0) {
            const workoutHeader = document.createElement('h4');
            workoutHeader.className = 'workout-header';
            workoutHeader.textContent = 'Тренировки';
            dateSection.appendChild(workoutHeader);

            entriesByDate[date].training.forEach(entry => {
                dateSection.appendChild(createTrainingEntryElement(entry));
            });
        }

        historyList.appendChild(dateSection);
    });

    // Обновляем обработчики событий
    setupEntryEventHandlers(dataManager);
}

function createDiaryEntryElement(entry, date) {
    const data = entry.data;
    let weighingsHtml = '';

    if (data.weighings?.length > 0) {
        weighingsHtml = '<p>Взвешивания:</p><ul class="weighings-list">';
        data.weighings.forEach(w => {
            weighingsHtml += `<li>${w.weight} кг${w.condition ? ` (${w.condition})` : ''}</li>`;
        });
        weighingsHtml += '</ul>';
    } else if (data.weight) {
        weighingsHtml = `<p>Вес: ${data.weight} кг${data.weightCondition ? ` (${data.weightCondition})` : ''}</p>`;
    }

    const entryEl = document.createElement('div');
    entryEl.className = 'history-entry';
    entryEl.innerHTML = `
        <div class="entry-header">
            <span class="entry-time">${data.time || 'Без времени'}</span>
            <div class="entry-actions">
                <button class="edit-btn" data-type="diary" data-date="${date}" data-id="${entry.id}">✏️</button>
                <button class="delete-btn" data-type="diary" data-date="${date}" data-id="${entry.id}">🗑️</button>
            </div>
        </div>
        ${data.pulse ? `<p>Пульс: ${data.pulse} уд/мин</p>` : ''}
        ${data.sleepDuration ? `<p>Сон: ${data.sleepDuration}</p>` : ''}
        ${weighingsHtml}
        ${data.steps ? `<p>Шаги: ${data.steps}</p>` : ''}
        ${data.calories ? `<p>Калории: ${data.calories}</p>` : ''}
        ${data.alcohol ? `<p>Алкоголь: ${data.alcohol}</p>` : ''}
        ${data.workout ? `<p>Тренировка: ${data.workout}</p>` : ''}
        ${data.rpe ? `<p>RPE: ${data.rpe}</p>` : ''}
        ${data.mood ? `<p>Настроение: ${data.mood}</p>` : ''}
        ${data.notes ? `<p>Заметки: ${data.notes}</p>` : ''}
    `;
    return entryEl;
}

function setupEntryEventHandlers(dataManager) {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            const date = this.dataset.date;
            const id = this.dataset.id;
            editEntry(type, date, id, dataManager);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirmAction('Вы уверены, что хотите удалить эту запись?')) {
                const id = this.dataset.id;
                dataManager.deleteEntry(id);
            }
        });
    });
}

function createTrainingEntryElement(entry) {
    const exercise = entry.data;
    const exerciseEl = document.createElement('div');
    exerciseEl.className = 'history-exercise';

    // Форматируем подходы
    let setsHtml = '';
    if (Array.isArray(exercise.sets)) {
        setsHtml = exercise.sets.map(set =>
            `<p>${set.weight} кг × ${set.reps} повт.${set.perLimb ? ' (на конечность)' : ''}</p>`
        ).join('');
    }

    exerciseEl.innerHTML = `
        <div class="entry-header">
            <span>${exercise.name}</span>
            <div class="entry-actions">
                <button class="edit-btn" 
                        data-type="training" 
                        data-date="${entry.date}" 
                        data-id="${entry.id}">✏️</button>
                <button class="delete-btn" 
                        data-type="training" 
                        data-date="${entry.date}" 
                        data-id="${entry.id}">🗑️</button>
            </div>
        </div>
        <div class="exercise-sets">${setsHtml}</div>
    `;
    return exerciseEl;
}

export function editEntry(type, date, id, dataManager) {
    const entry = dataManager.getAllEntries().find(e => e.id == id);
    if (!entry) return;

    if (type === 'training') {
        activateTab('workout');
        populateWorkoutForm(entry);
        const workoutForm = document.getElementById('workout-form');
        if (workoutForm) {
            workoutForm.dataset.editing = `${date}|${id}`;
        }
    }
    // Добавлена обработка для записей дневника
    else if (type === 'diary') {
        activateTab('daily');
        populateDiaryForm(entry); // Используем правильную функцию
        const diaryForm = document.getElementById('diary-form');
        if (diaryForm) {
            diaryForm.dataset.editing = id;
        }
    }
}
