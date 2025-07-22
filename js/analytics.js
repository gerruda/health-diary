import { getHealthData } from './storage.js'; // Добавить эту строку

export function initAnalytics() {
    // Проверяем существование элементов перед работой с ними
    const sleepChartEl = document.getElementById('sleep-chart');
    const energyChartEl = document.getElementById('energy-chart');
    const weightChartEl = document.getElementById('weight-chart');

    if (!sleepChartEl || !energyChartEl || !weightChartEl) {
        console.warn('Один или несколько элементов графиков не найдены');
        return;
    }

    // Инициализация графиков
    initWeightChart();
    // initStepsChart();
    // initCaloriesChart();
    // initMaxWeightChart();
}

function initWeightChart() {
    const ctx = document.getElementById('weight-chart').getContext('2d');
    const data = prepareWeightData(); // Сбор данных с отметками

    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Вес',
                data: data.weights,
                // ... настройки ...
            }, {
                label: 'Тренировки',
                data: data.workouts,
                pointStyle: 'triangle',
                // ... настройки ...
            }, {
                label: 'Алкоголь',
                data: data.alcohol,
                pointStyle: 'rect',
                // ... настройки ...
            }]
        },
        options: {
            // ... настройки ...
        }
    });
}

// Функция для подготовки данных веса для графиков аналитики
function prepareWeightData() {
    const healthData = getHealthData();
    const weights = [];
    const workouts = [];
    const alcohol = [];
    let minWeight = Infinity;

    // Сначала находим минимальный вес для правильного позиционирования маркеров
    for (const date in healthData) {
        healthData[date].forEach(entry => {
            if (entry.weight) {
                const weightVal = parseFloat(entry.weight);
                if (weightVal < minWeight) minWeight = weightVal;
            }
        });
    }

    // Если не найдено ни одного веса, устанавливаем дефолтное значение
    if (minWeight === Infinity) minWeight = 50;

    // Собираем данные для графиков
    for (const date in healthData) {
        let hasWorkout = false;
        let hasAlcohol = false;
        let weightEntry = null;

        healthData[date].forEach(entry => {
            // Запись веса
            if (entry.weight) {
                weightEntry = {
                    x: date,
                    y: parseFloat(entry.weight)
                };
            }

            // Проверка тренировки
            if (entry.workout && entry.workout !== 'none') {
                hasWorkout = true;
            }

            // Проверка алкоголя
            if (entry.alcohol && entry.alcohol.trim() !== '') {
                hasAlcohol = true;
            }
        });

        // Добавляем вес, если есть запись
        if (weightEntry) {
            weights.push(weightEntry);
        }

        // Добавляем маркеры событий
        if (hasWorkout) {
            workouts.push({
                x: date,
                y: minWeight - 1 // Располагаем ниже минимального веса
            });
        }

        if (hasAlcohol) {
            alcohol.push({
                x: date,
                y: minWeight - 2 // Располагаем еще ниже
            });
        }
    }

    // Сортируем по дате
    weights.sort((a, b) => new Date(a.x) - new Date(b.x));
    workouts.sort((a, b) => new Date(a.x) - new Date(b.x));
    alcohol.sort((a, b) => new Date(a.x) - new Date(b.x));

    return {
        weights,
        workouts,
        alcohol
    };
}
