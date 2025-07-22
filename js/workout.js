import {
    getExercisesList,
    getWorkoutHistory,
    saveWorkoutHistory
} from './storage.js';
import { activateTab } from './utils.js';

let setCount = 0;

export function initWorkoutTracker() {
    const workoutForm = document.getElementById('workout-form');
    if (!workoutForm) return;

    // Инициализация списка упражнений
    initExercisesList();

    // Обработчики событий
    document.getElementById('edit-workout-btn')?.addEventListener('click', () => {
        const exerciseName = document.getElementById('exercise-name').value;
        if (exerciseName) {
            document.getElementById('workout-form').dataset.editing = exerciseName;
        }
    });

    document.getElementById('workout-form').addEventListener('submit', saveWorkout);
}

// Заполнение формы тренировки
export function populateWorkoutForm(exercise) {
    // Проверка элементов перед установкой значений
    const nameInput = document.getElementById('exercise-name');
    if (nameInput) nameInput.value = exercise.name || '';

    const rpeInput = document.getElementById('workout-rpe');
    if (rpeInput) rpeInput.value = exercise.rpe || '';

    const setsContainer = document.getElementById('sets-body');
    if (setsContainer) {
        setsContainer.innerHTML = '';

        exercise.sets.forEach((set, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="number" class="set-weight" step="0.1" min="0" value="${set.weight || ''}"></td>
                <td><input type="number" class="set-reps" min="1" value="${set.reps || ''}"></td>
                <td><button type="button" class="btn-remove-set"><i class="fas fa-times"></i></button></td>
            `;
            setsContainer.appendChild(row);
        });
    }

    // Обновляем счетчик подходов
    setCount = exercise.sets.length;
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

// Обновленная функция сохранения тренировки
function saveWorkout(e) {
    e.preventDefault();

    const workoutHistory = getWorkoutHistory();
    const date = new Date().toISOString().split('T')[0];
    const exerciseName = document.getElementById('exercise-name').value;

    // Сохранение упражнения
    const exerciseData = {
        id: Date.now(),
        name: exerciseName,
        rpe: document.getElementById('rpe-workout').value || null,
        sets: setsData
    };


    // Проверяем, редактируем ли существующую тренировку
    const editingFlag = e.target.dataset.editing;
    if (editingFlag) {
        const [editDate, editId] = editingFlag.split('|');

        if (workoutHistory[editDate]) {
            const index = workoutHistory[editDate].findIndex(item => item.id == editId);
            if (index !== -1) {
                workoutHistory[editDate][index] = exerciseData;
            } else {
                workoutHistory[editDate].push(exerciseData);
            }
        } else {
            workoutHistory[editDate] = [exerciseData];
        }

        // Сбрасываем флаг редактирования
        delete e.target.dataset.editing;
    } else {
        // Новая тренировка
        if (!workoutHistory[date]) workoutHistory[date] = [];
        workoutHistory[date].push(exerciseData);
    }

    saveWorkoutHistory(workoutHistory);

    // Очистка формы
    document.getElementById('sets-body').innerHTML = '';
    addSetRow();
}

export function editWorkoutEntry(date, id) {
    activateTab('workout');

    const workoutHistory = getWorkoutHistory();
    const exercise = workoutHistory[date].find(item => item.id == id);

    if (exercise) {
        populateWorkoutForm(exercise);
        document.getElementById('workout-form').dataset.editing = `${date}|${id}`;
    }
}
