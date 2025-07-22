// Форматирование даты
export function formatDate(date, options = {}) {
    const defaultOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('ru-RU', { ...defaultOptions, ...options });
}

// Генератор уникальных ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Текстовые представления
export function getAlcoholText(value) {
    const texts = {
        'no': 'Нет',
        'little': 'Мало (1-2 порции)',
        'medium': 'Умеренно (3-4 порции)',
        'much': 'Много (5+ порций)'
    };
    return texts[value] || value;
}

export function getWorkoutText(value) {
    const texts = {
        'none': 'Нет',
        'light': 'Легкая',
        'medium': 'Средняя',
        'hard': 'Интенсивная'
    };
    return texts[value] || value;
}

export function getMoodText(value) {
    const texts = {
        'excellent': 'Отличное 😄',
        'good': 'Хорошее 🙂',
        'normal': 'Нормальное 😐',
        'bad': 'Плохое 🙁',
        'awful': 'Ужасное 😞'
    };
    return texts[value] || value;
}

export function moodToNumber(mood) {
    const map = {
        'awful': 1,
        'bad': 2,
        'normal': 3,
        'good': 4,
        'excellent': 5
    };
    return map[mood] || 3;
}

export function activateTab(tabId) {
    try {
        // Проверяем существование вкладки
        const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
        const content = document.getElementById(tabId);

        if (!tab || !content) {
            console.error(`Вкладка ${tabId} не найдена`);
            return;
        }

        // Убираем активные классы
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Добавляем активные классы
        tab.classList.add('active');
        content.classList.add('active');
    } catch (e) {
        console.error('Ошибка активации вкладки:', e);
    }
}

export function initTabs() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            if (!tabId) return; // Проверка наличия data-tab

            // Находим контент вкладки
            const tabContent = document.getElementById(tabId);
            if (!tabContent) {
                console.error(`Вкладка с id ${tabId} не найдена`);
                return;
            }

            // Убираем активные классы
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Добавляем активные классы
            this.classList.add('active');
            tabContent.classList.add('active');
        });
    });

    // Активируем первую вкладку при загрузке
    const firstTab = document.querySelector('.tab');
    if (firstTab) {
        firstTab.classList.add('active');
        const firstTabId = firstTab.dataset.tab;
        if (firstTabId) {
            const firstContent = document.getElementById(firstTabId);
            if (firstContent) firstContent.classList.add('active');
        }
    }
}

export function confirmAction(message) {
    return window.confirm(message || 'Вы уверены?');
}
