export function initExport() {
    const exportSection = document.createElement('div');
    exportSection.id = 'export-controls';
    exportSection.innerHTML = `
        <h3>Экспорт данных</h3>
        <div class="form-group">
            <label for="export-type">Тип данных:</label>
            <select id="export-type">
                <option value="health">Дневник здоровья</option>
                <option value="workout">Тренировки</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="export-range">Период:</label>
            <select id="export-range">
                <option value="current-week">Текущая неделя</option>
                <option value="last-week">Прошлая неделя</option>
                <option value="all">Все данные</option>
                <option value="custom">Выбрать период</option>
            </select>
        </div>
        
        <div id="custom-dates" class="form-group" style="display: none;">
            <div>
                <label for="start-date">Начальная дата:</label>
                <input type="date" id="start-date">
            </div>
            <div>
                <label for="end-date">Конечная дата:</label>
                <input type="date" id="end-date">
            </div>
        </div>
        
        <button id="export-btn" class="btn-export">Экспорт в Excel</button>
    `;

    const historyTab = document.getElementById('history');
    document.getElementById('export-range')?.addEventListener('change', function() {
        document.getElementById('custom-dates').style.display =
            this.value === 'custom' ? 'block' : 'none';
    });

    document.getElementById('export-btn')?.addEventListener('click', exportToExcel);

    if (historyTab) {
        historyTab.appendChild(exportSection);
    }
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Библиотека экспорта не загружена. Обновите страницу.');
        return;
    }

    const type = document.getElementById('export-type').value;
    const range = document.getElementById('export-range').value;

    let data, fileName;

    if (type === 'health') {
        data = prepareHealthData(range);
        fileName = "health_diary_export";
    } else {
        data = prepareWorkoutData(range);
        fileName = "workout_export";
    }

    if (data.length === 0) {
        alert('Нет данных для экспорта в выбранном периоде!');
        return;
    }

    try {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Данные");
        XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
        console.error('Ошибка экспорта:', e);
        alert('Произошла ошибка при экспорте данных: ' + e.message);
    }
}

function getDateRange(range) {
    const now = new Date();
    let startDate, endDate;

    switch (range) {
        case 'current-week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;
        case 'last-week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay() - 6);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;
        case 'custom':
            startDate = new Date(document.getElementById('start-date').value);
            endDate = new Date(document.getElementById('end-date').value);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                alert('Пожалуйста, выберите корректные даты');
                return null;
            }
            break;
        case 'all':
        default:
            startDate = new Date(0);
            endDate = new Date(8640000000000000);
            break;
    }

    return { startDate, endDate };
}

function prepareHealthData(range) {
    const healthData = getHealthData();
    const dateRange = getDateRange(range);
    if (!dateRange) return [];

    const { startDate, endDate } = dateRange;
    const exportData = [];

    for (const date in healthData) {
        const currentDate = new Date(date);
        if (currentDate >= startDate && currentDate <= endDate) {
            healthData[date].forEach(entry => {
                // Форматируем взвешивания
                let weighingsText = '';
                if (entry.weighings && entry.weighings.length > 0) {
                    weighingsText = entry.weighings.map(w =>
                        `${w.weight} кг${w.condition ? ` (${w.condition})` : ''}`
                    ).join('; ');
                } else if (entry.weight) {
                    // Совместимость со старым форматом
                    weighingsText = `${entry.weight} кг${entry.weightCondition ? ` (${entry.weightCondition})` : ''}`;
                }

                // Создаем одну запись за день
                exportData.push({
                    Дата: date,
                    Пульс: entry.pulse || '',
                    Сон: entry.sleepDuration || '',
                    'Уровень энергии': entry.energyLevel || '',
                    'Взвешивания': weighingsText,
                    Шаги: entry.steps || '',
                    Калории: entry.calories || '',
                    Алкоголь: entry.alcohol || '',
                    Тренировка: entry.workout || '',
                    RPE: entry.rpe || '',
                    Настроение: entry.mood || '',
                    Заметки: entry.notes || ''
                });
            });
        }
    }

    return exportData;
}

function prepareWorkoutData(range) {
    const workoutHistory = getWorkoutHistory();
    const dateRange = getDateRange(range);
    if (!dateRange) return [];

    const { startDate, endDate } = dateRange;
    const exportData = [];

    for (const date in workoutHistory) {
        const currentDate = new Date(date);
        if (currentDate >= startDate && currentDate <= endDate) {
            workoutHistory[date].forEach(exercise => {
                // Рассчитываем показатели для упражнения
                let setsText = '';
                let best1RM = 0;
                let totalVolume = 0;
                let bestSetIndex = 0;
                let bestSetValue = 0;

                exercise.sets.forEach((set, index) => {
                    // Учитываем флаг "на каждую конечность"
                    const effectiveWeight = set.perLimb ? set.weight * 2 : set.weight;

                    // Рассчитываем 1ПМ для подхода (формула Эпли)
                    const oneRepMax = effectiveWeight * (1 + set.reps / 30);

                    // Рассчитываем объем подхода
                    const setVolume = effectiveWeight * set.reps;

                    // Форматируем подход
                    setsText += `Подход ${index + 1}: ${set.weight} кг × ${set.reps}`;
                    if (set.perLimb) setsText += ' (на каждую конечность)';
                    setsText += '; ';

                    // Обновляем лучшие показатели
                    if (oneRepMax > best1RM) best1RM = oneRepMax;
                    totalVolume += setVolume;

                    // Находим лучший подход (по весу)
                    if (effectiveWeight > bestSetValue) {
                        bestSetValue = effectiveWeight;
                        bestSetIndex = index;
                    }
                });

                // Форматируем лучший подход
                const bestSet = exercise.sets[bestSetIndex];
                const bestEffectiveWeight = bestSet.perLimb ? bestSet.weight * 2 : bestSet.weight;
                const bestSetText = `${bestEffectiveWeight} кг × ${bestSet.reps}`;

                // Создаем запись для каждого упражнения
                exportData.push({
                    Дата: date,
                    Упражнение: exercise.name,
                    Подходы: setsText,
                    'Лучший подход': bestSetText,
                    '1ПМ (расч.)': best1RM.toFixed(1),
                    'Общий объем': totalVolume.toFixed(1),
                    RPE: exercise.rpe || ''
                });
            });
        }
    }

    return exportData;
}
