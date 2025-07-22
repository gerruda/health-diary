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

// Формула расчета 1ПМ
function calculateOneRepMax(weight, reps) {
    return weight * (1 + reps / 30);
}
