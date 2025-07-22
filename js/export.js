export function initExport() {
    const exportBtn = document.getElementById('export-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', exportToExcel);

    addExportControls();
}

function addExportControls() {
    const exportSection = document.createElement('div');
    exportSection.innerHTML = `
        <h3>Экспорт данных</h3>
        <select id="export-type">
            <option value="health">Дневник</option>
            <option value="workout">Тренировки</option>
        </select>
        <select id="export-range">
            <option value="current-week">Текущая неделя</option>
            <option value="last-week">Прошлая неделя</option>
            <option value="all">Все данные</option>
            <option value="custom">Выбрать период</option>
        </select>
        <div id="custom-dates" style="display:none">
            <input type="date" id="start-date">
            <input type="date" id="end-date">
        </div>
        <button id="export-btn">Экспорт в Excel</button>
    `;
    document.getElementById('history').appendChild(exportSection);

    document.getElementById('export-range').addEventListener('change', (e) => {
        document.getElementById('custom-dates').style.display =
            e.target.value === 'custom' ? 'block' : 'none';
    });

    document.getElementById('export-btn').addEventListener('click', exportToExcel);
}

function exportToExcel() {
    const type = document.getElementById('export-type').value;
    const range = document.getElementById('export-range').value;

    let data, worksheetName;

    if(type === 'health') {
        data = prepareHealthData(range);
        worksheetName = "Дневник";
    } else {
        data = prepareWorkoutData(range);
        worksheetName = "Тренировки";
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, worksheetName);
    XLSX.writeFile(wb, `health_export_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function prepareHealthData(range) {
    // Фильтрация данных по выбранному диапазону
    // Преобразование в формат для Excel
}

function prepareWorkoutData(range) {
    // Аналогичная обработка для тренировок
}
