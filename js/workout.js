import { getExercisesList } from './storage.js';
import { loadHistoryData } from "./history.js";

let dataManagerInstance;

export function initWorkoutTracker(dataManager) {
    initExercisesList();
    dataManagerInstance = dataManager;


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
        if (e.target.closest('.btn-remove-set')) {
            const row = e.target.closest('tr');
            row.classList.add('removing');

            setTimeout(() => {
                row.remove();
            }, 300);
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

    // Получаем записи через DataManager
    const todayEntries = dataManagerInstance.getAllEntries()
        .filter(entry =>
            entry.type === 'training' &&
            entry.date === today &&
            !entry.isDraft
        );

    const container = document.getElementById('exercises-list');
    if (!container) return;

    container.innerHTML = '';

    if (todayEntries.length === 0) {
        container.innerHTML = '<p>Сегодня еще не добавлено ни одного упражнения</p>';
        return;
    }

    const title = document.createElement('h3');
    title.textContent = 'Сохраненные упражнения за сегодня:';
    container.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'today-exercises-list';

    todayEntries.forEach(entry => {
        const exercise = entry.data;
        const item = document.createElement('li');
        item.className = 'today-exercise-item';

        let setsInfo = '';
        exercise.sets.forEach((set, index) => {
            setsInfo += `<div>Подход ${index + 1}: ${set.weight} кг × ${set.reps} ${set.perLimb ? '(на каждую конечность)' : ''}</div>`;
        });

        item.innerHTML = `
            <div class="exercise-header">
                <strong>${exercise.name}</strong>
                <button class="btn-edit-exercise" data-id="${entry.id}">✏️</button>
            </div>
            <div class="exercise-sets">${setsInfo}</div>
            ${exercise.rpe ? `<div>RPE: ${exercise.rpe}</div>` : ''}
        `;

        list.appendChild(item);
    });

    container.appendChild(list);

    // Обработчики для кнопок редактирования
    container.querySelectorAll('.btn-edit-exercise').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const entry = todayEntries.find(entry => entry.id == id);

            if (entry) {
                populateWorkoutForm(entry);
                document.getElementById('workout-form').dataset.editing = `${entry.date}|${entry.id}`;
                document.getElementById('workout-form').scrollIntoView();
            }
        });
    });
}

// Заполнение формы тренировки
export function populateWorkoutForm(entry) {
    const exercise = entry.data;
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

            // Исправляем значения для валидации
            const weightValue = (set.weight !== undefined && set.weight !== null) ? set.weight : '';
            const repsValue = (set.reps !== undefined && set.reps !== null) ? set.reps : '';

            row.innerHTML = `
    <td class="set-inputs">
        <div class="input-group weight">
            <label>Вес (кг)</label>
            <input type="number" class="set-weight" step="0.1" min="0" 
                   value="${weightValue}">
        </div>
        <div class="input-group reps">
            <label>Повторения</label>
            <input type="number" class="set-reps" min="1" 
                   value="${repsValue}">
        </div>
        <div class="per-limb-cell">
            <label class="per-limb-label" title="На каждую конечность">
                <input type="checkbox" class="set-per-limb" ${set.perLimb ? 'checked' : ''}>
                <span class="per-limb-text">На конечность</span>
                <span class="per-limb-icon">⇆</span>
            </label>
        </div>
        <div class="remove-cell">
            <button type="button" class="btn-remove-set">
                <i class="fas fa-trash"></i>
                <span>Удалить</span>
            </button>
        </div>
    </td>
`;
            setsContainer.appendChild(row);
        });
    }
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

    // Исправляем значения для пустых строк
    if (lastWeight === '') lastWeight = '';
    if (lastReps === '') lastReps = '';

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
            <button type="button" class="btn-remove-set">
                <i class="fas fa-trash"></i>
                <span>Удалить</span>
            </button>
        </div>
    </td>
`;
    tbody.appendChild(row);

    // Фокус на поле веса нового подхода
    const newWeightInput = row.querySelector('.set-weight');
    if (newWeightInput) newWeightInput.focus();
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

function saveWorkout(e) {
    e.preventDefault();

    const today = new Date().toISOString().split('T')[0];
    const exerciseName = document.getElementById('exercise-name').value.trim();
    const rpeInput = document.getElementById('workout-rpe');

    // Проверка названия
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

        if (weightInput && repsInput && repsInput.value) {
            setsData.push({
                weight: parseFloat(weightInput.value) || 0,
                reps: parseInt(repsInput.value),
                perLimb: perLimbCheckbox ? perLimbCheckbox.checked : false
            });
        } else if (repsInput && !repsInput.value) {
            hasInvalidSets = true;
        }
    });

    if (setsData.length === 0) {
        alert(hasInvalidSets
            ? 'Заполните поле "Повторения" во всех подходах!'
            : 'Добавьте хотя бы один подход!');
        return;
    }

    // Проверяем режим редактирования
    const editingFlag = e.target.dataset.editing;
    let exerciseData;
    let entryDate = today;

    if (editingFlag) {
        const [editDate, editId] = editingFlag.split('|');
        entryDate = editDate;

        // Получаем существующую запись
        const existingEntry = dataManagerInstance.getAllEntries().find(
            e => e.id == editId && e.date === editDate
        );

        if (!existingEntry) {
            alert('Ошибка: запись для редактирования не найдена');
            return;
        }

        // Обновляем данные
        exerciseData = {
            ...existingEntry.data,
            name: exerciseName,
            rpe: rpeInput?.value || null,
            sets: setsData
        };
    } else {
        // Новая запись
        exerciseData = {
            id: Date.now().toString(),
            name: exerciseName,
            rpe: rpeInput?.value || null,
            sets: setsData
        };
    }

    // Сохраняем через DataManager
    dataManagerInstance.saveEntry('training', entryDate, exerciseData, false);

    alert('Упражнение успешно сохранено!');
    clearWorkoutForm();
    loadTodayExercises();

    // Обновляем историю
    if (typeof loadHistoryData === 'function') {
        loadHistoryData(dataManagerInstance);
    }
}
