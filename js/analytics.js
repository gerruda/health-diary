export function initAnalytics() {
    const updateChartBtn = document.getElementById('update-chart');
    if (!updateChartBtn) return;

    // Установка дат по умолчанию
    const today = new Date();
    chartStartDateEl.valueAsDate = new Date(today.getFullYear(), today.getMonth(), 1);
    chartEndDateEl.valueAsDate = today;

    // Обработчик обновления графика
    updateChartBtn.addEventListener('click', updateChart);

    // Первоначальное обновление графика
    updateChart();
}

function updateChart() {
    const chartType = chartTypeEl.value;
    const startDate = new Date(chartStartDateEl.value);
    const endDate = new Date(chartEndDateEl.value);

    // Собираем данные для графика
    const labels = [];
    const data = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        labels.push(dateStr);

        if (healthData[dateStr]) {
            // Для разных типов данных разная логика агрегации
            switch(chartType) {
                case 'weight':
                    // Берем последнее взвешивание за день
                    const weightEntry = [...healthData[dateStr]].reverse()
                        .find(entry => entry.weight !== null);
                    data.push(weightEntry ? parseFloat(weightEntry.weight) : null);
                    break;

                case 'pulse':
                    // Средний пульс за день
                    const pulses = healthData[dateStr]
                        .filter(entry => entry.pulse !== null)
                        .map(entry => parseInt(entry.pulse));
                    data.push(pulses.length ? (pulses.reduce((a, b) => a + b, 0) / pulses.length) : null);
                    break;

                case 'sleep':
                    // Общая продолжительность сна
                    let totalSleep = 0;
                    healthData[dateStr].forEach(entry => {
                        if (entry.sleepDuration) {
                            const [hours, minutes] = entry.sleepDuration.split(':').map(Number);
                            totalSleep += hours + minutes / 60;
                        }
                    });
                    data.push(totalSleep || null);
                    break;

                case 'energy':
                    // Последняя оценка энергии
                    const energyEntry = [...healthData[dateStr]].reverse()
                        .find(entry => entry.energyLevel !== null);
                    data.push(energyEntry ? parseInt(energyEntry.energyLevel) : null);
                    break;

                case 'steps':
                    // Сумма шагов за день
                    const steps = healthData[dateStr]
                        .filter(entry => entry.steps !== null)
                        .reduce((sum, entry) => sum + parseInt(entry.steps), 0);
                    data.push(steps || null);
                    break;

                case 'mood':
                    // Последняя оценка настроения
                    const moodEntry = [...healthData[dateStr]].reverse()
                        .find(entry => entry.mood !== null);
                    const moodValue = moodEntry ? moodToNumber(moodEntry.mood) : null;
                    data.push(moodValue);
                    break;
            }
        } else {
            data.push(null);
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Уничтожаем предыдущий график, если он есть
    if (currentChart) {
        currentChart.destroy();
    }

    // Создаем новый график
    const ctx = chartCanvas.getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: getChartLabel(chartType),
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: chartType !== 'weight'
                }
            }
        }
    });
}
