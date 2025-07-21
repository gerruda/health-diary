export function initHistory() {
    const historyDateEl = document.getElementById('history-date');
    if (!historyDateEl) return;

    // Установка текущей даты
    historyDateEl.valueAsDate = new Date();

    // Загрузка данных
    loadHistoryData(new Date());

    // Обработчик изменения даты
    historyDateEl.addEventListener('change', () => {
        loadHistoryData(new Date(historyDateEl.value));
    });
}

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
      
      ${entry.weights ? `
      <div class="data-item full-width">
        <span class="data-label">Взвешивания:</span>
        <div class="weight-history">
          ${entry.weights.map(w => `
            <div>${w.value} кг${w.condition ? ` (${w.condition})` : ''}</div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    ${workoutHistory[dateStr] ? `
      <div class="data-item full-width">
        <span class="data-label">Тренировка:</span>
        <div class="workout-history">
          ${workoutHistory[dateStr].map(ex => `
            <div class="exercise-history">
              <div class="ex-name">${ex.name}${ex.rpe ? ` (RPE: ${ex.rpe})` : ''}</div>
              ${ex.sets.map((set, i) => `
                <div class="ex-set">Подход ${i + 1}: ${set.weight} кг × ${set.reps}</div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
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
