import { getExerciseMetrics, saveExerciseMetrics } from './storage.js';

let dataManagerInstance;
let exerciseChart = null;
let weightChartInstance = null;
let sleepChartInstance = null;
let energyChartInstance = null;

export function initAnalytics(dataManager) {
    dataManagerInstance = dataManager;
    initWeightChart();
    initSleepChart();
    initEnergyChart();
    populateExerciseFilter();
    updateMetricHints();
    initExerciseChart();

    // Установка выбранной метрики
    const metrics = getExerciseMetrics();
    const metricRadio = document.querySelector(`input[name="exercise-metric"][value="${metrics.selectedMetric}"]`);
    if (metricRadio) metricRadio.checked = true;

    // Обработчики для переключателей метрик
    document.querySelectorAll('input[name="exercise-metric"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const metric = radio.value;
            saveExerciseMetrics({ selectedMetric: metric });
            if (exerciseChart) exerciseChart.destroy();
            initExerciseChart();
            updateMetricHints();
        });
    });

    // Подписка на события
    dataManagerInstance.on('entry-updated', refreshAnalytics);
    dataManagerInstance.on('entry-deleted', refreshAnalytics);
    dataManagerInstance.on('entry-added', refreshAnalytics);
    document.getElementById('analytics').addEventListener('click', refreshAnalytics);
}

export function refreshAnalytics() {
    const selectedPeriod = document.querySelector('input[name="weight-period"]:checked')?.value || 'all';

    initWeightChart();
    initSleepChart();
    initEnergyChart();

    if (exerciseChart) exerciseChart.destroy();
    initExerciseChart();

    populateExerciseFilter();

    const radioToCheck = document.querySelector(`input[name="weight-period"][value="${selectedPeriod}"]`);
    if (radioToCheck) radioToCheck.checked = true;
}

function updateMetricHints() {
    const selectedMetric = document.querySelector('input[name="exercise-metric"]:checked')?.value || 'orm';
    const hints = document.querySelectorAll('.metric-hints > div');
    hints.forEach(hint => hint.style.display = 'none');

    const activeHint = document.querySelector(`.metric-hints > div[data-metric="${selectedMetric}"]`);
    if (activeHint) activeHint.style.display = 'block';
}

function prepareExerciseData(exerciseName) {
    const metricType = getExerciseMetrics().selectedMetric || 'orm';
    const result = [];

    const trainingEntries = dataManagerInstance.getAllEntries()
        .filter(entry => entry.type === 'training' && !entry.isDraft);

    const groupedByDate = {};
    trainingEntries.forEach(entry => {
        if (!groupedByDate[entry.date]) groupedByDate[entry.date] = [];
        groupedByDate[entry.date].push(entry.data);
    });

    for (const date in groupedByDate) {
        groupedByDate[date].forEach(exercise => {
            const isNameMatch = exercise.name?.trim().toLowerCase() === exerciseName.trim().toLowerCase();

            if (isNameMatch && exercise.sets?.length > 0) {
                let metricValue = 0;
                let hasValidSet = false;

                exercise.sets.forEach(set => {
                    const reps = parseInt(set.reps);
                    if (!isNaN(reps) && reps > 0) {
                        hasValidSet = true;
                        const weight = parseFloat(set.weight) || 0;
                        const effectiveWeight = set.perLimb ? weight * 2 : weight;

                        switch (metricType) {
                            case 'volume': metricValue += effectiveWeight * reps; break;
                            case 'reps': metricValue += reps; break;
                            case 'max-reps': if (reps > metricValue) metricValue = reps; break;
                            case 'orm':
                                if (effectiveWeight > 0) {
                                    const oneRepMax = calculateOneRepMax(effectiveWeight, reps);
                                    if (oneRepMax > metricValue) metricValue = oneRepMax;
                                } else if (reps > metricValue) metricValue = reps;
                                break;
                        }
                    }
                });

                if (hasValidSet) {
                    result.push({ date, value: metricValue, note: '' });
                }
            }
        });
    }

    result.sort((a, b) => a.date.localeCompare(b.date));
    return {
        dates: result.map(item => item.date),
        values: result.map(item => item.value),
        notes: result.map(item => item.note)
    };
}

