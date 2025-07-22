import { getHealthData, getWorkoutHistory } from './storage.js';
import { formatDate } from './utils.js';

export function initHistory() {
    loadHistoryData();
}

export function loadHistoryData() {
    const healthData = getHealthData();
    const workoutHistory = getWorkoutHistory();
    const historyList = document.getElementById('history-list');

    if (!historyList) return;

    // Очищаем список
    historyList.innerHTML = '';

    // Получаем все даты и сортируем их
    const allDates = [
        ...Object.keys(healthData),
        ...Object.keys(workoutHistory)
    ];

    const uniqueDates = [...new Set(allDates)].sort((a, b) =>
        new Date(b) - new Date(a)
    );

    if (uniqueDates.length === 0) {
        historyList.innerHTML = '<p>История записей пока пуста</p>';
        return;
    }

    // Создаем элементы для каждой даты
    uniqueDates.forEach(date => {
        const dateHeader = document.createElement('h3');
        dateHeader.textContent = formatDate(new Date(date), {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        historyList.appendChild(dateHeader);

        // Добавляем записи о здоровье
        if (healthData[date]) {
            healthData[date].forEach(entry => {
                const entryEl = document.createElement('div');
                entryEl.className = 'history-entry';
                entryEl.innerHTML = `
                    <p><strong>${entry.time}</strong></p>
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

        // Добавляем записи о тренировках
        if (workoutHistory[date]) {
            workoutHistory[date].forEach(exercise => {
                const exerciseEl = document.createElement('div');
                exerciseEl.className = 'history-exercise';
                exerciseEl.innerHTML = `
                    <p><strong>${exercise.name}</strong>${exercise.rpe ? ` (RPE: ${exercise.rpe})` : ''}</p>
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
}
