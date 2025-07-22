import {
    getExercisesList,
    getWorkoutHistory,
    saveWorkoutHistory,
    saveExercisesList
} from './storage.js';

let setCount = 0;

export function initWorkoutTracker() {
    const workoutForm = document.getElementById('workout-form');
    if (!workoutForm) return;

    // Инициализация списка упражнений
    initExercisesList();

    // Добавляем обработчик для кнопки "Добавить подход"
    document.getElementById('add-set')?.addEventListener('click', addSetRow);

    // Добавляем обработчик для удаления подходов
    document.getElementById('sets-body')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-set')) {
            e.target.closest('tr').remove();
        }
    });

    // Обработчики событий
    document.getElementById('edit-workout-btn')?.addEventListener('click', () => {
        const exerciseName = document.getElementById('exercise-name').value;
        if (exerciseName) {
            document.getElementById('workout-form').dataset.editing = exerciseName;
        }
    });

    workoutForm.addEventListener('submit', saveWorkout);
}

// Заполнение формы тренировки
export function populateWorkoutForm(exercise) {
    // Проверка элементов перед установкой значений
    const nameInput = document.getElementById('exercise-name');
    if (nameInput) nameInput.value = exercise.name || '';

    const rpeInput = document.getElementById('workout-rpe'); // Исправлено на workout-rpe
    if (rpeInput) rpeInput.value = exercise.rpe || '';

    const setsContainer = document.getElementById('sets-body');
    if (setsContainer) {
        setsContainer.innerHTML = '';

        exercise.sets.forEach((set) => {
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

    if (exerciseListEl) {
        exerciseListEl.innerHTML = '';
        exercisesList.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            exerciseListEl.appendChild(option);
        });
    }
}

function addSetRow() {
    const tbody = document.getElementById('sets-body');
    if (tbody) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="number" class="set-weight" step="0.1" min="0"></td>
            <td><input type="number" class="set-reps" min="1"></td>
            <td><button type="button" class="btn-remove-set"><i class="fas fa-times"></i></button></td>
        `;
        tbody.appendChild(row);
    }
}

// Обновленная функция сохранения тренировки
function saveWorkout(e) {
    e.preventDefault();

    const workoutHistory = getWorkoutHistory();
    const date = new Date().toISOString().split('T')[0];
    const exerciseName = document.getElementById('exercise-name').value;
    const rpeInput = document.getElementById('workout-rpe');

    // Собираем данные о подходах
    const setsData = [];
    const setRows = document.querySelectorAll('#sets-body tr');
    setRows.forEach(row => {
        const weightInput = row.querySelector('.set-weight');
        const repsInput = row.querySelector('.set-reps');

        if (weightInput && repsInput && weightInput.value && repsInput.value) {
            setsData.push({
                weight: parseFloat(weightInput.value),
                reps: parseInt(repsInput.value)
            });
        }
    });

    if (setsData.length === 0) {
        alert('Добавьте хотя бы один подход!');
        return;
    }

    // Проверяем, редактируем ли существующую тренировку
    const editingFlag = e.target.dataset.editing;
    let exerciseData;

    if (editingFlag) {
        const [editDate, editId] = editingFlag.split('|');

        // Находим существующую тренировку
        const existingExercise = workoutHistory[editDate]?.find(item => item.id == editId);

        // Создаем обновленные данные с сохранением ID
        exerciseData = {
            id: existingExercise.id, // Сохраняем оригинальный ID
            name: exerciseName,
            rpe: rpeInput?.value || null,
            sets: setsData
        };

        // Обновляем запись
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
        exerciseData = {
            id: Date.now(), // Генерируем новый ID
            name: exerciseName,
            rpe: rpeInput?.value || null,
            sets: setsData
        };

        if (!workoutHistory[date]) workoutHistory[date] = [];
        workoutHistory[date].push(exerciseData);

        // Добавляем упражнение в список, если его там нет
        const exercisesList = getExercisesList();
        if (!exercisesList.includes(exerciseName)) {
            exercisesList.push(exerciseName);
            saveExercisesList(exercisesList);
            initExercisesList();
        }
    }

    saveWorkoutHistory(workoutHistory);
    alert('Тренировка сохранена!');
    clearWorkoutForm();
}

function clearWorkoutForm() {
    document.getElementById('exercise-name').value = '';
    const rpeInput = document.getElementById('workout-rpe');
    if (rpeInput) rpeInput.value = '';

    const tbody = document.getElementById('sets-body');
    if (tbody) {
        tbody.innerHTML = '';
        addSetRow();
    }
}

