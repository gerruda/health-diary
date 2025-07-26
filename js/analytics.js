import { getHealthData, getWorkoutHistory, getExerciseMetrics, saveExerciseMetrics } from './storage.js';

export function initAnalytics() {
    initWeightChart();
    initSleepChart();
    initEnergyChart();
    populateExerciseFilter();
    updateMetricHints();
    initExerciseChart();

    const metrics = getExerciseMetrics();
    const metricRadio = document.querySelector(`input[name="exercise-metric"][value="${metrics.selectedMetric}"]`);
    if (metricRadio) {
        metricRadio.checked = true;
    }

    // Обработчики для переключателей метрик
    document.querySelectorAll('input[name="exercise-metric"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const metric = radio.value;
            saveExerciseMetrics({ selectedMetric: metric });
            if (exerciseChart) {
                exerciseChart.destroy();
            }
            initExerciseChart();
            updateMetricHints();
        });
    });
}

// Новая функция для обновления подсказок
function updateMetricHints() {
    const selectedMetric = document.querySelector('input[name="exercise-metric"]:checked')?.value || 'orm';
    const hints = document.querySelectorAll('.metric-hints > div');

    hints.forEach(hint => {
        hint.style.display = 'none';
    });

    const activeHint = document.querySelector(`.metric-hints > div[data-metric="${selectedMetric}"]`);
    if (activeHint) {
        activeHint.style.display = 'block';
    }
}

// Обновленная функция prepareExerciseData
function prepareExerciseData(exerciseName) {
    const workoutHistory = getWorkoutHistory();
    const metricType = getExerciseMetrics().selectedMetric || 'orm';
    const result = [];

    for (const date in workoutHistory) {
        workoutHistory[date].forEach(exercise => {
            // Проверяем совпадение названия упражнения
            const isNameMatch = exercise.name &&
                exercise.name.trim().toLowerCase() === exerciseName.trim().toLowerCase();

            if (isNameMatch && exercise.sets && exercise.sets.length > 0) {
                let metricValue = 0;
                let hasValidSet = false;

                exercise.sets.forEach(set => {
                    const reps = parseInt(set.reps);

                    if (!isNaN(reps) && reps > 0) {
                        hasValidSet = true;
                        const weight = parseFloat(set.weight) || 0;
                        const effectiveWeight = set.perLimb ? weight * 2 : weight;

                        switch (metricType) {
                            case 'volume': // Общий объем
                                metricValue += effectiveWeight * reps;
                                break;
                            case 'reps': // Суммарные повторения
                                metricValue += reps;
                                break;
                            case 'max-reps': // Максимальные повторения
                                if (reps > metricValue) metricValue = reps;
                                break;
                            case 'orm': // 1ПМ
                                if (effectiveWeight > 0) {
                                    const oneRepMax = calculateOneRepMax(effectiveWeight, reps);
                                    if (oneRepMax > metricValue) metricValue = oneRepMax;
                                } else {
                                    // Для упражнений без веса используем количество повторений
                                    if (reps > metricValue) metricValue = reps;
                                }
                                break;
                        }
                    }
                });

                if (hasValidSet) {
                    result.push({
                        date: date,
                        value: metricValue,
                        note: ''
                    });
                }
            }
        });
    }

    // Сортируем по дате
    result.sort((a, b) => a.date.localeCompare(b.date));

    return {
        dates: result.map(item => item.date),
        values: result.map(item => item.value),
        notes: result.map(item => item.note)
    };
}

