import { formatDate, activateTab, confirmAction } from './utils.js';
import { populateForm } from './daily-tracker.js';
import { populateWorkoutForm } from './workout.js';

export function initHistory(dataManager) {
    loadHistoryData(dataManager);
    document.getElementById('history-date')?.addEventListener('change', () => loadHistoryData(dataManager));
}

export function loadHistoryData(dataManager) {
    const historyList = document.getElementById('history-list');
    const dateFilter = document.getElementById('history-date')?.value;

    if (!historyList) return;

    historyList.innerHTML = '';

    // Получаем все записи (исключая черновики)
    const allEntries = dataManager.getAllEntries().filter(entry => !entry.isDraft);

    // Группируем записи по дате и типу
    const entriesByDate = {};

    allEntries.forEach(entry => {
        if (!entriesByDate[entry.date]) {
            entriesByDate[entry.date] = {
                diary: [],
                training: []
            };
        }

        if (entry.type === 'diary') {
            entriesByDate[entry.date].diary.push(entry);
        } else if (entry.type === 'training') {
            entriesByDate[entry.date].training.push(entry);
        }
    });

    // Фильтрация по периоду
    let dates = Object.keys(entriesByDate);
    if (dateFilter === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        dates = dates.filter(date => new Date(date) >= startOfWeek);
    }

    // Сортировка дат (новые сверху)
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

        // Записи о здоровье (diary)
        if (entriesByDate[date].diary.length > 0) {
            entriesByDate[date].diary.forEach(entry => {
                const data = entry.data;

                // Вес и условия взвешивания
                let weighingsHtml = '';
                if (data.weighings && data.weighings.length > 0) {
                    weighingsHtml = '<p>Взвешивания:</p><ul class="weighings-list">';
                    data.weighings.forEach((w) => {
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
                        <span class="entry-time">${data.time}</span>
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
                historyList.appendChild(entryEl);
            });
        }

        // Тренировки (training)
        if (entriesByDate[date].training.length > 0) {
            entriesByDate[date].training.forEach(entry => {
                const exercise = entry.data;
                const exerciseEl = document.createElement('div');
                exerciseEl.className = 'history-exercise';
                exerciseEl.innerHTML = `
                    <div class="entry-header">
                        <span>${exercise.name}</span>
                        <div class="entry-actions">
                            <button class="edit-btn" data-type="training" data-date="${date}" data-id="${entry.id}">✏️</button>
                            <button class="delete-btn" data-type="training" data-date="${date}" data-id="${entry.id}">🗑️</button>
                        </div>
                    </div>
                    <div class="exercise-sets">
                        ${exercise.sets.map(set =>
                    `<p>${set.weight} кг × ${set.reps} повторений</p>`
                ).join('')}
                    </div>
                `;
                historyList.appendChild(exerciseEl);
            });
        }
    });

    // Обработчики действий
    document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            const date = this.dataset.date;
            const id = this.dataset.id;

            if (this.classList.contains('edit-btn')) {
                editEntry(type, date, id, dataManager);
            } else {
                if (confirmAction('Вы уверены, что хотите удалить эту запись?')) {
                    deleteEntry(type, date, id, dataManager);
                }
            }
        });
    });
}

// Редактирование записи
export function editEntry(type, date, id, dataManager) {
    const entries = dataManager.getAllEntries();
    const entry = entries.find(e => e.id == id);

    if (!entry) return;

    if (type === 'diary') {
        activateTab('daily');
        const dateInput = document.getElementById('entry-date');
        if (dateInput) dateInput.value = date;

        const timeInput = document.getElementById('entry-time');
        if (timeInput) timeInput.value = entry.data.time;

        populateForm(entry.data);
        document.getElementById('daily-form').dataset.editing = `${date}|${id}`;
    }
    else if (type === 'training') {
        activateTab('workout');
        populateWorkoutForm(entry.data);
        document.getElementById('workout-form').dataset.editing = `${date}|${id}`;
    }
}

// Удаление записи
function deleteEntry(type, date, id, dataManager) {
    const entries = dataManager.getAllEntries();
    const updatedEntries = entries.filter(entry => entry.id != id);

    // Обновляем хранилище
    localStorage.setItem('health-diary-entries', JSON.stringify(
        updatedEntries.filter(e => !e.isDraft)
    ));

    sessionStorage.setItem('health-diary-drafts', JSON.stringify(
        updatedEntries.filter(e => e.isDraft)
    ));

    // Перезагружаем историю
    loadHistoryData(dataManager);

    // Генерируем событие для обновления других компонентов
    dataManager.emit('entry-deleted', { type, date, id });
}
