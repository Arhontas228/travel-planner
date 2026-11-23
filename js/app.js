const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function fmtMoney(n) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('ru-RU');
}

function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);
}

function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));
}

// Тема
function initTheme() {
  const saved = localStorage.getItem('tp_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tp_theme', next);
  updateThemeBtn(next);
}
function updateThemeBtn(theme) {
  const btn = $('.theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Конфетти
function confetti() {
  const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.style.cssText = `position:fixed;top:-20px;left:${Math.random()*100}vw;width:10px;height:10px;background:${colors[i%5]};border-radius:${Math.random()>.5?'50%':'2px'};z-index:9999;pointer-events:none;transition:transform 2s ease-out,top 2s ease-out,opacity 2s;`;
    document.body.appendChild(c);
    requestAnimationFrame(() => {
      c.style.top = '110vh';
      c.style.transform = `translateX(${(Math.random()-.5)*300}px) rotate(${Math.random()*720}deg)`;
      c.style.opacity = '0';
    });
    setTimeout(() => c.remove(), 2500);
  }
}

// Шапка
function renderHeader() {
  const user = DB.getCurrentUser();
  const nav = $('.nav');
  if (!nav) return;
  
  if (user) {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = 'Выйти';
    a.onclick = (e) => { e.preventDefault(); DB.logout(); location.href = 'login.html'; };
    nav.appendChild(a);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderHeader();
  $('.theme-btn')?.addEventListener('click', toggleTheme);
});