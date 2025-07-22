import { getHealthData, getWorkoutHistory } from './storage.js';
import { formatDate, activateTab } from './utils.js';
import { populateForm } from './daily-tracker.js'
import { editWorkoutEntry } from './workout.js'

export function initHistory() {
    loadHistoryData();

    // Обработчики для кнопок выбора даты
    document.getElementById('history-date')?.addEventListener('change', loadHistoryData);
}

export function loadHistoryData() {
    const healthData = getHealthData();
    const workoutHistory = getWorkoutHistory();
    const historyList = document.getElementById('history-list');

    if (!historyList) return;

    historyList.innerHTML = '';

    // Объединяем даты из обоих источников
    const allDates = [
        ...Object.keys(healthData),
        ...Object.keys(workoutHistory)
    ];

    // Удаляем дубликаты и сортируем
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
                const entryEl = document.createElement('div');
                entryEl.className = 'history-entry';
                entryEl.innerHTML = `
          <div class="entry-header">
            <span class="entry-time">${entry.time}</span>
            <div class="entry-actions">
              <button class="edit-btn" data-type="health" data-date="${date}" data-time="${entry.time}">✏️</button>
            </div>
          </div>
          ${entry.pulse ? `<p>Пульс: ${entry.pulse} уд/мин</p>` : ''}
          ${entry.sleepDuration ? `<p>Сон: ${entry.sleepDuration}</p>` : ''}
          ${entry.weight ? `<p>Вес: ${entry.weight} кг</p>` : ''}
          ${entry.steps ? `<p>Шаги: ${entry.steps}</p>` : ''}
          ${entry.calories ? `<p>Калории: ${entry.calories} ккал</p>` : ''}
          ${entry.notes ? `<p>Заметки: ${entry.notes}</p>` : ''}
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

    // Добавляем обработчики для кнопок редактирования
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            const date = this.dataset.date;

            if (type === 'health') {
                const time = this.dataset.time;
                editHealthEntry(date, time);
            } else {
                const id = this.dataset.id;
                editWorkoutEntry(date, id);
            }
        });
    });
}

// Функция редактирования записи здоровья
export function editHealthEntry(date, time) {
    activateTab('daily'); // Изменено с 'daily-tracker' на 'daily'

    // Устанавливаем дату и время
    const dateInput = document.getElementById('entry-date');
    if (dateInput) dateInput.value = date;

    const timeInput = document.getElementById('entry-time');
    if (timeInput) timeInput.value = time;

    // Загружаем данные
    const healthData = getHealthData();
    const entry = healthData[date].find(item => item.time === time);

    if (entry) {
        populateForm(entry);
        document.getElementById('daily-form').dataset.editing = `${date}|${time}`;
    }
}
