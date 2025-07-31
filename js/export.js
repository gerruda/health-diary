import {loadHistoryData} from "./history.js";

export function initExport(dataManager) {
    const exportSection = document.createElement('div');
    exportSection.id = 'export-controls';
    exportSection.innerHTML = `
        <h3><i class="fas fa-database"></i> Управление данными</h3>
        <div class="form-row">
            <div class="form-group">
                <label for="export-type"><i class="fas fa-file-export"></i> Тип данных:</label>
                <select id="export-type">
                    <option value="health">Дневник здоровья</option>
                    <option value="workout">Тренировки</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="export-range"><i class="fas fa-calendar"></i> Период:</label>
                <select id="export-range">
                    <option value="current-week">Текущая неделя</option>
                    <option value="last-week">Прошлая неделя</option>
                    <option value="all">Все данные</option>
                    <option value="custom">Выбрать период</option>
                </select>
            </div>
        </div>
        
        <div id="custom-dates" class="form-row" style="display: none;">
            <div class="form-group">
                <label for="start-date">Начальная дата:</label>
                <input type="date" id="start-date">
            </div>
            <div class="form-group">
                <label for="end-date">Конечная дата:</label>
                <input type="date" id="end-date">
            </div>
        </div>
        
        <div class="actions">
            <button id="export-btn" class="btn btn-export">
                <i class="fas fa-file-excel"></i> Экспорт в Excel
            </button>
            <button id="import-btn" class="btn btn-import">
                <i class="fas fa-file-import"></i> Импорт данных
            </button>
            <input type="file" id="import-file" accept=".xlsx,.xls" style="display: none;">
        </div>
    `;

    // Обработчики событий
    document.getElementById('export-range')?.addEventListener('change', function() {
        document.getElementById('custom-dates').style.display =
            this.value === 'custom' ? 'flex' : 'none';
    });

    document.getElementById('export-btn')?.addEventListener('click', () =>
        exportToExcel(dataManager)
    );

    document.getElementById('import-btn')?.addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file')?.addEventListener('change', (e) =>
        handleFileImport(e, dataManager)
    );

    return exportSection;
}