function initExerciseChart() {
    const ctx = document.getElementById('exercise-chart');
    if (!ctx) return;

    // Удаляем предыдущее сообщение об ошибке
    const prevError = ctx.nextElementSibling;
    if (prevError?.classList.contains('chart-error')) prevError.remove();

    const filter = document.getElementById('exercise-filter');
    if (!filter) return;

    const exerciseName = filter.value;
    const metricType = getExerciseMetrics().selectedMetric || 'orm';

    if (exerciseChart) exerciseChart.destroy();

    if (!exerciseName) {
        ctx.style.display = 'none';
        const errorMsg = document.createElement('p');
        errorMsg.className = 'chart-error';
        errorMsg.textContent = 'Выберите упражнение из списка для построения графика';
        ctx.parentNode.insertBefore(errorMsg, ctx.nextSibling);
        return;
    }

    const data = prepareExerciseData(exerciseName);
    if (data.dates.length < 1) {
        ctx.style.display = 'none';
        const errorMsg = document.createElement('p');
        errorMsg.className = 'chart-error';
        errorMsg.textContent = 'Недостаточно данных для выбранного упражнения';
        ctx.parentNode.insertBefore(errorMsg, ctx.nextSibling);
        return;
    }

    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const bgColor = theme === 'dark' ? 'rgba(255, 99, 132, 0.2)' : 'rgba(255, 99, 132, 0.1)';

    const formatDate = dateStr => {
        const parts = dateStr.split('-');
        return parts.length === 3 ? `${parts[2]}.${parts[1]}` : dateStr;
    };

    ctx.style.display = 'block';
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
                    title: { display: true, text: 'Дата' },
                    grid: { color: gridColor }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: getMetricYLabel(metricType) },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 14 } }
                },
                tooltip: {
                    callbacks: {
                        title: items => data.dates[items[0].dataIndex],
                        label: context => `${getMetricLabel(metricType, '')}: ${context.raw}`,
                        footer: tooltipItems => data.notes[tooltipItems[0].dataIndex] || ''
                    }
                }
            }
        }
    });
}

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

    // Удаляем предыдущие сообщения
    const prevError = ctx.nextElementSibling;
    if (prevError?.classList.contains('chart-error')) prevError.remove();

    if (weightChartInstance) weightChartInstance.destroy();

    const period = document.querySelector('input[name="weight-period"]:checked')?.value || 'all';
    const data = prepareWeightData(period);

    if (data.weights.length < 2) {
        const errorMsg = document.createElement('p');
        errorMsg.className = 'chart-error';
        errorMsg.textContent = data.weights.length === 0
            ? 'Нет данных о весе. Добавьте взвешивания в дневнике.'
            : 'Недостаточно данных о весе. Требуется минимум 2 записи.';
        ctx.parentNode.insertBefore(errorMsg, ctx.nextSibling);
        return;
    }

    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const formatDate = dateStr => {
        const parts = dateStr?.split('-');
        return parts?.length === 3 ? `${parts[2]}.${parts[1]}` : dateStr || '';
    };

    const allDates = [...new Set([
        ...data.weights.map(item => item.x),
        ...data.workouts.map(item => item.x),
        ...data.alcohol.map(item => item.x)
    ])].sort();

    const labels = allDates.map(formatDate);
    const weightValues = allDates.map(date => {
        const entry = data.weights.find(item => item.x === date);
        return entry ? entry.y : null;
    });

    const weightValuesFiltered = weightValues.filter(v => v !== null);
    const minY = Math.min(...weightValuesFiltered) - 2;
    const maxY = Math.max(...weightValuesFiltered) + 2;

    weightChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Вес (кг)',
                data: weightValues,
                borderColor: '#3498db',
                backgroundColor: theme === 'dark'
                    ? 'rgba(52, 152, 219, 0.2)'
                    : 'rgba(52, 152, 219, 0.1)',
                tension: period === 'all' ? 0.1 : 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: (ctx) => {
                    const index = ctx.dataIndex;
                    const date = allDates[index];
                    const hasWorkout = data.workouts.some(item => item.x === date);
                    const hasAlcohol = data.alcohol.some(item => item.x === date);

                    if (hasWorkout && hasAlcohol) return '#f1c40f';
                    if (hasWorkout) return '#2ecc71';
                    if (hasAlcohol) return '#e74c3c';
                    return '#3498db';
                },
                trendlineLinear: {
                    style: "dashed",
                    width: 2,
                    color: theme === 'dark' ? '#e74c3c' : '#e74c3c',
                }
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { grid: { color: gridColor } },
                y: {
                    suggestedMin: minY,
                    suggestedMax: maxY,
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { labels: { font: { size: 14 } } },
                tooltip: {
                    callbacks: {
                        title: tooltipItems => allDates[tooltipItems[0].dataIndex],
                        beforeBody: tooltipItems => {
                            const index = tooltipItems[0].dataIndex;
                            const date = allDates[index];
                            const hasWorkout = data.workouts.some(item => item.x === date);
                            const hasAlcohol = data.alcohol.some(item => item.x === date);

                            const events = [];
                            if (hasWorkout) events.push('Тренировка');
                            if (hasAlcohol) events.push('Алкоголь');

                            return events.length > 0 ? [`События: ${events.join(', ')}`] : [];
                        },
                        afterLabel: context => {
                            const index = context.dataIndex;
                            if (index === 0) return null;

                            const current = weightValues[index];
                            const previous = weightValues[index - 1];

                            if (current === null || previous === null) return null;

                            const change = current - previous;
                            return `Δ: ${change >= 0 ? '+' : ''}${change.toFixed(1)} кг`;
                        }
                    }
                }
            }
        }
    });

    document.querySelectorAll('input[name="weight-period"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (weightChartInstance) weightChartInstance.destroy();
            initWeightChart();
        });
    });
}