// Обновленная функция initExerciseChart
function initExerciseChart() {
    const ctx = document.getElementById('exercise-chart');
    if (!ctx) return;

    const filter = document.getElementById('exercise-filter');
    if (!filter) return;

    const exerciseName = filter.value;
    const metricType = getExerciseMetrics().selectedMetric || 'orm';

    // Очищаем предыдущий график
    if (exerciseChart) {
        exerciseChart.destroy();
        exerciseChart = null;
    }

    // Если упражнение не выбрано, выходим
    if (!exerciseName) {
        ctx.style.display = 'none';
        return;
    }

    // Получаем данные для графика
    const data = prepareExerciseData(exerciseName);

    // Проверяем наличие данных
    if (data.dates.length < 1) {
        ctx.style.display = 'none';
        return;
    }

    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const bgColor = theme === 'dark' ? 'rgba(255, 99, 132, 0.2)' : 'rgba(255, 99, 132, 0.1)';

    // Форматируем даты для меток
    const formatDate = (dateStr) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}`;
        }
        return dateStr;
    };

    // Показываем canvas
    ctx.style.display = 'block';

    // Создаем график
    exerciseChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: data.dates.map(formatDate),
            datasets: [{
                label: getMetricLabel(metricType, exerciseName),
                data: data.values,
                borderColor: '#ff6384',
                backgroundColor: bgColor,
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Дата'
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: getMetricYLabel(metricType)
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            return data.dates[items[0].dataIndex];
                        },
                        label: (context) => {
                            return `${getMetricLabel(metricType, '')}: ${context.raw}`;
                        },
                        footer: (tooltipItems) => {
                            const index = tooltipItems[0].dataIndex;
                            return data.notes[index] || '';
                        }
                    }
                }
            }
        }
    });
}

// Вспомогательные функции для метрик
function getMetricLabel(metricType, exerciseName) {
    const labels = {
        'orm': `1ПМ ${exerciseName}`,
        'volume': `Общий объём ${exerciseName}`,
        'reps': `Повторения ${exerciseName}`,
        'max-reps': `Макс. повторения ${exerciseName}`
    };
    return labels[metricType] || exerciseName;
}

function getMetricYLabel(metricType) {
    const labels = {
        'orm': '1ПМ (кг)',
        'volume': 'Объём (кг×повт)',
        'reps': 'Количество повторений',
        'max-reps': 'Макс. повторения'
    };
    return labels[metricType] || 'Значение';
}

function initWeightChart() {
    const ctx = document.getElementById('weight-chart');
    if (!ctx) return;

    const data = prepareWeightData();

    // Проверяем достаточно ли точек для построения графика
    if (data.weights.length < 2) {
        return;
    }

    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Форматируем даты в понятные метки
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
        return dateStr;
    };
    // Создаем метки для оси X
    const labels = [...new Set([
        ...data.weights.map(item => item.x),
        ...data.workouts.map(item => item.x),
        ...data.alcohol.map(item => item.x)
    ])].sort().map(formatDate);

    // Создаем наборы данных
    const weightValues = labels.map(label => {
        const date = label.split('.').reverse().join('-');
        const entry = data.weights.find(item => item.x === date);
        return entry ? entry.y : null;
    });

    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Вес (кг)',
                    data: weightValues,
                    borderColor: '#3498db',
                    backgroundColor: theme === 'dark' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: (ctx) => {
                        const index = ctx.dataIndex;
                        const date = labels[index].split('.').reverse().join('-');
                        const hasWorkout = data.workouts.some(item => item.x === date);
                        const hasAlcohol = data.alcohol.some(item => item.x === date);

                        if (hasWorkout && hasAlcohol) return '#f1c40f';
                        if (hasWorkout) return '#2ecc71';
                        if (hasAlcohol) return '#e74c3c';
                        return '#3498db';
                    }
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        beforeBody: (tooltipItems) => {
                            const index = tooltipItems[0].dataIndex;
                            const date = labels[index].split('.').reverse().join('-');
                            const hasWorkout = data.workouts.some(item => item.x === date);
                            const hasAlcohol = data.alcohol.some(item => item.x === date);

                            const events = [];
                            if (hasWorkout) events.push('Тренировка');
                            if (hasAlcohol) events.push('Алкоголь');

                            return events.length > 0
                                ? [`События: ${events.join(', ')}`]
                                : [];
                        }
                    }
                }
            }
        }
    });
}

function prepareWeightData() {
    const healthData = getHealthData();
    const weights = [];
    const workouts = [];
    const alcohol = [];
    let minWeight = Infinity;

    // Находим минимальный вес
    for (const date in healthData) {
        healthData[date].forEach(entry => {
            if (entry.weighings) {
                entry.weighings.forEach(weighing => {
                    const weightVal = parseFloat(weighing.weight);
                    if (!isNaN(weightVal)) {
                        minWeight = Math.min(minWeight, weightVal);
                    }
                });
            }
        });
    }

    if (minWeight === Infinity) minWeight = 50;

    // Собираем данные
    for (const date in healthData) {
        let hasWorkout = false;
        let hasAlcohol = false;
        let weightEntry = null;
        let weightSum = 0;
        let weightCount = 0;

        healthData[date].forEach(entry => {
            if (entry.weighings) {
                entry.weighings.forEach(weighing => {
                    const weightVal = parseFloat(weighing.weight);
                    if (!isNaN(weightVal)) {
                        weightSum += weightVal;
                        weightCount++;
                    }
                });
            }

            if (entry.workout && entry.workout !== 'none') {
                hasWorkout = true;
            }

            if (entry.alcohol && entry.alcohol.trim() !== '' && entry.alcohol !== 'no') {
                hasAlcohol = true;
            }
        });

        if (weightCount > 0) {
            const avgWeight = weightSum / weightCount;
            weightEntry = {
                x: date,
                y: parseFloat(avgWeight.toFixed(1))
            };
            weights.push(weightEntry);
        }

        if (hasWorkout) {
            workouts.push({
                x: date,
                y: minWeight - 1
            });
        }
        if (hasAlcohol) {
            alcohol.push({
                x: date,
                y: minWeight - 2
            });
        }
    }

    // Сортируем по дате
    weights.sort((a, b) => a.x.localeCompare(b.x));
    workouts.sort((a, b) => a.x.localeCompare(b.x));
    alcohol.sort((a, b) => a.x.localeCompare(b.x));

    return {weights, workouts, alcohol};
}

function initSleepChart() {
    const ctx = document.getElementById('sleep-chart');
    if (!ctx) return;

    const data = prepareSleepData();

    // Проверяем достаточно ли точек для построения графика
    if (data.dates.length < 2) {
        return;
    }

    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const bgColor = theme === 'dark' ? 'rgba(75, 192, 192, 0.2)' : 'rgba(75, 192, 192, 0.1)';

    // Форматируем даты
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}`;
        }
        return dateStr;
    };

    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: data.dates.map(formatDate),
            datasets: [{
                label: 'Часы сна',
                data: data.hours,
                backgroundColor: bgColor,
                borderColor: '#3498db',
                borderWidth: 1,
                borderRadius: 5,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 12,
                    title: {
                        display: true,
                        text: 'Часы'
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        footer: (tooltipItems) => {
                            const index = tooltipItems[0].dataIndex;
                            return data.notes[index] || '';
                        }
                    }
                }
            }
        }
    });
}

