document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    const currentDateEl = document.getElementById('current-date');
    const dailyForm = document.getElementById('daily-form');
    const historyDateEl = document.getElementById('history-date');
    const historyEntriesEl = document.getElementById('history-entries');
    const exportBtn = document.getElementById('export-btn');
    const chartCanvas = document.getElementById('health-chart');
    const chartTypeEl = document.getElementById('chart-type');
    const chartStartDateEl = document.getElementById('chart-start-date');
    const chartEndDateEl = document.getElementById('chart-end-date');
    const updateChartBtn = document.getElementById('update-chart');
    const reminderTimeEl = document.getElementById('reminder-time');
    const reminderActiveEl = document.getElementById('reminder-active');
    const saveSettingsBtn = document.getElementById('save-settings');
    const addAnotherWeightBtn = document.getElementById('add-another-weight');
    const weightConditionEl = document.getElementById('weight-condition');
    const conditionListEl = document.getElementById('condition-list');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const closeModal = document.querySelector('.close');

    // Переменные состояния
    let healthData = JSON.parse(localStorage.getItem('healthData')) || {};
    let settings = JSON.parse(localStorage.getItem('healthSettings')) || {
        reminderTime: '20:00',
        reminderActive: true
    };
    let weightConditions = JSON.parse(localStorage.getItem('weightConditions')) || [
        'Утром натощак',
        'Вечером перед сном',
        'После тренировки',
        'До еды',
        'После еды'
    ];
    let currentChart = null;

    // Инициализация
    function init() {
        // Установка текущей даты
        const today = new Date();
        const formattedDate = formatDate(today);
        currentDateEl.textContent = formattedDate;

        // Загрузка данных за сегодня
        loadTodayData();

        // Инициализация вкладок
        initTabs();

        // Инициализация истории
        historyDateEl.valueAsDate = today;
        loadHistoryData(today);

        // Инициализация настроек
        initSettings();

        // Инициализация условий взвешивания
        initWeightConditions();

        // Инициализация графиков
        initCharts();

        // Проверка напоминаний
        checkReminders();
        setInterval(checkReminders, 60000); // Проверка каждую минуту
    }

    // Форматирование даты
    function formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Инициализация вкладок
    function initTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Удаляем активный класс у всех вкладок
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                // Добавляем активный класс текущей вкладке
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');

                // Обновляем графики при переключении на аналитику
                if (tabId === 'analytics-tab') {
                    updateChart();
                }
            });
        });
    }

    // Загрузка данных за сегодня
    function loadTodayData() {
        const today = new Date().toISOString().split('T')[0];

        if (!healthData[today]) {
            healthData[today] = [];
        }

        // Если уже есть записи за сегодня, показываем последнюю
        if (healthData[today].length > 0) {
            const lastEntry = healthData[today][healthData[today].length - 1];
            populateForm(lastEntry);
        }
    }

    // Заполнение формы данными
    function populateForm(data) {
        if (data.pulse) document.getElementById('pulse').value = data.pulse;

        if (data.sleepDuration) {
            const [hours, minutes] = data.sleepDuration.split(':').map(Number);
            document.getElementById('sleep-hours').value = hours;
            document.getElementById('sleep-minutes').value = minutes;
        }

        if (data.energyLevel) {
            document.querySelector(`input[name="energy"][value="${data.energyLevel}"]`).checked = true;
        }

        if (data.weight) document.getElementById('weight').value = data.weight;
        if (data.weightCondition) document.getElementById('weight-condition').value = data.weightCondition;
        if (data.steps) document.getElementById('steps').value = data.steps;
        if (data.calories) document.getElementById('calories').value = data.calories;
        if (data.alcohol) document.getElementById('alcohol').value = data.alcohol;
        if (data.workout) document.getElementById('workout').value = data.workout;
        if (data.mood) document.getElementById('mood').value = data.mood;
        if (data.notes) document.getElementById('notes').value = data.notes;
    }

    // Обработка отправки ежедневной формы
    dailyForm.addEventListener('submit', e => {
        e.preventDefault();

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const entry = {
            id: Date.now(),
            time: now.toTimeString().substring(0, 5),
            pulse: document.getElementById('pulse').value || null,
            sleepDuration: `${document.getElementById('sleep-hours').value || 0}:${document.getElementById('sleep-minutes').value || 0}`,
            energyLevel: document.querySelector('input[name="energy"]:checked')?.value || null,
            weight: document.getElementById('weight').value || null,
            weightCondition: document.getElementById('weight-condition').value || null,
            steps: document.getElementById('steps').value || null,
            calories: document.getElementById('calories').value || null,
            alcohol: document.getElementById('alcohol').value || null,
            workout: document.getElementById('workout').value || null,
            mood: document.getElementById('mood').value || null,
            notes: document.getElementById('notes').value || null
        };

        // Сохраняем условие взвешивания, если оно новое
        if (entry.weightCondition && !weightConditions.includes(entry.weightCondition)) {
            weightConditions.push(entry.weightCondition);
            localStorage.setItem('weightConditions', JSON.stringify(weightConditions));
            initWeightConditions();
        }

        // Добавляем запись
        if (!healthData[today]) healthData[today] = [];
        healthData[today].push(entry);
        localStorage.setItem('healthData', JSON.stringify(healthData));

        // Оповещение
        alert('Данные сохранены!');

        // Сбрасываем только часть формы
        document.getElementById('pulse').value = '';
        document.getElementById('weight').value = '';
        document.getElementById('steps').value = '';
        document.getElementById('calories').value = '';
        document.getElementById('notes').value = '';

        // Обновляем историю
        loadHistoryData(new Date());
    });

    // Добавление еще одного взвешивания
    addAnotherWeightBtn.addEventListener('click', () => {
        document.getElementById('weight').value = '';
        document.getElementById('weight-condition').value = '';
        document.getElementById('weight').focus();
    });

    // Инициализация условий взвешивания
    function initWeightConditions() {
        conditionListEl.innerHTML = '';
        weightConditions.forEach(condition => {
            const option = document.createElement('option');
            option.value = condition;
            conditionListEl.appendChild(option);
        });
    }

    // Загрузка исторических данных
    function loadHistoryData(date) {
        const dateStr = date.toISOString().split('T')[0];
        historyEntriesEl.innerHTML = '';

        if (!healthData[dateStr] || healthData[dateStr].length === 0) {
            historyEntriesEl.innerHTML = '<p class="empty-message">Записей за этот день нет</p>';
            return;
        }

        healthData[dateStr].forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.className = 'history-entry';
            entryEl.innerHTML = `
        <div class="entry-header">
          <div class="entry-time">${entry.time}</div>
          <div class="entry-actions">
            <button class="edit-btn" data-date="${dateStr}" data-id="${entry.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" data-date="${dateStr}" data-id="${entry.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="entry-data">
          ${entry.pulse ? `<div class="data-item"><span class="data-label">Пульс:</span> ${entry.pulse} уд/мин</div>` : ''}
          ${entry.sleepDuration ? `<div class="data-item"><span class="data-label">Сон:</span> ${entry.sleepDuration}</div>` : ''}
          ${entry.energyLevel ? `<div class="data-item"><span class="data-label">Энергия:</span> ${'★'.repeat(entry.energyLevel)}</div>` : ''}
          ${entry.weight ? `<div class="data-item"><span class="data-label">Вес:</span> ${entry.weight} кг (${entry.weightCondition || 'без условий'})</div>` : ''}
          ${entry.steps ? `<div class="data-item"><span class="data-label">Шаги:</span> ${entry.steps}</div>` : ''}
          ${entry.calories ? `<div class="data-item"><span class="data-label">Калории:</span> ${entry.calories} ккал</div>` : ''}
          ${entry.alcohol ? `<div class="data-item"><span class="data-label">Алкоголь:</span> ${getAlcoholText(entry.alcohol)}</div>` : ''}
          ${entry.workout ? `<div class="data-item"><span class="data-label">Тренировка:</span> ${getWorkoutText(entry.workout)}</div>` : ''}
          ${entry.mood ? `<div class="data-item"><span class="data-label">Настроение:</span> ${getMoodText(entry.mood)}</div>` : ''}
          ${entry.notes ? `<div class="data-item full-width"><span class="data-label">Заметки:</span> ${entry.notes}</div>` : ''}
        </div>
      `;

            historyEntriesEl.appendChild(entryEl);
        });

        // Добавляем обработчики для кнопок
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', openEditModal);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteEntry);
        });
    }

    // Открытие модального окна для редактирования
    function openEditModal(e) {
        const date = e.currentTarget.getAttribute('data-date');
        const id = e.currentTarget.getAttribute('data-id');

        const entry = healthData[date].find(item => item.id == id);
        if (!entry) return;

        editForm.innerHTML = `
      <input type="hidden" name="date" value="${date}">
      <input type="hidden" name="id" value="${id}">
      
      <div class="form-group">
        <label for="edit-pulse">Пульс (уд/мин):</label>
        <input type="number" id="edit-pulse" min="40" max="200" value="${entry.pulse || ''}">
      </div>
      
      <div class="form-group">
        <label for="edit-sleep">Длительность сна:</label>
        <div class="time-input">
          <input type="number" id="edit-sleep-hours" placeholder="Ч" min="0" max="24" value="${entry.sleepDuration ? entry.sleepDuration.split(':')[0] : '7'}">
          <span>:</span>
          <input type="number" id="edit-sleep-minutes" placeholder="М" min="0" max="59" value="${entry.sleepDuration ? entry.sleepDuration.split(':')[1] : '30'}">
        </div>
      </div>
      
      <div class="form-group">
        <label for="edit-energy">Утренняя энергия:</label>
        <div class="rating">
          <input type="radio" id="edit-energy-1" name="edit-energy" value="1" ${entry.energyLevel == 1 ? 'checked' : ''}>
          <label for="edit-energy-1">1</label>
          <input type="radio" id="edit-energy-2" name="edit-energy" value="2" ${entry.energyLevel == 2 || !entry.energyLevel ? 'checked' : ''}>
          <label for="edit-energy-2">2</label>
          <input type="radio" id="edit-energy-3" name="edit-energy" value="3" ${entry.energyLevel == 3 ? 'checked' : ''}>
          <label for="edit-energy-3">3</label>
          <input type="radio" id="edit-energy-4" name="edit-energy" value="4" ${entry.energyLevel == 4 ? 'checked' : ''}>
          <label for="edit-energy-4">4</label>
          <input type="radio" id="edit-energy-5" name="edit-energy" value="5" ${entry.energyLevel == 5 ? 'checked' : ''}>
          <label for="edit-energy-5">5</label>
        </div>
      </div>
      
      <div class="form-group">
        <label for="edit-weight">Вес (кг):</label>
        <input type="number" id="edit-weight" step="0.1" min="30" max="200" value="${entry.weight || ''}">
      </div>
      
      <div class="form-group">
        <label for="edit-weight-condition">Условия взвешивания:</label>
        <input type="text" id="edit-weight-condition" list="condition-list" value="${entry.weightCondition || ''}">
      </div>
      
      <div class="form-group">
        <label for="edit-steps">Шаги:</label>
        <input type="number" id="edit-steps" min="0" max="50000" value="${entry.steps || ''}">
      </div>
      
      <div class="form-group">
        <label for="edit-calories">Калории (ккал):</label>
        <input type="number" id="edit-calories" min="0" max="10000" value="${entry.calories || ''}">
      </div>
      
      <div class="form-group">
        <label for="edit-alcohol">Алкоголь:</label>
        <select id="edit-alcohol">
          <option value="no" ${entry.alcohol === 'no' ? 'selected' : ''}>Нет</option>
          <option value="little" ${entry.alcohol === 'little' ? 'selected' : ''}>Мало (1-2 порции)</option>
          <option value="medium" ${entry.alcohol === 'medium' ? 'selected' : ''}>Умеренно (3-4 порции)</option>
          <option value="much" ${entry.alcohol === 'much' ? 'selected' : ''}>Много (5+ порций)</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="edit-workout">Тренировка:</label>
        <select id="edit-workout">
          <option value="none" ${entry.workout === 'none' ? 'selected' : ''}>Нет</option>
          <option value="light" ${entry.workout === 'light' ? 'selected' : ''}>Легкая</option>
          <option value="medium" ${entry.workout === 'medium' ? 'selected' : ''}>Средняя</option>
          <option value="hard" ${entry.workout === 'hard' ? 'selected' : ''}>Интенсивная</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="edit-mood">Настроение вечером:</label>
        <select id="edit-mood">
          <option value="excellent" ${entry.mood === 'excellent' ? 'selected' : ''}>Отличное 😄</option>
          <option value="good" ${entry.mood === 'good' ? 'selected' : ''}>Хорошее 🙂</option>
          <option value="normal" ${entry.mood === 'normal' ? 'selected' : ''}>Нормальное 😐</option>
          <option value="bad" ${entry.mood === 'bad' ? 'selected' : ''}>Плохое 🙁</option>
          <option value="awful" ${entry.mood === 'awful' ? 'selected' : ''}>Ужасное 😞</option>
        </select>
      </div>
      
      <div class="form-group full-width">
        <label for="edit-notes">Заметки:</label>
        <textarea id="edit-notes" rows="3">${entry.notes || ''}</textarea>
      </div>
      
      <div class="form-buttons">
        <button type="submit" class="btn-save"><i class="fas fa-save"></i> Сохранить изменения</button>
      </div>
    `;

        // Обработчик для формы редактирования
        editForm.onsubmit = function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const date = formData.get('date');
            const id = formData.get('id');

            const entryIndex = healthData[date].findIndex(item => item.id == id);
            if (entryIndex === -1) return;

            // Обновляем запись
            healthData[date][entryIndex] = {
                ...healthData[date][entryIndex],
                pulse: document.getElementById('edit-pulse').value || null,
                sleepDuration: `${document.getElementById('edit-sleep-hours').value || 0}:${document.getElementById('edit-sleep-minutes').value || 0}`,
                energyLevel: document.querySelector('input[name="edit-energy"]:checked')?.value || null,
                weight: document.getElementById('edit-weight').value || null,
                weightCondition: document.getElementById('edit-weight-condition').value || null,
                steps: document.getElementById('edit-steps').value || null,
                calories: document.getElementById('edit-calories').value || null,
                alcohol: document.getElementById('edit-alcohol').value || null,
                workout: document.getElementById('edit-workout').value || null,
                mood: document.getElementById('edit-mood').value || null,
                notes: document.getElementById('edit-notes').value || null
            };

            // Сохраняем
            localStorage.setItem('healthData', JSON.stringify(healthData));
            loadHistoryData(new Date(historyDateEl.value));
            editModal.style.display = 'none';
            alert('Изменения сохранены!');
        };

        editModal.style.display = 'flex';
    }

    // Удаление записи
    function deleteEntry(e) {
        if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;

        const date = e.currentTarget.getAttribute('data-date');
        const id = e.currentTarget.getAttribute('data-id');

        healthData[date] = healthData[date].filter(item => item.id != id);

        // Если день пустой, удаляем его
        if (healthData[date].length === 0) {
            delete healthData[date];
        }

        localStorage.setItem('healthData', JSON.stringify(healthData));
        loadHistoryData(new Date(historyDateEl.value));
    }

    // Закрытие модального окна
    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    window.addEventListener('click', e => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // Инициализация настроек
    function initSettings() {
        reminderTimeEl.value = settings.reminderTime;
        reminderActiveEl.checked = settings.reminderActive;

        saveSettingsBtn.addEventListener('click', () => {
            settings.reminderTime = reminderTimeEl.value;
            settings.reminderActive = reminderActiveEl.checked;
            localStorage.setItem('healthSettings', JSON.stringify(settings));
            alert('Настройки сохранены!');
        });
    }

    // Проверка напоминаний
    function checkReminders() {
        if (!settings.reminderActive) return;

        const now = new Date();
        const [reminderHours, reminderMinutes] = settings.reminderTime.split(':').map(Number);

        if (
            now.getHours() === reminderHours &&
            now.getMinutes() === reminderMinutes &&
            now.getSeconds() < 5 // Чтобы срабатывало только один раз в минуту
        ) {
            // Проверяем, были ли сегодня введены данные
            const today = new Date().toISOString().split('T')[0];
            const hasEntries = healthData[today] && healthData[today].length > 0;

            if (!hasEntries) {
                if (Notification.permission === 'granted') {
                    new Notification('Дневник здоровья', {
                        body: 'Пора внести данные за сегодня!'
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification('Дневник здоровья', {
                                body: 'Пора внести данные за сегодня!'
                            });
                        }
                    });
                }
            }
        }
    }

    // Инициализация графиков
    function initCharts() {
        const today = new Date();
        chartStartDateEl.valueAsDate = new Date(today.getFullYear(), today.getMonth(), 1);
        chartEndDateEl.valueAsDate = today;

        updateChartBtn.addEventListener('click', updateChart);
        updateChart();
    }

    // Обновление графика
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

    // Вспомогательные функции
    function getAlcoholText(value) {
        const texts = {
            'no': 'Нет',
            'little': 'Мало (1-2 порции)',
            'medium': 'Умеренно (3-4 порции)',
            'much': 'Много (5+ порций)'
        };
        return texts[value] || value;
    }

    function getWorkoutText(value) {
        const texts = {
            'none': 'Нет',
            'light': 'Легкая',
            'medium': 'Средняя',
            'hard': 'Интенсивная'
        };
        return texts[value] || value;
    }

    function getMoodText(value) {
        const texts = {
            'excellent': 'Отличное 😄',
            'good': 'Хорошее 🙂',
            'normal': 'Нормальное 😐',
            'bad': 'Плохое 🙁',
            'awful': 'Ужасное 😞'
        };
        return texts[value] || value;
    }

    function moodToNumber(mood) {
        const map = {
            'awful': 1,
            'bad': 2,
            'normal': 3,
            'good': 4,
            'excellent': 5
        };
        return map[mood] || 3;
    }

    function getChartLabel(type) {
        const labels = {
            'weight': 'Вес (кг)',
            'pulse': 'Пульс (уд/мин)',
            'sleep': 'Сон (часы)',
            'energy': 'Уровень энергии (1-5)',
            'steps': 'Шаги',
            'mood': 'Настроение (1-5)'
        };
        return labels[type] || type;
    }

    // Экспорт в Excel
    exportBtn.addEventListener('click', () => {
        // Собираем все данные
        const allData = [];

        Object.keys(healthData).forEach(date => {
            healthData[date].forEach(entry => {
                allData.push({
                    Дата: date,
                    Время: entry.time,
                    'Пульс в покое': entry.pulse,
                    'Длительность сна': entry.sleepDuration,
                    'Уровень энергии': entry.energyLevel,
                    Вес: entry.weight,
                    'Условия взвешивания': entry.weightCondition,
                    Шаги: entry.steps,
                    Калории: entry.calories,
                    Алкоголь: getAlcoholText(entry.alcohol),
                    Тренировка: getWorkoutText(entry.workout),
                    Настроение: getMoodText(entry.mood),
                    Заметки: entry.notes
                });
            });
        });

        // Создаем книгу Excel
        const worksheet = XLSX.utils.json_to_sheet(allData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Дневник здоровья');

        // Экспортируем
        XLSX.writeFile(workbook, 'health-diary-export.xlsx');
    });

    // Инициализация истории при изменении даты
    historyDateEl.addEventListener('change', () => {
        loadHistoryData(new Date(historyDateEl.value));
    });

    // Запуск приложения
    init();
});
