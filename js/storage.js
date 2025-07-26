export function getSettings() {
    return JSON.parse(localStorage.getItem('healthSettings')) || {
        reminderTime: '20:00',
        reminderActive: true
    };
}

export function getWeightConditions() {
    let conditions = JSON.parse(localStorage.getItem('weightConditions'));

    if (!conditions || conditions.length === 0) {
        conditions = [
            'Утром натощак',
            'Вечером перед сном',
            'После тренировки',
        ];
        saveWeightConditions(conditions);
    }

    return conditions;
}

export function getExercisesList() {
    const list = JSON.parse(localStorage.getItem('exercisesList')) || [];
    // Фильтрация пустых названий
    return list.filter(name => name && name.trim() !== '');
}

// Сохранение данных
export function saveHealthData(data) {
    localStorage.setItem('healthData', JSON.stringify(data));
}

export function saveSettings(settings) {
    localStorage.setItem('healthSettings', JSON.stringify(settings));
}

export function saveWeightConditions(conditions) {
    localStorage.setItem('weightConditions', JSON.stringify(conditions));
}

export function saveExercisesList(list) {
    // Фильтрация пустых названий перед сохранением
    const filteredList = list.filter(name => name && name.trim() !== '');
    localStorage.setItem('exercisesList', JSON.stringify(filteredList));
}

export function saveWorkoutHistory(history) {
    // Очистка перед сохранением
    const cleanedHistory = cleanWorkoutHistory(history);
    localStorage.setItem('workoutHistory', JSON.stringify(cleanedHistory));
}

// Очистка истории тренировок
function cleanWorkoutHistory(history) {
    const cleaned = {};

    for (const date in history) {
        // Фильтруем упражнения с пустым названием
        cleaned[date] = history[date].filter(exercise =>
            exercise.name && exercise.name.trim() !== ''
        );

        // Фильтруем подходы с невалидными данными
        cleaned[date] = cleaned[date].map(exercise => {
            if (!exercise.sets) return exercise;

            return {
                ...exercise,
                sets: exercise.sets.filter(set => {
                    const weight = parseFloat(set.weight);
                    return !isNaN(weight);
                })
            };
        });
    }

    return cleaned;
}

export function migrateData() {
    // Проверяем наличие старой структуры данных
    const oldHealthData = localStorage.getItem('healthData');
    const oldWorkoutData = localStorage.getItem('workoutHistory');

    if (oldHealthData) {
        try {
            const parsed = JSON.parse(oldHealthData);
            // Преобразуем старые данные в новую структуру
            const newData = {};
            for (const date in parsed) {
                newData[date] = [{
                    time: "12:00",
                    ...parsed[date]
                }];
            }
            localStorage.setItem('healthData_v2', JSON.stringify(newData));
            localStorage.removeItem('healthData');
        } catch (e) {
            console.error('Migration error:', e);
        }
    }

    if (oldWorkoutData) {
        try {
            localStorage.setItem('workoutHistory_v2', oldWorkoutData);
            localStorage.removeItem('workoutHistory');
        } catch (e) {
            console.error('Workout migration error:', e);
        }
    }
}

export function getHealthData() {
    const data = localStorage.getItem('healthData_v2');
    return data ? JSON.parse(data) : {};
}

export function getWorkoutHistory() {
    const data = localStorage.getItem('workoutHistory_v2');
    return data ? JSON.parse(data) : {};
}

export function getFormDraft(date) {
    const drafts = JSON.parse(localStorage.getItem('dailyFormDrafts') || '{}');
    return drafts[date];
}

export function saveFormDraft(date, draft) {
    const drafts = JSON.parse(localStorage.getItem('dailyFormDrafts') || '{}');
    drafts[date] = draft;
    localStorage.setItem('dailyFormDrafts', JSON.stringify(drafts));
}

// Автоматическая очистка при каждом получении данных
export function cleanupWorkoutHistory() {
    const workoutHistory = getWorkoutHistory();
    saveWorkoutHistory(workoutHistory);
}

export function cleanupExercisesList() {
    const exercisesList = getExercisesList();
    saveExercisesList(exercisesList);
}

// Дополнительные функции для аналитики
export function getExerciseMetrics() {
    return JSON.parse(localStorage.getItem('exerciseMetrics')) || {
        selectedMetric: 'orm'
    };
}

export function saveExerciseMetrics(metrics) {
    localStorage.setItem('exerciseMetrics', JSON.stringify(metrics));
}