function prepareWeightData(period = 'all') {
    const weights = [];
    const workouts = [];
    const alcohol = [];

    const diaryEntries = dataManagerInstance.getAllEntries()
        .filter(entry => entry.type === 'diary' && !entry.isDraft);

    const dateMap = {};

    diaryEntries.forEach(entry => {
        const date = entry.date;
        if (!dateMap[date]) {
            dateMap[date] = {
                weights: [],
                hasWorkout: false,
                hasAlcohol: false
            };
        }

        const dateData = dateMap[date];

        // Обработка взвешиваний
        if (entry.data.weighings?.length > 0) {
            entry.data.weighings.forEach(weighing => {
                const weightVal = parseFloat(weighing.weight);
                if (!isNaN(weightVal)) {
                    dateData.weights.push(weightVal);
                }
            });
        }
        // Для совместимости со старым форматом
        else if (entry.data.weight) {
            const weightVal = parseFloat(entry.data.weight);
            if (!isNaN(weightVal)) {
                dateData.weights.push(weightVal);
            }
        }

        // Отметки о событиях
        if (entry.data.workout && entry.data.workout !== 'none') {
            dateData.hasWorkout = true;
        }
        if (entry.data.alcohol && entry.data.alcohol.trim() !== '' && entry.data.alcohol !== 'no') {
            dateData.hasAlcohol = true;
        }
    });

    // Находим минимальный вес из существующих данных
    let minWeight = Infinity;
    Object.values(dateMap).forEach(data => {
        if (data.weights.length > 0) {
            const minInDay = Math.min(...data.weights);
            if (minInDay < minWeight) minWeight = minInDay;
        }
    });

    // Формируем итоговые данные
    Object.entries(dateMap).forEach(([date, data]) => {
        // Добавляем вес только если есть данные
        if (data.weights.length > 0) {
            const avgWeight = data.weights.reduce((sum, w) => sum + w, 0) / data.weights.length;
            weights.push({ x: date, y: parseFloat(avgWeight.toFixed(1)) });
        }

        // Добавляем события только если есть точка веса
        if (data.weights.length > 0) {
            if (data.hasWorkout) workouts.push({ x: date, y: minWeight - 1 });
            if (data.hasAlcohol) alcohol.push({ x: date, y: minWeight - 2 });
        }
    });

    // Сортировка
    weights.sort((a, b) => a.x.localeCompare(b.x));
    workouts.sort((a, b) => a.x.localeCompare(b.x));
    alcohol.sort((a, b) => a.x.localeCompare(b.x));

    // Фильтрация по периоду
    if (period !== 'all') {
        const now = new Date();
        let cutoffDate;

        if (period === '3months') cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        else if (period === '1month') cutoffDate = new Date(now.setMonth(now.getMonth() - 1));

        const filterByDate = arr => arr.filter(item => new Date(item.x) >= cutoffDate);

        return {
            weights: filterByDate(weights),
            workouts: filterByDate(workouts),
            alcohol: filterByDate(alcohol)
        };
    }

    return { weights, workouts, alcohol };
}