function exportToExcel(dataManager) {
    if (typeof XLSX === 'undefined') {
        alert('Библиотека экспорта не загружена. Обновите страницу.');
        return;
    }

    const type = document.getElementById('export-type').value;
    const range = document.getElementById('export-range').value;

    let data, fileName;

    if (type === 'health') {
        data = prepareHealthData(dataManager, range);
        fileName = "health_diary_export";
    } else {
        data = prepareWorkoutData(dataManager, range);
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

function prepareHealthData(dataManager, range) {
    const dateRange = getDateRange(range);
    if (!dateRange) return [];

    const { startDate, endDate } = dateRange;
    const exportData = [];

    // Получаем все записи через DataManager
    const allEntries = dataManager.getAllEntries();

    // Фильтруем записи по типу и дате
    const filteredEntries = allEntries.filter(entry => {
        if (entry.type !== 'diary' || entry.isDraft) return false;

        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
    });

    // Формируем данные для экспорта
    filteredEntries.forEach(entry => {
        const data = entry.data;

        // Форматируем взвешивания
        let weighingsText = '';
        if (data.weighings && data.weighings.length > 0) {
            weighingsText = data.weighings.map(w =>
                `${w.weight} кг${w.condition ? ` (${w.condition})` : ''}`
            ).join('; ');
        } else if (data.weight) {
            weighingsText = `${data.weight} кг${data.weightCondition ? ` (${data.weightCondition})` : ''}`;
        }

        // Форматируем сон
        let sleepDuration = '';
        if (data.sleepHours || data.sleepMinutes) {
            sleepDuration = `${data.sleepHours || 0}ч ${data.sleepMinutes || 0}м`;
        } else if (data.sleepDuration) {
            sleepDuration = data.sleepDuration;
        }

        // Создаем запись для экспорта
        exportData.push({
            Дата: entry.date,
            Пульс: data.pulse || '',
            Сон: sleepDuration,
            'Уровень энергии': data.energyLevel || '',
            'Взвешивания': weighingsText,
            Шаги: data.steps || '',
            Калории: data.calories || '',
            Алкоголь: data.alcohol || '',
            Тренировка: data.workout || '',
            RPE: data.rpe || '',
            Настроение: data.mood || '',
            Заметки: data.notes || ''
        });
    });

    return exportData;
}

function prepareWorkoutData(dataManager, range) {
    const dateRange = getDateRange(range);
    if (!dateRange) return [];

    const { startDate, endDate } = dateRange;
    const exportData = [];

    // Получаем все записи через DataManager
    const allEntries = dataManager.getAllEntries();

    // Фильтруем записи по типу и дате
    const filteredEntries = allEntries.filter(entry => {
        if (entry.type !== 'training' || entry.isDraft) return false;

        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
    });

    // Формируем данные для экспорта
    filteredEntries.forEach(entry => {
        const exercise = entry.data;

        // Рассчитываем показатели для упражнения
        let setsText = '';
        let best1RM = 0;
        let totalVolume = 0;
        let bestSetIndex = 0;
        let bestSetValue = 0;

        exercise.sets?.forEach((set, index) => {
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
        const bestSet = exercise.sets?.[bestSetIndex];
        let bestSetText = '';
        if (bestSet) {
            const bestEffectiveWeight = bestSet.perLimb ? bestSet.weight * 2 : bestSet.weight;
            bestSetText = `${bestEffectiveWeight} кг × ${bestSet.reps}`;
        }

        // Создаем запись для каждого упражнения
        exportData.push({
            Дата: entry.date,
            Упражнение: exercise.name,
            Подходы: setsText,
            'Лучший подход': bestSetText,
            '1ПМ (расч.)': best1RM.toFixed(1),
            'Общий объем': totalVolume.toFixed(1),
            RPE: exercise.rpe || ''
        });
    });

    return exportData;
}

async function handleFileImport(event, dataManager) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const workbook = XLSX.read(await file.arrayBuffer());
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
            alert('Файл не содержит данных для импорта');
            return;
        }

        // Определяем тип данных по структуре
        const isHealthData = 'Пульс' in jsonData[0];
        const isWorkoutData = 'Упражнение' in jsonData[0];

        if (!isHealthData && !isWorkoutData) {
            alert('Неподдерживаемый формат данных');
            return;
        }

        // Преобразование данных
        const entries = [];
        const dateRegex = /(\d{4})-(\d{2})-(\d{2})/;

        jsonData.forEach(row => {
            const date = row['Дата'] || '';

            if (!date) return;

            if (isHealthData) {
                // Преобразование данных дневника
                entries.push({
                    date,
                    type: 'diary',
                    data: {
                        pulse: row['Пульс'] || '',
                        sleepDuration: row['Сон'] || '',
                        energyLevel: row['Уровень энергии'] || '',
                        weighings: parseWeighings(row['Взвешивания'] || ''),
                        steps: row['Шаги'] || '',
                        calories: row['Калории'] || '',
                        alcohol: row['Алкоголь'] || '',
                        workout: row['Тренировка'] || '',
                        rpe: row['RPE'] || '',
                        mood: row['Настроение'] || '',
                        notes: row['Заметки'] || ''
                    },
                    isDraft: false,
                    version: 1
                });
            } else {
                // Преобразование данных тренировок
                entries.push({
                    date,
                    type: 'training',
                    data: {
                        name: row['Упражнение'] || '',
                        sets: parseSets(row['Подходы'] || ''),
                        rpe: row['RPE'] || ''
                    },
                    isDraft: false,
                    version: 1
                });
            }
        });

        // Сохранение данных
        dataManager.bulkAddEntries(entries);
        alert(`Успешно импортировано ${entries.length} записей`);

        // Обновляем UI
        if (typeof loadHistoryData === 'function') {
            loadHistoryData(dataManager);
        }

    } catch (error) {
        console.error('Ошибка импорта:', error);
        alert('Ошибка при обработке файла: ' + error.message);
    }
}

function parseWeighings(weighingsText) {
    if (!weighingsText) return [];

    return weighingsText.split(';').map(item => {
        item = item.trim();
        if (!item) return null;

        // Улучшенное регулярное выражение
        const match = item.match(/([\d.,]+)\s*кг\s*(?:\((.*?)\))?/);

        if (match) {
            // Замена запятых на точки для чисел
            const weightValue = parseFloat(match[1].replace(',', '.'));
            return {
                weight: weightValue,
                condition: match[2] || ''
            };
        }

        // Попытка извлечь только число
        const weightMatch = item.match(/[\d.,]+/);
        return weightMatch ? {
            weight: parseFloat(weightMatch[0].replace(',', '.')),
            condition: ''
        } : null;
    }).filter(Boolean);
}

function parseSets(setsText) {
    if (!setsText) return [];

    return setsText.split(';').map(item => {
        item = item.trim();
        if (!item) return null;

        // Улучшенное регулярное выражение
        const match = item.match(/(?:Подход\s*\d+:\s*)?([\d.,]+)\s*кг?\s*[×x]\s*(\d+)(\s*на конечность)?/i);

        if (match) {
            return {
                weight: parseFloat(match[1].replace(',', '.')),
                reps: parseInt(match[2]),
                perLimb: !!match[3]
            };
        }

        // Альтернативные форматы
        const altMatch = item.match(/([\d.,]+)\s*\/\s*(\d+)/);
        return altMatch ? {
            weight: parseFloat(altMatch[1].replace(',', '.')),
            reps: parseInt(altMatch[2]),
            perLimb: false
        } : null;
    }).filter(Boolean);
}
