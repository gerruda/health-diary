// Получение данных
export function getHealthData() {
    return JSON.parse(localStorage.getItem('healthData')) || {};
}

export function getSettings() {
    return JSON.parse(localStorage.getItem('healthSettings')) || {
        reminderTime: '20:00',
        reminderActive: true
    };
}

export function getWeightConditions() {
    return JSON.parse(localStorage.getItem('weightConditions')) || [
        'Утром натощак',
        'Вечером перед сном',
        'После тренировки',
        'До еды',
        'После еды'
    ];
}

export function getExercisesList() {
    return JSON.parse(localStorage.getItem('exercisesList')) || [];
}

export function getWorkoutHistory() {
    return JSON.parse(localStorage.getItem('workoutHistory')) || {};
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
