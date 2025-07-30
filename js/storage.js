const STORAGE_KEY = 'health-diary-entries';
const EXERCISES_KEY = 'exercisesList';
const EXERCISE_METRICS_KEY = 'exerciseMetrics';
const WEIGHT_CONDITIONS_KEY = 'weightConditions';
const SETTINGS_KEY = 'healthSettings';

// Основные функции для работы с данными
export function getExercisesList() {
    const list = localStorage.getItem(EXERCISES_KEY);
    return list ? JSON.parse(list) : [];
}

export function saveExercisesList(list) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(list));
}

export function getSettings() {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
        reminderTime: '20:00',
        reminderActive: true
    };
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getWeightConditions() {
    let conditions = JSON.parse(localStorage.getItem(WEIGHT_CONDITIONS_KEY));

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

export function saveWeightConditions(conditions) {
    localStorage.setItem(WEIGHT_CONDITIONS_KEY, JSON.stringify(conditions));
}

export function getExerciseMetrics() {
    return JSON.parse(localStorage.getItem(EXERCISE_METRICS_KEY)) || {
        selectedMetric: 'orm'
    };
}

export function saveExerciseMetrics(metrics) {
    localStorage.setItem(EXERCISE_METRICS_KEY, JSON.stringify(metrics));
}

// Функции для совместимости (реализованы через DataManager)
export function getHealthData() {
    console.warn("getHealthData() is deprecated. Use DataManager instead.");
    return {};
}

export function getWorkoutHistory() {
    console.warn("getWorkoutHistory() is deprecated. Use DataManager instead.");
    return {};
}

export function saveWorkoutHistory(history) {
    console.warn("saveWorkoutHistory() is deprecated. Use DataManager instead.");
}
