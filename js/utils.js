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

export function initTabs() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Удаляем активный класс у всех вкладок
            tabs.forEach(t => t.classList.remove('active'));

            // Скрываем все содержимое вкладок
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Добавляем активный класс текущей вкладке
            this.classList.add('active');

            // Показываем соответствующее содержимое
            const tabId = this.getAttribute('data-tab');
            const contentId = tabId + '-tab';
            const content = document.getElementById(contentId);

            if (content) {
                content.classList.add('active');
            }
        });
    });

    // Активируем первую вкладку по умолчанию
    if (tabs.length > 0) {
        tabs[0].click();
    }
}

export function activateTab(tabId) {
    // Активация выбранной вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if(tab.dataset.tab === tabId) {
            tab.classList.add('active');
        }
    });
}

// export function activateTab(tabId) {
//     // Скрыть все вкладки
//     document.querySelectorAll('.tab-content').forEach(tab => {
//         tab.classList.remove('active');
//     });
//
//     // Показать нужную вкладку
//     const targetTab = document.getElementById(tabId);
//     if (targetTab) {
//         targetTab.classList.add('active');
//     }
//
//     // Обновить активное состояние кнопок вкладок
//     document.querySelectorAll('.tab').forEach(tab => {
//         tab.classList.toggle('active', tab.dataset.tab === tabId);
//     });
// }

