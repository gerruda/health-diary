// theme.js
export function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const systemTheme = detectSystemTheme();
    const savedTheme = localStorage.getItem('theme');
    const currentTheme = savedTheme || systemTheme;

    // Применяем тему при загрузке
    applyTheme(currentTheme);
    updateThemeIcon(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark'
                ? 'light'
                : 'dark';

            applyTheme(newTheme);
            updateThemeIcon(newTheme);
            localStorage.setItem('theme', newTheme);
            applyImageFilter(newTheme); // Добавим обработку изображений
        });
    }

    // Слушатель изменений системной темы
    watchSystemTheme();
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    applyImageFilter(theme); // Фильтр для изображений
    applyMoodColors(theme);  // Обновляем цвета настроения
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    themeToggle.innerHTML = theme === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';

    themeToggle.title = theme === 'dark'
        ? 'Переключить на светлую тему'
        : 'Переключить на темную тему';
}

function detectSystemTheme() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            updateThemeIcon(newTheme);
        }
    });
}

// === НОВЫЕ ФУНКЦИИ ===
function applyImageFilter(theme) {
    document.querySelectorAll('img:not(.no-filter), svg:not(.no-filter)').forEach(el => {
        el.style.filter = theme === 'dark' ? 'invert(0.85) brightness(0.9)' : 'none';
    });
}

function applyMoodColors(theme) {
    const moodElements = document.querySelectorAll('.mood-indicator');
    moodElements.forEach(el => {
        const moodType = el.dataset.mood;
        if (theme === 'dark') {
            el.style.backgroundColor = getDarkMoodColor(moodType);
        } else {
            el.style.backgroundColor = ''; // Возвращаем светлые цвета из CSS
        }
    });
}

function getDarkMoodColor(moodType) {
    const darkMoodColors = {
        '1': '#0d47a1', // Синий
        '2': '#1b5e20', // Зеленый
        '3': '#f57f17', // Оранжевый
        '4': '#b71c1c'  // Красный
    };
    return darkMoodColors[moodType] || '#333';
}
