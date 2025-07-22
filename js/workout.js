import {
    getExercisesList,
    saveExercisesList,
    getWorkoutHistory,
    saveWorkoutHistory
} from './storage.js';
import { generateId } from './utils.js';

export function initWorkoutTracker() {
    const workoutForm = document.getElementById('workout-form');
    if (!workoutForm) return;

    // Инициализация списка упражнений
    initExercisesList();

    // Обработчики событий
    document.getElementById('add-set')?.addEventListener('click', addSetRow);
    workoutForm.addEventListener('submit', saveExercise);
}

function initExercisesList() {
    const exercisesList = getExercisesList();
    const exerciseListEl = document.getElementById('exercise-list');

    exerciseListEl.innerHTML = '';
    exercisesList.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        exerciseListEl.appendChild(option);
    });
}

function addSetRow() {
    const tbody = document.getElementById('sets-body');
    const row = document.createElement('tr');
    row.innerHTML = `
    <td><input type="number" class="set-weight" step="0.1" min="0"></td>
    <td><input type="number" class="set-reps" min="1"></td>
    <td><button type="button" class="btn-remove-set"><i class="fas fa-times"></i></button></td>
  `;
    tbody.appendChild(row);
}

function saveExercise(e) {
    e.preventDefault();

    const exercisesList = getExercisesList();
    const workoutHistory = getWorkoutHistory();

    // Сбор данных из формы
    const exerciseName = document.getElementById('exercise-name').value.trim();
    const sets = [];

    const rpe = document.getElementById('workout-rpe').value;

    // Сохранение упражнения
    const exercise = {
        id: generateId(),
        name: exerciseName,
        rpe: rpe ? parseInt(rpe) : null,
        sets: sets,
        date: new Date().toISOString()
    };

    // Добавление в список упражнений
    if (!exercisesList.includes(exerciseName)) {
        exercisesList.push(exerciseName);
        saveExercisesList(exercisesList);
        initExercisesList();
    }

    // Сохранение в историю тренировок
    const today = new Date().toISOString().split('T')[0];
    if (!workoutHistory[today]) workoutHistory[today] = [];
    workoutHistory[today].push(exercise);
    saveWorkoutHistory(workoutHistory);

    // Обновление списка упражнений
    updateExercisesList(today);

    // Очистка формы
    workoutForm.reset();
    document.getElementById('sets-body').innerHTML = '';
    addSetRow();
}

function updateExercisesList(date) {
    const workoutHistory = getWorkoutHistory(); // Получаем данные из хранилища
    const container = document.getElementById('exercises-list');
    container.innerHTML = '';

    if (!workoutHistory[date] || workoutHistory[date].length === 0) {
        container.innerHTML = '<p>Упражнений пока нет</p>';
        return;
    }

    workoutHistory[date].forEach((exercise, index) => {
        const exerciseEl = document.createElement('div');
        exerciseEl.className = 'exercise-card';

        let setsHtml = '';
        exercise.sets.forEach((set, i) => {
            setsHtml += `<div>Подход ${i+1}: ${set.weight} кг × ${set.reps} повторений</div>`;
        });

        exerciseEl.innerHTML = `
      <div class="exercise-header">
        <h4>${exercise.name}</h4>
        <div class="exercise-rpe">RPE: ${exercise.rpe || 'не указано'}</div>
        <button class="delete-exercise" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="exercise-sets">${setsHtml}</div>
    `;

        container.appendChild(exerciseEl);
    });

    // Добавляем обработчики удаления
    document.querySelectorAll('.delete-exercise').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            workoutHistory[date].splice(index, 1);
            localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
            updateExercisesList(date);
        });
    });
}
