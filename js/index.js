// js/index.js

// Защита страницы (если не вошел — кидаем на логин)
if (!DB.getCurrentUser()) location.href = 'login.html';

// 1. Функция для отрисовки статистики
function renderStats(routes) {
  const points = routes.reduce((s, r) => s + r.points.length, 0);
  const budget = routes.reduce((s, r) => s + r.budget, 0);
  const spent = routes.reduce((s, r) => s + r.points.reduce((a, p) => a + p.cost, 0), 0);

  const statsEl = document.getElementById('stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat"><div class="stat__value">${routes.length}</div><div class="stat__label">Маршрутов</div></div>
      <div class="stat"><div class="stat__value">${points}</div><div class="stat__label">Точек</div></div>
      <div class="stat"><div class="stat__value">${fmtMoney(budget)}</div><div class="stat__label">Бюджет</div></div>
      <div class="stat"><div class="stat__value">${fmtMoney(spent)}</div><div class="stat__label">Потрачено</div></div>
    `;
  }
}

// 2. Функция для отрисовки карточек маршрутов
function renderRoutes() {
  const routes = DB.getRoutes();
  renderStats(routes);
  
  const grid = document.getElementById('grid');
  if (!grid) return;

  if (!routes.length) {
    grid.innerHTML = `<div class="empty" style="grid-column: 1/-1;">
      <div class="empty__icon">✈️</div>
      <h3>Небо пусто — пора в путь!</h3>
      <p>Нажмите «Новый маршрут», чтобы начать планирование</p>
    </div>`;
    return;
  }

  grid.innerHTML = routes.map(r => {
    const spent = r.points.reduce((s, p) => s + p.cost, 0);
    
    const title = (r.title || '').toLowerCase();
    let emoji = '🗺️';
    let bg = 'linear-gradient(135deg, #0ea5e9, #8b5cf6)';
    
    if (/питер|спб|петербург/.test(title)) { emoji = '🌉'; bg = 'linear-gradient(135deg, #0e7490, #164e63)'; }
    if (/москв|мск|кремль/.test(title)) { emoji = '🏛️'; bg = 'linear-gradient(135deg, #b91c1c, #7f1d1d)'; }
    if (/сочи|море|пляж/.test(title)) { emoji = '🏖️'; bg = 'linear-gradient(135deg, #0891b2, #06b6d4)'; }
    if (/горы|алтай|кавказ/.test(title)) { emoji = '🏔️'; bg = 'linear-gradient(135deg, #475569, #1e293b)'; }

    return `
      <div class="card">
        <div class="card-visual" style="background: ${bg}">
          <div class="card-visual__emoji">${emoji}</div>
        </div>
        <div class="card-body">
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.description) || 'Без описания'}</p>
          <div class="card-meta">
            <span>📍 ${r.points.length} точек</span>
            <span>💰 ${fmtMoney(spent)}</span>
          </div>
          <div class="card-actions">
            <a class="btn btn--sm" href="route.html?id=${r.id}">Открыть</a>
            <button class="btn btn--sm btn--danger" onclick="deleteRouteHandler('${r.id}')">Удалить</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 3. Удаление маршрута
window.deleteRouteHandler = function(id) {
  if (confirm('Вы уверены, что хотите удалить этот маршрут?')) {
    DB.deleteRoute(id);
    if (typeof toast === 'function') toast('Маршрут удален', 'success');
    renderRoutes();
  }
};

// 4. Быстрое создание из рекламы (Сочи, Питер и т.д.)
window.quickCreate = function(title, desc) {
  const form = document.getElementById('form');
  if (!form) return;
  
  form.reset();
  form.elements['title'].value = title;
  form.elements['description'].value = desc;
  
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('open');
  
  if (typeof toast === 'function') toast('Направление выбрано! ✈️', 'success');
};

// 5. Обработчики кнопок и модалки (с защитой от ошибок)
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const addBtn = document.getElementById('addBtn');
  const form = document.getElementById('form');

  // Открытие по кнопке "Новый маршрут"
  if (addBtn && modal) {
    addBtn.addEventListener('click', () => {
      if (form) form.reset(); // Очищаем форму перед открытием
      modal.classList.add('open');
    });
  }

  // Закрытие по клику на пустую область
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

   // Обработка кнопки "Создать"
   if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault(); 
      
      const data = Object.fromEntries(new FormData(form));
      
      if (!data.title || data.title.trim() === '') {
        if (typeof toast === 'function') toast('Введите название!', 'error');
        return;
      }

      try {
        const route = DB.createRoute(data);
        
        if (modal) modal.classList.remove('open');
        form.reset();
        
        if (typeof toast === 'function') toast('Маршрут создан ✈️', 'success');
        if (typeof confetti === 'function') confetti();
        
        setTimeout(() => {
          location.href = `route.html?id=${route.id}`;
        }, 500);
        
      } catch (err) {
        console.error("ОШИБКА:", err);
        if (typeof toast === 'function') toast('Ошибка: ' + err.message, 'error');
      }
    });
  }

  // Запускаем отрисовку
  renderRoutes();
});