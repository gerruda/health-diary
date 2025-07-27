import {
    getExercisesList,
    getWorkoutHistory,
    saveWorkoutHistory,
    saveExercisesList
} from './storage.js';
import { loadHistoryData } from "./history.js";

let setCount = 0;

export function initWorkoutTracker() {
    initExercisesList();

    const workoutForm = document.getElementById('workout-form');
    if (!workoutForm) return;

    // Переименовываем кнопку сохранения
    const submitButton = workoutForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Сохранить упражнение';
    }

    // Переименовываем заголовок раздела
    const workoutTitle = document.getElementById('workout-title');
    if (workoutTitle) {
        workoutTitle.textContent = 'Добавить упражнение';
    }

    // Загружаем и отображаем сохраненные упражнения за сегодня
    loadTodayExercises();

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

// Загрузка и отображение упражнений за сегодня
function loadTodayExercises() {
    const today = new Date().toISOString().split('T')[0];
    const workoutHistory = getWorkoutHistory();
    const todayExercises = workoutHistory[today] || [];
    const container = document.getElementById('exercises-list');

    if (!container) {
        console.error('Контейнер exercises-list не найден!');
        return;
    }

    container.innerHTML = '';

    if (todayExercises.length === 0) {
        container.innerHTML = '<p>Сегодня еще не добавлено ни одного упражнения</p>';
        return;
    }

    const title = document.createElement('h3');
    title.textContent = 'Сохраненные упражнения за сегодня:';
    container.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'today-exercises-list';

    todayExercises.forEach(exercise => {
        const item = document.createElement('li');
        item.className = 'today-exercise-item';

        let setsInfo = '';
        exercise.sets.forEach((set, index) => {
            setsInfo += `<div>Подход ${index + 1}: ${set.weight} кг × ${set.reps} ${set.perLimb ? '(на каждую конечность)' : ''}</div>`;
        });

        item.innerHTML = `
            <div class="exercise-header">
                <strong>${exercise.name}</strong>
                <button class="btn-edit-exercise" data-id="${exercise.id}">✏️</button>
            </div>
            <div class="exercise-sets">${setsInfo}</div>
            ${exercise.rpe ? `<div>RPE: ${exercise.rpe}</div>` : ''}
        `;

        list.appendChild(item);
    });

    container.appendChild(list);

    // Добавляем обработчики для кнопок редактирования
    container.querySelectorAll('.btn-edit-exercise').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const exercise = todayExercises.find(ex => ex.id == id);
            if (exercise) {
                populateWorkoutForm(exercise);
                // Устанавливаем флаг редактирования
                document.getElementById('workout-form').dataset.editing = `${today}|${id}`;

                // Прокручиваем к форме
                document.getElementById('workout-form').scrollIntoView();
            }
        });
    });
}

// Заполнение формы тренировки
export function populateWorkoutForm(exercise) {
    // Обновляем заголовок при редактировании
    const workoutTitle = document.getElementById('workout-title');
    if (workoutTitle) {
        workoutTitle.textContent = 'Редактировать упражнение';
    }

    // Проверка элементов перед установкой значений
    const nameInput = document.getElementById('exercise-name');
    if (nameInput) nameInput.value = exercise.name || '';

    const rpeInput = document.getElementById('workout-rpe');
    if (rpeInput) rpeInput.value = exercise.rpe || '';

    const setsContainer = document.getElementById('sets-body');
    if (setsContainer) {
        setsContainer.innerHTML = '';

        exercise.sets.forEach((set) => {
            const row = document.createElement('tr');
            row.className = 'approach-row';
            row.innerHTML = `
                <td class="set-inputs">
                    <div class="input-group weight">
                        <label>Вес (кг)</label>
                        <input type="number" class="set-weight" step="0.1" min="0" 
                               value="${set.weight || ''}">
                    </div>
                    <div class="input-group reps">
                        <label>Повторения</label>
                        <input type="number" class="set-reps" min="1" 
                               value="${set.reps || ''}">
                    </div>
                    <div class="per-limb-cell">
                        <label class="per-limb-label" title="На каждую конечность">
                            <input type="checkbox" class="set-per-limb" ${set.perLimb ? 'checked' : ''}>
                            <span class="per-limb-text">На конечность</span>
                            <span class="per-limb-icon">⇆</span>
                        </label>
                    </div>
                    <div class="remove-cell">
                        <button type="button" class="btn-remove-set"><i class="fas fa-times"></i></button>
                    </div>
                </td>
            `;
            setsContainer.appendChild(row);
        });
    }
    if (setsContainer) {
        setsContainer.innerHTML = '';

        exercise.sets.forEach((set) => {
            const row = document.createElement('tr');
            row.innerHTML = `
    <td class="set-inputs">
        <div class="input-group">
            <label>Вес (кг)</label>
            <input type="number" class="set-weight" step="0.1" min="0" 
                   value="${set.weight || ''}">
        </div>
        <div class="input-group">
            <label>Повторения</label>
            <input type="number" class="set-reps" min="1" 
                   value="${set.reps || ''}">
        </div>
    </td>
    <td class="per-limb-cell">
        <label class="per-limb-label" title="На каждую конечность">
            <input type="checkbox" class="set-per-limb" ${set.perLimb ? 'checked' : ''}>
            <span class="per-limb-icon">⇆</span>
        </label>
    </td>
    <td class="remove-cell">
        <button type="button" class="btn-remove-set"><i class="fas fa-times"></i></button>
    </td>
`;
            setsContainer.appendChild(row);
        });
    }

    // Обновляем счетчик подходов
    setCount = exercise.sets.length;
}

