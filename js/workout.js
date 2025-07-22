import {
    getExercisesList,
    saveExercisesList,
    getWorkoutHistory,
    saveWorkoutHistory
} from './storage.js';
import {activateTab, generateId} from './utils.js';

export function initWorkoutTracker() {
    const workoutForm = document.getElementById('workout-form');
    if (!workoutForm) return;

    // Инициализация списка упражнений
    initExercisesList();

    // Обработчики событий
    document.getElementById('add-set')?.addEventListener('click', addSetRow);
    workoutForm.addEventListener('submit', saveExercise);

    document.getElementById('edit-workout-btn')?.addEventListener('click', () => {
        const exerciseName = document.getElementById('exercise-name').value;
        if (exerciseName) {
            document.getElementById('workout-form').dataset.editing = exerciseName;
        }
    });
}

// Функция редактирования тренировки
export function editWorkoutEntry(date, id) {
    activateTab('workout');

    const workoutHistory = getWorkoutHistory();
    const exercise = workoutHistory[date].find(item => item.id == id);

    if (exercise) {
        populateWorkoutForm(exercise);

        // Устанавливаем флаг редактирования
        document.getElementById('workout-form').dataset.editing = `${date}|${id}`;
    }
}

// Заполнение формы тренировки
function populateWorkoutForm(exercise) {
    document.getElementById('exercise-name').value = exercise.name;
    document.getElementById('rpe-workout').value = exercise.rpe || '';

    // Очищаем существующие подходы
    const setsContainer = document.getElementById('sets-container');
    setsContainer.innerHTML = '';

    // Добавляем подходы
    exercise.sets.forEach((set, index) => {
        const setElement = createSetElement(set.weight, set.reps, index);
        setsContainer.appendChild(setElement);
    });

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
    const sets = [];

    const rpe = document.getElementById('workout-rpe').value;

    // Сохранение упражнения
    const exerciseData = {
        id: Date.now(),
        name: exerciseName,
        rpe: document.getElementById('rpe-workout').value || null,
        sets: setsData
    };

    // Добавление в список упражнений
    if (!exercisesList.includes(exerciseName)) {
        exercisesList.push(exerciseName);
        saveExercisesList(exercisesList);
        initExercisesList();
    }

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
