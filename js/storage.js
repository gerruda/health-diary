// Получение данных
export function getHealthData() {
    const rawData = JSON.parse(localStorage.getItem('healthData')) || {};

    // Миграция старых данных в новый формат
    for (const date in rawData) {
        rawData[date] = rawData[date].map(entry => {
            if (entry.weight && !entry.weighings) {
                return {
                    ...entry,
                    weighings: [{
                        weight: entry.weight,
                        condition: entry.weightCondition || ''
                    }]
                };
            }
            return entry;
        });
    }

    return rawData;
}

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
    return JSON.parse(localStorage.getItem('exercisesList')) || [];
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
    localStorage.setItem('exercisesList', JSON.stringify(list));
}

export function saveWorkoutHistory(history) {
    localStorage.setItem('workoutHistory', JSON.stringify(history));
}

// Получение истории тренировок с расчетом 1ПМ
export function getWorkoutHistory() {
    const history = JSON.parse(localStorage.getItem('workoutHistory')) || {};

    // Гарантируем наличие ID для всех тренировок
    for (const date in history) {
        history[date] = history[date].map(exercise => {
            if (!exercise.id) {
                return {...exercise, id: Date.now()};
            }
            return exercise;
        });
    }

    return history;
}

export function migrateData() {
    const healthData = JSON.parse(localStorage.getItem('healthData')) || {};
    let needsMigration = false;

    for (const date in healthData) {
        healthData[date] = healthData[date].map(entry => {
            if (entry.weight && !entry.weighings) {
                needsMigration = true;
                return {
                    ...entry,
                    weighings: [{
                        weight: entry.weight,
                        condition: entry.weightCondition || ''
                    }],
                    weight: undefined,
                    weightCondition: undefined
                };
            }
            return entry;
        });
    }

    if (needsMigration) {
        localStorage.setItem('healthData', JSON.stringify(healthData));
        console.log('Данные успешно мигрированы');
    }
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

export function cleanupWorkoutHistory() {
    const workoutHistory = getWorkoutHistory();
    let hasChanges = false;

    for (const date in workoutHistory) {
        // Фильтруем упражнения с пустым названием
        const filtered = workoutHistory[date].filter(exercise =>
            exercise.name && exercise.name.trim() !== ''
        );

        if (filtered.length !== workoutHistory[date].length) {
            workoutHistory[date] = filtered;
            hasChanges = true;
        }
    }

    if (hasChanges) {
        saveWorkoutHistory(workoutHistory);
        console.log('Workout history cleaned up');
    }
}

// Очистка списка упражнений
export function cleanupExercisesList() {
    let exercisesList = getExercisesList();
    const filtered = exercisesList.filter(name => name && name.trim() !== '');

    if (filtered.length !== exercisesList.length) {
        saveExercisesList(filtered);
        console.log('Exercises list cleaned up');
    }
}