export function initExercisesList() {
    let exercisesList = getExercisesList();

    // Фильтрация пустых названий
    exercisesList = exercisesList.filter(name => name && name.trim() !== '');

    const exerciseListEl = document.getElementById('exercise-list');
    if (exerciseListEl) {
        exerciseListEl.innerHTML = '';
        exercisesList.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
            exerciseListEl.appendChild(option);
        });
    }
}

function addSetRow() {
    const tbody = document.getElementById('sets-body');
    if (!tbody) return;

    // Получаем данные последнего подхода
    const lastRow = tbody.querySelector('tr:last-child');
    let lastWeight = '';
    let lastReps = '';
    let lastPerLimb = false;

    if (lastRow) {
        const weightInput = lastRow.querySelector('.set-weight');
        const repsInput = lastRow.querySelector('.set-reps');
        const perLimbCheckbox = lastRow.querySelector('.set-per-limb');

        if (weightInput) lastWeight = weightInput.value;
        if (repsInput) lastReps = repsInput.value;
        if (perLimbCheckbox) lastPerLimb = perLimbCheckbox.checked;
    }

    const row = document.createElement('tr');
    row.className = 'approach-row';
    row.innerHTML = `
        <td class="set-inputs">
            <div class="input-group weight">
                <label>Вес (кг)</label>
                <input type="number" class="set-weight" step="0.1" min="0" 
                       value="${lastWeight}">
            </div>
            <div class="input-group reps">
                <label>Повторения</label>
                <input type="number" class="set-reps" min="1" 
                       value="${lastReps}">
            </div>
            <div class="per-limb-cell">
                <label class="per-limb-label" title="На каждую конечность">
                    <input type="checkbox" class="set-per-limb" ${lastPerLimb ? 'checked' : ''}>
                    <span class="per-limb-text">На конечность</span>
                    <span class="per-limb-icon">⇆</span>
                </label>
            </div>
            <div class="remove-cell">
                <button type="button" class="btn-remove-set"><i class="fas fa-times"></i></button>
            </div>
        </td>
    `;
    tbody.appendChild(row);

    // Фокус на поле веса нового подхода
    const newWeightInput = row.querySelector('.set-weight');
    if (newWeightInput) newWeightInput.focus();
}

// Обновленная функция сохранения тренировки
function saveWorkout(e) {
    e.preventDefault();

    const workoutHistory = getWorkoutHistory();
    const date = new Date().toISOString().split('T')[0];
    const exerciseName = document.getElementById('exercise-name').value.trim();
    const rpeInput = document.getElementById('workout-rpe');

    // Проверка названия упражнения
    if (!exerciseName) {
        alert('Введите название упражнения!');
        return;
    }

    // Собираем данные о подходах
    const setsData = [];
    const setRows = document.querySelectorAll('#sets-body tr');
    let hasInvalidSets = false;

    setRows.forEach(row => {
        const weightInput = row.querySelector('.set-weight');
        const repsInput = row.querySelector('.set-reps');
        const perLimbCheckbox = row.querySelector('.set-per-limb');

        // Разрешаем вес 0 для упражнений без дополнительного веса
        if (weightInput && repsInput && repsInput.value) {
            const weightValue = parseFloat(weightInput.value) || 0;

            setsData.push({
                weight: weightValue,
                reps: parseInt(repsInput.value),
                perLimb: perLimbCheckbox ? perLimbCheckbox.checked : false
            });
        } else if (repsInput && !repsInput.value) {
            hasInvalidSets = true;
        }
    });

    if (setsData.length === 0) {
        if (hasInvalidSets) {
            alert('Заполните поле "Повторения" во всех подходах!');
        } else {
            alert('Добавьте хотя бы один подход!');
        }
        return;
    }

    // Проверяем, редактируем ли существующее упражнение
    const editingFlag = e.target.dataset.editing;
    let exerciseData;

    if (editingFlag) {
        const [editDate, editId] = editingFlag.split('|');

        // Находим существующее упражнение
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
        // Новое упражнение
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
    alert('Упражнение успешно сохранено!');
    clearWorkoutForm();

    // Обновляем список упражнений за сегодня
    loadTodayExercises();

    // Обновляем историю
    if (typeof loadHistoryData === 'function') {
        loadHistoryData();
    }
}

function clearWorkoutForm() {
    document.getElementById('exercise-name').value = '';
    const rpeInput = document.getElementById('workout-rpe');
    if (rpeInput) rpeInput.value = '';

    const tbody = document.getElementById('sets-body');
    if (tbody) {
        tbody.innerHTML = '';
        // Добавляем первый пустой подход
        addSetRow();
    }

    // Восстанавливаем заголовок
    const workoutTitle = document.getElementById('workout-title');
    if (workoutTitle) {
        workoutTitle.textContent = 'Добавить упражнение';
    }

    // Сбрасываем флаг редактирования
    delete document.getElementById('workout-form').dataset.editing;
}
