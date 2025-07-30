import { formatDate, activateTab, confirmAction } from './utils.js';
import { populateWorkoutForm } from './workout.js';

export function initHistory(dataManager) {
    loadHistoryData(dataManager);
    document.getElementById('history-date')?.addEventListener('change', () => loadHistoryData(dataManager));

    // Обработчики событий
    dataManager.on('entry-updated', () => loadHistoryData(dataManager));
    dataManager.on('entry-deleted', () => loadHistoryData(dataManager));
}

export function loadHistoryData(dataManager) {
    const historyList = document.getElementById('history-list');
    const dateFilter = document.getElementById('history-date')?.value;

    if (!historyList) return;

    historyList.innerHTML = '';

    // Получаем и группируем записи
    const allEntries = dataManager.getAllEntries().filter(entry => !entry.isDraft);
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

    // Фильтрация и сортировка
    let dates = Object.keys(entriesByDate);
    if (dateFilter === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        dates = dates.filter(date => new Date(date) >= startOfWeek);
    }
    dates.sort((a, b) => new Date(b) - new Date(a));

    if (dates.length === 0) {
        historyList.innerHTML = '<p>История записей пока пуста</p>';
        return;
    }

    // Отображение записей
    dates.forEach(date => {
        const dateHeader = document.createElement('h3');
        dateHeader.textContent = formatDate(new Date(date), {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        historyList.appendChild(dateHeader);

        // Дневные записи
        if (entriesByDate[date].diary.length > 0) {
            entriesByDate[date].diary.forEach(entry => {
                historyList.appendChild(createDiaryEntryElement(entry, date));
            });
        }

        // Тренировки
        if (entriesByDate[date].training.length > 0) {
            const workoutHeader = document.createElement('h4');
            workoutHeader.textContent = 'Тренировки';
            workoutHeader.className = 'workout-header';
            historyList.appendChild(workoutHeader);

            entriesByDate[date].training.forEach(entry => {
                historyList.appendChild(createTrainingEntryElement(entry));
            });
        }
    });

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

        // Важно: передаем полную запись, а не только данные
        populateWorkoutForm(entry);

        const workoutForm = document.getElementById('workout-form');
        if (workoutForm) {
            workoutForm.dataset.editing = `${date}|${id}`;
        }
    }
}