// Остальные функции (initSleepChart, prepareSleepData, и т.д.) остаются без изменений

// function populateExerciseFilter() {
//     // ... существующий код без изменений ...
// }
//
// export function refreshAnalytics() {
//     // Обновляем все графики
//     initWeightChart();
//     initSleepChart();
//     initEnergyChart();
//
//     // Обновляем график упражнений
//     if (exerciseChart) {
//         exerciseChart.destroy();
//         exerciseChart = null;
//     }
//     initExerciseChart();
//
//     // Обновляем фильтр упражнений
//     populateExerciseFilter();
// }
//
// function updateMetricHints() {
//     const selectedMetric = document.querySelector('input[name="exercise-metric"]:checked')?.value || 'orm';
//     const hints = document.querySelectorAll('.metric-hints > div');
//
//     hints.forEach(hint => {
//         hint.style.display = 'none';
//     });
//
//     const activeHint = document.querySelector(`.metric-hints > div[data-metric="${selectedMetric}"]`);
//     if (activeHint) {
//         activeHint.style.display = 'block';
//     }
// }
//
// function prepareExerciseData(exerciseName) {
//     const metricType = getExerciseMetrics().selectedMetric || 'orm';
//     const result = [];
//
//     // Получаем все тренировки
//     const trainingEntries = dataManagerInstance.getAllEntries()
//         .filter(entry =>
//             entry.type === 'training' &&
//             !entry.isDraft
//         );
//
//     // Группируем по дате
//     const groupedByDate = {};
//     trainingEntries.forEach(entry => {
//         if (!groupedByDate[entry.date]) {
//             groupedByDate[entry.date] = [];
//         }
//         groupedByDate[entry.date].push(entry.data);
//     });
//
//     // Обрабатываем каждую дату
//     for (const date in groupedByDate) {
//         groupedByDate[date].forEach(exercise => {
//             // Проверяем совпадение названия упражнения
//             const isNameMatch = exercise.name &&
//                 exercise.name.trim().toLowerCase() === exerciseName.trim().toLowerCase();
//
//             if (isNameMatch && exercise.sets && exercise.sets.length > 0) {
//                 let metricValue = 0;
//                 let hasValidSet = false;
//
//                 exercise.sets.forEach(set => {
//                     const reps = parseInt(set.reps);
//
//                     if (!isNaN(reps) && reps > 0) {
//                         hasValidSet = true;
//                         const weight = parseFloat(set.weight) || 0;
//                         const effectiveWeight = set.perLimb ? weight * 2 : weight;
//
//                         switch (metricType) {
//                             case 'volume': // Общий объем
//                                 metricValue += effectiveWeight * reps;
//                                 break;
//                             case 'reps': // Суммарные повторения
//                                 metricValue += reps;
//                                 break;
//                             case 'max-reps': // Максимальные повторения
//                                 if (reps > metricValue) metricValue = reps;
//                                 break;
//                             case 'orm': // 1ПМ
//                                 if (effectiveWeight > 0) {
//                                     const oneRepMax = calculateOneRepMax(effectiveWeight, reps);
//                                     if (oneRepMax > metricValue) metricValue = oneRepMax;
//                                 } else {
//                                     // Для упражнений без веса используем количество повторений
//                                     if (reps > metricValue) metricValue = reps;
//                                 }
//                                 break;
//                         }
//                     }
//                 });
//
//                 if (hasValidSet) {
//                     result.push({
//                         date: date,
//                         value: metricValue,
//                         note: ''
//                     });
//                 }
//             }
//         });
//     }
//
//     // Сортируем по дате
//     result.sort((a, b) => a.date.localeCompare(b.date));
//
//     return {
//         dates: result.map(item => item.date),
//         values: result.map(item => item.value),
//         notes: result.map(item => item.note)
//     };
// }
//
// function initExerciseChart() {
//     const ctx = document.getElementById('exercise-chart');
//     if (!ctx) return;
//
//     // Удаляем предыдущее сообщение об ошибке
//     const prevError = ctx.nextElementSibling;
//     if (prevError && prevError.classList.contains('chart-error')) {
//         prevError.remove();
//     }
//
//     const filter = document.getElementById('exercise-filter');
//     if (!filter) return;
//
//     const exerciseName = filter.value;
//     const metricType = getExerciseMetrics().selectedMetric || 'orm';
//
//     // Очищаем предыдущий график
//     if (exerciseChart) {
//         exerciseChart.destroy();
//         exerciseChart = null;
//     }
//
//     // Если упражнение не выбрано, показываем сообщение
//     if (!exerciseName) {
//         ctx.style.display = 'none';
//         const errorMsg = document.createElement('p');
//         errorMsg.className = 'chart-error';
//         errorMsg.textContent = 'Выберите упражнение из списка для построения графика';
//         ctx.parentNode.insertBefore(errorMsg, ctx.nextSibling);
//         return;
//     }
//
//     // Получаем данные для графика
//     const data = prepareExerciseData(exerciseName);
//
//     // Проверяем наличие данных
//     if (data.dates.length < 1) {
//         ctx.style.display = 'none';
//         const errorMsg = document.createElement('p');
//         errorMsg.className = 'chart-error';
//         errorMsg.textContent = 'Недостаточно данных для выбранного упражнения';
//         ctx.parentNode.insertBefore(errorMsg, ctx.nextSibling);
//         return;
//     }
//
//     const theme = document.documentElement.getAttribute('data-theme') || 'light';
//     const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
//     const bgColor = theme === 'dark' ? 'rgba(255, 99, 132, 0.2)' : 'rgba(255, 99, 132, 0.1)';
//
//     // Форматируем даты для меток
//     const formatDate = (dateStr) => {
//         const parts = dateStr.split('-');
//         if (parts.length === 3) {
//             return `${parts[2]}.${parts[1]}`;
//         }
//         return dateStr;
//     };
//
//     // Показываем canvas
//     ctx.style.display = 'block';
//
//     // Создаем график
//     exerciseChart = new Chart(ctx.getContext('2d'), {
//         type: 'line',
//         data: {
//             labels: data.dates.map(formatDate),
//             datasets: [{
//                 label: getMetricLabel(metricType, exerciseName),
//                 data: data.values,
//                 borderColor: '#ff6384',
//                 backgroundColor: bgColor,
//                 borderWidth: 2,
//                 tension: 0.3,
//                 fill: true,
//                 pointRadius: 6,
//                 pointHoverRadius: 8
//             }]
//         },
//         options: {
//             responsive: true,
//             scales: {
//                 x: {
//                     title: {
//                         display: true,
//                         text: 'Дата'
//                     },
//                     grid: {
//                         color: gridColor
//                     }
//                 },
//                 y: {
//                     beginAtZero: true,
//                     title: {
//                         display: true,
//                         text: getMetricYLabel(metricType)
//                     },
//                     grid: {
//                         color: gridColor
//                     }
//                 }
//             },
//             plugins: {
//                 legend: {
//                     position: 'top',
//                     labels: {
//                         font: {
//                             size: 14
//                         }
//                     }
//                 },
//                 tooltip: {
//                     callbacks: {
//                         title: (items) => {
//                             return data.dates[items[0].dataIndex];
//                         },
//                         label: (context) => {
//                             return `${getMetricLabel(metricType, '')}: ${context.raw}`;
//                         },
//                         footer: (tooltipItems) => {
//                             const index = tooltipItems[0].dataIndex;
//                             return data.notes[index] || '';
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }
//
// function getMetricLabel(metricType, exerciseName) {
//     const labels = {
//         'orm': `1ПМ ${exerciseName}`,
//         'volume': `Общий объём ${exerciseName}`,
//         'reps': `Повторения ${exerciseName}`,
//         'max-reps': `Макс. повторения ${exerciseName}`
//     };
//     return labels[metricType] || exerciseName;
// }
//
// function getMetricYLabel(metricType) {
//     const labels = {
//         'orm': '1ПМ (кг)',
//         'volume': 'Объём (кг×повт)',
//         'reps': 'Количество повторений',
//         'max-reps': 'Макс. повторения'
//     };
//     return labels[metricType] || 'Значение';
// }
//
// function initWeightChart() {
//     const ctx = document.getElementById('weight-chart');
//     if (!ctx) return;
//
//     // Удаляем предыдущее сообщение об ошибке
//     const prevError = ctx.nextElementSibling;
//     if (prevError && prevError.classList.contains('chart-error')) {
//         prevError.remove();
//     }
//
//     // Уничтожаем предыдущий график
//     if (weightChartInstance) {
//         weightChartInstance.destroy();
//         weightChartInstance = null;
//     }
//
//     const data = prepareWeightData();
//     // console.log("Weight chart data:", data); // Добавляем лог для отладки
//
//     // Проверяем достаточно ли точек для построения графика
//     if (data.weights.length < 2) {
//         const errorMsg = document.createElement('p');
//         errorMsg.className = 'chart-error';
//         errorMsg.textContent = data.weights.length === 0
//             ? 'Нет данных о весе. Добавьте взвешивания в дневнике.'
//             : 'Недостаточно данных о весе. Требуется минимум 2 записи.';
//         ctx.parentNode.insertBefore(errorMsg, ctx.nextSibling);
//         return;
//     }
//
//     const theme = document.documentElement.getAttribute('data-theme') || 'light';
//     const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
//
//     // Форматируем даты в понятные метки
//     const formatDate = (dateStr) => {
//         if (!dateStr) return '';
//         const parts = dateStr.split('-');
//         if (parts.length === 3) {
//             return `${parts[2]}.${parts[1]}`;
//         }
//         return dateStr;
//     };
//
//     // Собираем все уникальные даты
//     const allDates = [...new Set([
//         ...data.weights.map(item => item.x),
//         ...data.workouts.map(item => item.x),
//         ...data.alcohol.map(item => item.x)
//     ])].sort();
//
//     // Создаем метки для оси X
//     const labels = allDates.map(formatDate);
//
//     // Создаем наборы данных
//     const weightValues = allDates.map(date => {
//         const entry = data.weights.find(item => item.x === date);
//         return entry ? entry.y : null;
//     });
//
//     // Находим min/max для масштабирования оси Y
//     const weightValuesFiltered = weightValues.filter(v => v !== null);
//     const minY = Math.min(...weightValuesFiltered) - 2;
//     const maxY = Math.max(...weightValuesFiltered) + 2;
//
//     weightChartInstance = new Chart(ctx.getContext('2d'), {
//         type: 'line',
//         data: {
//             labels: labels,
//             datasets: [
//                 {
//                     label: 'Вес (кг)',
//                     data: weightValues,
//                     borderColor: '#3498db',
//                     backgroundColor: theme === 'dark' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(52, 152, 219, 0.1)',
//                     tension: 0.3,
//                     fill: true,
//                     pointRadius: 6,
//                     pointHoverRadius: 8,
//                     pointBackgroundColor: (ctx) => {
//                         const index = ctx.dataIndex;
//                         const date = allDates[index];
//                         const hasWorkout = data.workouts.some(item => item.x === date);
//                         const hasAlcohol = data.alcohol.some(item => item.x === date);
//
//                         if (hasWorkout && hasAlcohol) return '#f1c40f';
//                         if (hasWorkout) return '#2ecc71';
//                         if (hasAlcohol) return '#e74c3c';
//                         return '#3498db';
//                     }
//                 }
//             ]
//         },
//         options: {
//             responsive: true,
//             scales: {
//                 x: {
//                     grid: {
//                         color: gridColor
//                     }
//                 },
//                 y: {
//                     min: minY,
//                     max: maxY,
//                     grid: {
//                         color: gridColor
//                     }
//                 }
//             },
//             plugins: {
//                 legend: {
//                     labels: {
//                         font: {
//                             size: 14
//                         }
//                     }
//                 },
//                 tooltip: {
//                     callbacks: {
//                         title: (tooltipItems) => {
//                             return allDates[tooltipItems[0].dataIndex];
//                         },
//                         beforeBody: (tooltipItems) => {
//                             const index = tooltipItems[0].dataIndex;
//                             const date = allDates[index];
//                             const hasWorkout = data.workouts.some(item => item.x === date);
//                             const hasAlcohol = data.alcohol.some(item => item.x === date);
//
//                             const events = [];
//                             if (hasWorkout) events.push('Тренировка');
//                             if (hasAlcohol) events.push('Алкоголь');
//
//                             return events.length > 0
//                                 ? [`События: ${events.join(', ')}`]
//                                 : [];
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }
//
// function prepareWeightData() {
//     const weights = [];
//     const workouts = [];
//     const alcohol = [];
//     let minWeight = Infinity;
//
//     // Получаем все записи дневника
//     const diaryEntries = dataManagerInstance.getAllEntries()
//         .filter(entry =>
//             entry.type === 'diary' &&
//             !entry.isDraft
//         );
//
//     // Создаем объект для группировки по дате
//     const dateMap = {};
//
//     diaryEntries.forEach(entry => {
//         const date = entry.date;
//         if (!dateMap[date]) {
//             dateMap[date] = {
//                 weights: [],
//                 hasWorkout: false,
//                 hasAlcohol: false
//             };
//         }
//
//         const dateData = dateMap[date];
//
//         // Обработка взвешиваний
//         if (entry.data.weighings && Array.isArray(entry.data.weighings)) {
//             entry.data.weighings.forEach(weighing => {
//                 const weightVal = parseFloat(weighing.weight);
//                 if (!isNaN(weightVal)) {
//                     dateData.weights.push(weightVal);
//                     minWeight = Math.min(minWeight, weightVal);
//                 }
//             });
//         }
//         // Для совместимости со старым форматом данных
//         else if (entry.data.weight) {
//             const weightVal = parseFloat(entry.data.weight);
//             if (!isNaN(weightVal)) {
//                 dateData.weights.push(weightVal);
//                 minWeight = Math.min(minWeight, weightVal);
//             }
//         }
//
//         // Отметки о тренировке
//         if (entry.data.workout && entry.data.workout !== 'none') {
//             dateData.hasWorkout = true;
//         }
//
//         // Отметки об алкоголе
//         if (entry.data.alcohol &&
//             entry.data.alcohol.trim() !== '' &&
//             entry.data.alcohol !== 'no') {
//             dateData.hasAlcohol = true;
//         }
//     });
//
//     // Если нет данных о весе, устанавливаем минимальный вес по умолчанию
//     if (minWeight === Infinity) minWeight = 50;
//
//     // Формируем итоговые данные
//     Object.entries(dateMap).forEach(([date, data]) => {
//         // Добавляем вес
//         if (data.weights.length > 0) {
//             const avgWeight = data.weights.reduce((sum, w) => sum + w, 0) / data.weights.length;
//             weights.push({
//                 x: date,
//                 y: parseFloat(avgWeight.toFixed(1))
//             });
//         }
//
//         // Добавляем отметки о событиях
//         if (data.hasWorkout) {
//             workouts.push({ x: date, y: minWeight - 1 });
//         }
//         if (data.hasAlcohol) {
//             alcohol.push({ x: date, y: minWeight - 2 });
//         }
//     });
//
//     // Сортировка по дате
//     weights.sort((a, b) => a.x.localeCompare(b.x));
//     workouts.sort((a, b) => a.x.localeCompare(b.x));
//     alcohol.sort((a, b) => a.x.localeCompare(b.x));
//
//     return { weights, workouts, alcohol };
// }

