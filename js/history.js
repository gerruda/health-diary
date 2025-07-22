// history.js
import { getHealthData, getWorkoutHistory, saveHealthData, saveWorkoutHistory } from './storage.js';
import { formatDate, activateTab, confirmAction } from './utils.js';
import { populateForm } from './daily-tracker.js'
import { populateWorkoutForm } from './workout.js'

export function initHistory() {
    loadHistoryData();
    document.getElementById('history-date')?.addEventListener('change', loadHistoryData);
}

export function loadHistoryData() {
    const healthData = getHealthData();
    const workoutHistory = getWorkoutHistory();
    const historyList = document.getElementById('history-list');
    const dateFilter = document.getElementById('history-date')?.value;

    if (!historyList) return;

    historyList.innerHTML = '';

    // Получаем и фильтруем даты
    let allDates = [...Object.keys(healthData), ...Object.keys(workoutHistory)];
    if (dateFilter === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        allDates = allDates.filter(date => new Date(date) >= startOfWeek);
    }

    const uniqueDates = [...new Set(allDates)].sort((a, b) =>
        new Date(b) - new Date(a)
    );

    if (uniqueDates.length === 0) {
        historyList.innerHTML = '<p>История записей пока пуста</p>';
        return;
    }

    uniqueDates.forEach(date => {
        const dateHeader = document.createElement('h3');
        dateHeader.textContent = formatDate(new Date(date), {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        historyList.appendChild(dateHeader);

        // Записи о здоровье
        if (healthData[date] && healthData[date].length > 0) {
            healthData[date].forEach(entry => {
                // ... другие поля ...

                // Вес и условия взвешивания
                let weighingsHtml = '';
                if (entry.weighings && entry.weighings.length > 0) {
                    weighingsHtml = '<p>Взвешивания:</p><ul class="weighings-list">';
                    entry.weighings.forEach((w) => {
                        weighingsHtml += `<li>${w.weight} кг${w.condition ? ` (${w.condition})` : ''}</li>`;
                    });
                    weighingsHtml += '</ul>';
                } else if (entry.weight) {
                    // Совместимость со старым форматом
                    weighingsHtml = `<p>Вес: ${entry.weight} кг${entry.weightCondition ? ` (${entry.weightCondition})` : ''}</p>`;
                }

                const entryEl = document.createElement('div');
                entryEl.className = 'history-entry';
                entryEl.innerHTML = `
                <div class="entry-header">
                    <span class="entry-time">${entry.time}</span>
                    <div class="entry-actions">
                        <button class="edit-btn" data-type="health" data-date="${date}" data-time="${entry.time}">✏️</button>
                        <button class="delete-btn" data-type="health" data-date="${date}" data-time="${entry.time}">🗑️</button>
                    </div>
                </div>
                ${entry.pulse ? `<p>Пульс: ${entry.pulse} уд/мин</p>` : ''}
                ${entry.sleepDuration ? `<p>Сон: ${entry.sleepDuration}</p>` : ''}
                ${weighingsHtml}
                <!-- остальные поля ... -->
            `;
                historyList.appendChild(entryEl);
            });
        }

        // Тренировки
        if (workoutHistory[date] && workoutHistory[date].length > 0) {
            workoutHistory[date].forEach(exercise => {
                const exerciseEl = document.createElement('div');
                exerciseEl.className = 'history-exercise';
                exerciseEl.innerHTML = `
                    <div class="entry-header">
                        <span>${exercise.name}</span>
                        <div class="entry-actions">
                            <button class="edit-btn" data-type="workout" data-date="${date}" data-id="${exercise.id}">✏️</button>
                            <button class="delete-btn" data-type="workout" data-date="${date}" data-id="${exercise.id}">🗑️</button>
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

    // Обработчики для кнопок редактирования и удаления
    document.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            const date = this.dataset.date;

            if (this.classList.contains('edit-btn')) {
                if (type === 'health') {
                    const time = this.dataset.time;
                    editHealthEntry(date, time);
                } else {
                    const id = this.dataset.id;
                    editWorkoutEntry(date, id);
                }
            } else {
                if (confirmAction('Вы уверены, что хотите удалить эту запись?')) {
                    if (type === 'health') {
                        const time = this.dataset.time;
                        deleteHealthEntry(date, time);
                    } else {
                        const id = this.dataset.id;
                        deleteWorkoutEntry(date, id);
                    }
                }
            }
        });
    });
}

// Функция редактирования записи здоровья
export function editHealthEntry(date, time) {
    activateTab('daily');

    const dateInput = document.getElementById('entry-date');
    if (dateInput) dateInput.value = date;

    const timeInput = document.getElementById('entry-time');
    if (timeInput) timeInput.value = time;

    const healthData = getHealthData();
    const entry = healthData[date].find(item => item.time === time);

    if (entry) {
        populateForm(entry);
        document.getElementById('daily-form').dataset.editing = `${date}|${time}`;
    }
}

// Функция редактирования тренировки
export function editWorkoutEntry(date, id) {
    activateTab('workout');

    const workoutHistory = getWorkoutHistory();
    const exercise = workoutHistory[date].find(item => item.id == id);

    if (exercise) {
        populateWorkoutForm(exercise);
        document.getElementById('workout-form').dataset.editing = `${date}|${id}`;
    }
}

// Функция удаления записи здоровья
function deleteHealthEntry(date, time) {
    const healthData = getHealthData();

    if (healthData[date]) {
        const index = healthData[date].findIndex(item => item.time === time);
        if (index !== -1) {
            healthData[date].splice(index, 1);

            // Удаляем дату, если записей больше нет
            if (healthData[date].length === 0) {
                delete healthData[date];
            }

            saveHealthData(healthData);
            loadHistoryData();
        }
    }
}

// Функция удаления тренировки
function deleteWorkoutEntry(date, id) {
    const workoutHistory = getWorkoutHistory();

    if (workoutHistory[date]) {
        const index = workoutHistory[date].findIndex(item => item.id == id);
        if (index !== -1) {
            workoutHistory[date].splice(index, 1);

            // Удаляем дату, если тренировок больше нет
            if (workoutHistory[date].length === 0) {
                delete workoutHistory[date];
            }

            saveWorkoutHistory(workoutHistory);
            loadHistoryData();
        }
    }
}
