// theme.js
export function initTheme() {
    const systemTheme = detectSystemTheme();
    if (!localStorage.getItem('theme')) {
        applyTheme(systemTheme);
        updateThemeIcon(systemTheme);
    }

    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Применяем сохраненную тему
    applyTheme(currentTheme);

    if (themeToggle) {
        // Обновляем иконку
        updateThemeIcon(currentTheme);

        // Обработчик переключения
        themeToggle.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark'
                ? 'light'
                : 'dark';

            applyTheme(newTheme);
            updateThemeIcon(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    if (theme === 'dark') {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        themeToggle.title = 'Переключить на светлую тему';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.title = 'Переключить на темную тему';
    }
}

function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}