function initSleepChart() {
    const ctx = document.getElementById('sleep-chart');
    if (!ctx) return;

    // Удаляем предыдущее сообщение об ошибке
    const prevError = ctx.nextElementSibling;
    if (prevError && prevError.classList.contains('chart-error')) {
        prevError.remove();
    }

    // Уничтожаем предыдущий график
    if (sleepChartInstance) {
        sleepChartInstance.destroy();
        sleepChartInstance = null;
    }

    const data = prepareSleepData();

    // Проверяем достаточно ли точек для построения графика
    if (data.dates.length < 2) {
        const errorMsg = document.createElement('p');
        errorMsg.className = 'chart-error';
        errorMsg.textContent = 'Недостаточно данных о сне. Требуется минимум 2 записи.';
        ctx.parentNode.insertBefore(errorMsg, ctx.nextSibling);
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

    sleepChartInstance = new Chart(ctx.getContext('2d'), {
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
    const result = [];

    // Получаем все записи дневника
    const diaryEntries = dataManagerInstance.getAllEntries()
        .filter(entry =>
            entry.type === 'diary' &&
            !entry.isDraft
        );

    // Группируем по дате
    const groupedByDate = {};
    diaryEntries.forEach(entry => {
        if (!groupedByDate[entry.date]) {
            groupedByDate[entry.date] = [];
        }
        groupedByDate[entry.date].push(entry.data);
    });

    // Обрабатываем каждую дату
    for (const date in groupedByDate) {
        let totalSleepHours = 0;
        let sleepNote = '';
        let sleepCount = 0;

        groupedByDate[date].forEach(data => {
            if (data.sleepDuration) {
                const [hours, minutes] = data.sleepDuration.split(':').map(Number);
                if (!isNaN(hours)) {
                    totalSleepHours += hours + (minutes || 0) / 60;
                    sleepCount++;
                }
            }
            if (data.notes) {
                sleepNote = data.notes;
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

    // Удаляем предыдущее сообщение об ошибке
    const prevError = ctx.nextElementSibling;
    if (prevError && prevError.classList.contains('chart-error')) {
        prevError.remove();
    }

    // Уничтожаем предыдущий график
    if (energyChartInstance) {
        energyChartInstance.destroy();
        energyChartInstance = null;
    }

    const data = prepareEnergyData();

    // Проверяем достаточно ли точек для построения графика
    if (data.dates.length < 2) {
        const errorMsg = document.createElement('p');
        errorMsg.className = 'chart-error';
        errorMsg.textContent = 'Недостаточно данных об энергии. Требуется минимум 2 записи.';
        ctx.parentNode.insertBefore(errorMsg, ctx.nextSibling);
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

    energyChartInstance = new Chart(ctx.getContext('2d'), {
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
    const result = [];

    // Получаем все записи дневника
    const diaryEntries = dataManagerInstance.getAllEntries()
        .filter(entry =>
            entry.type === 'diary' &&
            !entry.isDraft
        );

    // Группируем по дате
    const groupedByDate = {};
    diaryEntries.forEach(entry => {
        if (!groupedByDate[entry.date]) {
            groupedByDate[entry.date] = [];
        }
        groupedByDate[entry.date].push(entry.data);
    });

    // Обрабатываем каждую дату
    for (const date in groupedByDate) {
        let energySum = 0;
        let energyCount = 0;
        let energyNote = '';

        groupedByDate[date].forEach(data => {
            if (data.energyLevel) {
                const level = parseInt(data.energyLevel);
                if (!isNaN(level)) {
                    energySum += level;
                    energyCount++;
                }
            }
            if (data.notes) {
                energyNote = data.notes;
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

function calculateOneRepMax(weight, reps) {
    if (weight <= 0 || reps <= 0) return 0;

    // Используем формулу Brzycki для более точных расчетов
    if (reps === 1) return weight;

    // 1ПМ = вес / (1.0278 - 0.0278 * повторения)
    const oneRepMax = weight / (1.0278 - (0.0278 * reps));
    return Math.round(oneRepMax * 10) / 10; // Округляем до 0.1
}

function populateExerciseFilter() {
    const filter = document.getElementById('exercise-filter');
    if (!filter) return;

    filter.innerHTML = '<option value="">Выберите упражнение</option>';

    // Получаем все тренировки
    const trainingEntries = dataManagerInstance.getAllEntries()
        .filter(entry =>
            entry.type === 'training' &&
            !entry.isDraft
        );

    const exercises = new Set();

    // Собираем уникальные упражнения
    trainingEntries.forEach(entry => {
        if (entry.data.name && entry.data.name.trim() !== '') {
            exercises.add(entry.data.name);
        }
    });

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
        if (exerciseChart) {
            exerciseChart.destroy();
            exerciseChart = null;
        }
        initExerciseChart();
    });
}
