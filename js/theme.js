document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
});

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle__icon');
    if (!icon) return;
    
    if (theme === 'dark') {
        icon.textContent = '☀️';
    } else {
        icon.textContent = '🌙';
    }
}