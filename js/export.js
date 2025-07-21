import { getHealthData, getWorkoutHistory } from './storage.js';

export function initExport() {
    const exportBtn = document.getElementById('export-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', exportToExcel);
}

function exportToExcel() {
    const healthData = getHealthData();
    const workoutHistory = getWorkoutHistory();
}