function prepareSleepData() {
    const healthData = getHealthData();
    const result = [];

    for (const date in healthData) {
        let totalSleepHours = 0;
        let sleepNote = '';
        let sleepCount = 0;

        healthData[date].forEach(entry => {
            if (entry.sleepDuration) {
                const [hours, minutes] = entry.sleepDuration.split(':').map(Number);
                if (!isNaN(hours)) {
                    totalSleepHours += hours + (minutes || 0) / 60;
                    sleepCount++;
                }
            }
            if (entry.notes) {
                sleepNote = entry.notes;
            }
        });

        if (sleepCount > 0) {
            const avgSleepHours = totalSleepHours / sleepCount;
            result.push({
                date: date,
                hours: parseFloat(avgSleepHours.toFixed(1)),
                note: sleepNote
            });
        }
    }

    // Сортируем по дате
    result.sort((a, b) => a.date.localeCompare(b.date));

    return {
        dates: result.map(item => item.date),
        hours: result.map(item => item.hours),
        notes: result.map(item => item.note)
    };
}

function initEnergyChart() {
    const ctx = document.getElementById('energy-chart');
    if (!ctx) return;

    const data = prepareEnergyData();

    // Проверяем достаточно ли точек для построения графика
    if (data.dates.length < 2) {
        return;
    }

    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const bgColor = theme === 'dark' ? 'rgba(153, 102, 255, 0.2)' : 'rgba(153, 102, 255, 0.1)';

    // Форматируем даты
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}`;
        }
        return dateStr;
    };

    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: data.dates.map(formatDate),
            datasets: [{
                label: 'Уровень энергии',
                data: data.levels,
                backgroundColor: bgColor,
                borderColor: '#2ecc71',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    min: 1,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            const energyLevels = {
                                1: 'Очень низкий',
                                2: 'Низкий',
                                3: 'Средний',
                                4: 'Высокий',
                                5: 'Очень высокий'
                            };
                            return energyLevels[value] || value;
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const energyLevels = {
                                1: 'Очень низкий',
                                2: 'Низкий',
                                3: 'Средний',
                                4: 'Высокий',
                                5: 'Очень высокий'
                            };
                            return `Энергия: ${context.raw} (${energyLevels[context.raw] || context.raw})`;
                        },
                        footer: (tooltipItems) => {
                            const index = tooltipItems[0].dataIndex;
                            return data.notes[index] || '';
                        }
                    }
                }
            }
        }
    });
}

function prepareEnergyData() {
    const healthData = getHealthData();
    const result = [];

    for (const date in healthData) {
        let energySum = 0;
        let energyCount = 0;
        let energyNote = '';

        healthData[date].forEach(entry => {
            if (entry.energyLevel) {
                const level = parseInt(entry.energyLevel);
                if (!isNaN(level)) {
                    energySum += level;
                    energyCount++;
                }
            }
            if (entry.notes) {
                energyNote = entry.notes;
            }
        });

        if (energyCount > 0) {
            const avgEnergy = energySum / energyCount;
            result.push({
                date: date,
                level: parseFloat(avgEnergy.toFixed(1)),
                note: energyNote
            });
        }
    }

    // Сортируем по дате
    result.sort((a, b) => a.date.localeCompare(b.date));

    return {
        dates: result.map(item => item.date),
        levels: result.map(item => item.level),
        notes: result.map(item => item.note)
    };
}

let exerciseChart = null;

// Функция расчета одноповторного максимума
function calculateOneRepMax(weight, reps) {
    if (weight <= 0 || reps <= 0) return 0;

    // Используем формулу Brzycki для более точных расчетов
    if (reps === 1) return weight;

    // 1ПМ = вес / (1.0278 - 0.0278 * повторения)
    const oneRepMax = weight / (1.0278 - (0.0278 * reps));
    return Math.round(oneRepMax * 10) / 10; // Округляем до 0.1
}

// Обновленная функция populateExerciseFilter
function populateExerciseFilter() {
    const filter = document.getElementById('exercise-filter');
    if (!filter) {
        return;
    }

    // Очищаем существующие опции
    filter.innerHTML = '<option value="">Выберите упражнение</option>';

    const workoutHistory = getWorkoutHistory();
    const exercises = new Set();

    // Собираем уникальные упражнения
    for (const date in workoutHistory) {
        workoutHistory[date].forEach(exercise => {
            if (exercise.name && exercise.name.trim() !== '') {
                exercises.add(exercise.name);
            }
        });
    }

    // Сортируем и добавляем в список
    const sortedExercises = Array.from(exercises).sort();
    sortedExercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        filter.appendChild(option);
    });

    // Обработчик изменения
    filter.addEventListener('change', () => {
        if (exerciseChart) exerciseChart.destroy();
        initExerciseChart();
    });
}
