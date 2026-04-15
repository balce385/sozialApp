// Dark Mode – wird von index.html und research.html geladen

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? '1' : '0');
  updateDarkBtn(isDark);
}

function updateDarkBtn(isDark) {
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// Beim Laden: gespeicherte Einstellung anwenden
(function () {
  const dark = localStorage.getItem('darkMode') === '1';
  if (dark) document.body.classList.add('dark');
  document.addEventListener('DOMContentLoaded', () => updateDarkBtn(dark));
})();
