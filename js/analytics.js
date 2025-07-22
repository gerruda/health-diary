export function initAnalytics() {
    // Проверяем существование элементов перед работой с ними
    const sleepChartEl = document.getElementById('sleep-chart');
    const energyChartEl = document.getElementById('energy-chart');
    const weightChartEl = document.getElementById('weight-chart');

    if (!sleepChartEl || !energyChartEl || !weightChartEl) {
        console.warn('Один или несколько элементов графиков не найдены');
        return;
    }

    // Инициализация графиков (заглушки)
    initChart(sleepChartEl, 'Длительность сна (часы)', [7, 8, 7.5, 6, 8, 9, 7], 'rgba(54, 162, 235, 0.2)');
    initChart(energyChartEl, 'Уровень энергии', [3, 4, 5, 4, 3, 4, 5], 'rgba(255, 99, 132, 0.2)');
    initChart(weightChartEl, 'Вес (кг)', [75.2, 74.8, 74.5, 74.6, 74.3, 74.1, 73.9], 'rgba(75, 192, 192, 0.2)');
}

function initChart(canvas, label, data, bgColor) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [{
                label: label,
                data: data,
                borderColor: '#3498db',
                backgroundColor: bgColor,
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}
