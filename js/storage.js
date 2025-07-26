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

// Получение истории тренировок с расчетом 1ПМ
export function getWorkoutHistory() {
    const history = JSON.parse(localStorage.getItem('workoutHistory')) || {};
    return cleanWorkoutHistory(history);
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
                    // Удаляем подходы с нулевым весом
                    const weight = parseFloat(set.weight);
                    return !isNaN(weight) && weight > 0;
                })
            };
        });
    }

    return cleaned;
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
