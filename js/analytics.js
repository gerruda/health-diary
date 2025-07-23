import { getHealthData } from './storage.js';

export function initAnalytics() {
    initWeightChart();
    initSleepChart();
    initEnergyChart();
    populateExerciseFilter();
    initExerciseChart();
}

function initWeightChart() {
    const ctx = document.getElementById('weight-chart');
    if (!ctx) return;

    const data = prepareWeightData();
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

    const workoutValues = labels.map(label => {
        const date = label.split('.').reverse().join('-');
        const entry = data.workouts.find(item => item.x === date);
        return entry ? entry.y : null;
    });

    const alcoholValues = labels.map(label => {
        const date = label.split('.').reverse().join('-');
        const entry = data.alcohol.find(item => item.x === date);
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
                    fill: true
                },
                {
                    label: 'Тренировки',
                    data: workoutValues,
                    pointStyle: 'triangle',
                    pointRadius: 8,
                    pointBackgroundColor: '#2ecc71',
                    showLine: false
                },
                {
                    label: 'Алкоголь',
                    data: alcoholValues,
                    pointStyle: 'rect',
                    pointRadius: 8,
                    pointBackgroundColor: '#e74c3c',
                    showLine: false
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
            if (entry.weight) {
                const weightVal = parseFloat(entry.weight);
                if (weightVal < minWeight) minWeight = weightVal;
            }
        });
    }

    if (minWeight === Infinity) minWeight = 50;

    // Собираем данные
    for (const date in healthData) {
        let hasWorkout = false;
        let hasAlcohol = false;
        let weightEntry = null;

        healthData[date].forEach(entry => {
            if (entry.weight) {
                weightEntry = {
                    x: date,
                    y: parseFloat(entry.weight)
                };
            }
            if (entry.workout && entry.workout !== 'none') {
                hasWorkout = true;
            }
            if (entry.alcohol && entry.alcohol.trim() !== '') {
                hasAlcohol = true;
            }
        });

        if (weightEntry) {
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

    return { weights, workouts, alcohol };
}

function initSleepChart() {
    const ctx = document.getElementById('sleep-chart');
    if (!ctx) return;

    const data = prepareSleepData();
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
        let sleepHours = 0;
        let sleepNote = '';

        healthData[date].forEach(entry => {
            if (entry.sleep) {
                sleepHours = parseFloat(entry.sleep) || 0;
            }
            if (entry.sleepNotes) {
                sleepNote = entry.sleepNotes;
            }
        });

        if (sleepHours > 0) {
            result.push({
                date: date,
                hours: sleepHours,
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
                        callback: function(value) {
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
        let energyLevel = 0;
        let energyNote = '';

        healthData[date].forEach(entry => {
            if (entry.energy) {
                energyLevel = parseInt(entry.energy) || 0;
            }
            if (entry.energyNotes) {
                energyNote = entry.energyNotes;
            }
        });

        if (energyLevel > 0) {
            result.push({
                date: date,
                level: energyLevel,
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

function initExerciseChart() {
    const ctx = document.getElementById('exercise-chart');
    if (!ctx) return;

    const filter = document.getElementById('exercise-filter');
    if (!filter) return;

    const exerciseName = filter.value;

    // Очищаем предыдущий график
    if (window.exerciseChart) {
        window.exerciseChart.destroy();
    }

    // Если упражнение не выбрано, выходим
    if (!exerciseName) {
        ctx.style.display = 'none';
        return;
    }

    // Получаем данные для графика
    const data = prepareExerciseData(exerciseName);
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
    window.exerciseChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: data.dates.map(formatDate),
            datasets: [{
                label: `1ПМ ${exerciseName}`,
                data: data.oneRepMax,
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
                        text: '1ПМ (кг)'
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
                            return `1ПМ: ${context.raw} кг`;
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

function prepareExerciseData(exerciseName) {
    const healthData = getHealthData();
    const result = [];

    // Проходим по всем дням
    for (const date in healthData) {
        healthData[date].forEach(entry => {
            // Проверяем тип записи и наличие упражнений
            if (entry.type === 'workout' && entry.exercises) {
                entry.exercises.forEach(exercise => {
                    // Ищем нужное упражнение
                    if (exercise.name === exerciseName && exercise.sets) {
                        let maxOneRepMax = 0;
                        let note = '';

                        // Проходим по всем подходам
                        exercise.sets.forEach(set => {
                            // Проверяем наличие данных для расчета 1ПМ
                            if (set.weight && set.reps) {
                                // Рассчитываем 1ПМ
                                const oneRepMax = calculateOneRepMax(set.weight, set.reps);
                                if (oneRepMax > maxOneRepMax) {
                                    maxOneRepMax = oneRepMax;
                                    note = set.notes || '';
                                }
                            }
                        });

                        // Добавляем запись, если найден 1ПМ
                        if (maxOneRepMax > 0) {
                            result.push({
                                date: date,
                                oneRepMax: maxOneRepMax,
                                note: note
                            });
                        }
                    }
                });
            }
        });
    }

    // Сортируем по дате
    result.sort((a, b) => a.date.localeCompare(b.date));

    return {
        dates: result.map(item => item.date),
        oneRepMax: result.map(item => item.oneRepMax),
        notes: result.map(item => item.note)
    };
}

// Функция расчета одноповторного максимума
function calculateOneRepMax(weight, reps) {
    // Используем формулу Эпли: 1ПМ = вес × (1 + 0.0333 × повторения)
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function populateExerciseFilter() {
    const filter = document.getElementById('exercise-filter');
    if (!filter) return;

    // Очищаем существующие опции
    filter.innerHTML = '<option value="">Выберите упражнение</option>';

    // Получаем список всех уникальных упражнений
    const exercises = new Set();
    const healthData = getHealthData();

    for (const date in healthData) {
        healthData[date].forEach(entry => {
            if (entry.type === 'workout' && entry.exercises) {
                entry.exercises.forEach(exercise => {
                    if (exercise.name) {
                        exercises.add(exercise.name);
                    }
                });
            }
        });
    }

    // Добавляем упражнения в выпадающий список
    exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        filter.appendChild(option);
    });

    // Добавляем обработчик изменения выбора
    filter.addEventListener('change', initExerciseChart);
}
