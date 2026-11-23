// js/route.js
if (!DB.getCurrentUser()) location.href = 'login.html';

const routeId = getParam('id');
let currentRoute = DB.getRoute(routeId);
let map = null; // Переменная для карты

if (!currentRoute) {
  document.getElementById('app').innerHTML = `
    <div class="empty" style="margin-top:40px">
      <div class="empty__icon">🤷</div>
      <h3>Маршрут не найден</h3>
      <a href="index.html" class="btn" style="margin-top:16px">Вернуться на главную</a>
    </div>`;
  throw new Error("Маршрут не найден");
}

// Отрисовка страницы
function renderPage() {
  currentRoute = DB.getRoute(routeId); // Обновляем данные
  const spent = currentRoute.points.reduce((s, p) => s + p.cost, 0);
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1 class="page-title" style="margin-top:20px">${escapeHtml(currentRoute.title)}</h1>
    <p class="page-subtitle">${escapeHtml(currentRoute.description) || 'Без описания'}</p>

    <div class="stats">
      <div class="stat"><div class="stat__value">${currentRoute.points.length}</div><div class="stat__label">Точек</div></div>
      <div class="stat"><div class="stat__value">${fmtMoney(currentRoute.budget)}</div><div class="stat__label">Бюджет</div></div>
      <div class="stat"><div class="stat__value">${fmtMoney(spent)}</div><div class="stat__label">Потрачено</div></div>
    </div>

    <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap">
      <button class="btn" onclick="openPointModal()">📍 Добавить точку</button>
      <button class="btn btn--ghost" onclick="exportJSON()">⬇️ Скачать JSON</button>
      <button class="btn btn--ghost" onclick="exportPDF()">🖨️ Сохранить в PDF</button>
    </div>

    <div id="map"></div>

    <h2 style="margin-top:30px; margin-bottom:16px">Список точек</h2>
    <div class="timeline" id="pointsList"></div>
  `;

  renderPoints();
  initMap();
}

// Отрисовка списка точек
function renderPoints() {
  const list = document.getElementById('pointsList');
  
  if (!currentRoute.points.length) {
    list.innerHTML = `<p style="color:var(--muted)">Точек пока нет. Добавьте первую!</p>`;
    return;
  }

  list.innerHTML = currentRoute.points.map(p => `
    <div class="point ${p.done ? 'done' : ''}">
      <div class="point__head">
        <div>
          <div class="point__title">${escapeHtml(p.name)}</div>
          <div class="point__meta">
            ${p.time ? `<span>🕒 ${p.time}</span>` : ''}
            ${p.cost ? `<span>💰 ${fmtMoney(p.cost)}</span>` : ''}
            ${p.lat && p.lng ? `<span>🗺️ На карте</span>` : ''}
          </div>
          ${p.note ? `<p style="font-size:0.9rem; margin-top:8px; color:var(--muted)">📝 ${escapeHtml(p.note)}</p>` : ''}
        </div>
        <div class="point__actions">
          <button class="btn btn--sm btn--ghost" onclick="togglePoint('${p.id}')" title="Отметить пройденной">${p.done ? '↩️' : '✅'}</button>
          <button class="btn btn--sm btn--danger" onclick="deletePoint('${p.id}')">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Инициализация и обновление карты Leaflet
function initMap() {
  if (typeof L === 'undefined') return; // Если Leaflet не загрузился

  // Если карта уже есть, удаляем её перед перерисовкой
  if (map) {
    map.remove();
  }

  // Создаем карту
  map = L.map('map').setView([55.751244, 37.618423], 3); // Центр — Москва

  // Используем надежный сервер тайлов (без ошибок 403)
  L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap France',
    maxZoom: 19
  }).addTo(map);

  const pointsWithCoords = currentRoute.points.filter(p => p.lat && p.lng);
  const coords = [];

  // Добавляем маркеры
  pointsWithCoords.forEach((p, i) => {
    const marker = L.marker([p.lat, p.lng]).addTo(map);
    marker.bindPopup(`<b>${i + 1}. ${escapeHtml(p.name)}</b><br>${p.note || ''}`);
    coords.push([p.lat, p.lng]);
  });

  // Рисуем линию маршрута, если точек 2 и больше
  if (coords.length > 1) {
    L.polyline(coords, { color: '#0ea5e9', weight: 4, dashArray: '5, 10' }).addTo(map);
  }

  // Автоматически центрируем карту так, чтобы влезли все точки
  if (coords.length > 0) {
    map.fitBounds(coords, { padding: [50, 50], maxZoom: 15 });
  }
}

// Модалка
function openPointModal() {
  const modal = document.getElementById('pointModal');
  modal.classList.add('open');
}

// Добавление точки
document.getElementById('pointForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  
  DB.addPoint(routeId, data);
  document.getElementById('pointModal').classList.remove('open');
  e.target.reset();
  
  toast('Точка добавлена 📍');
  renderPage(); // Перерисовываем страницу (и карту)
});

// Вспомогательные функции
window.togglePoint = (pointId) => {
  DB.togglePoint(routeId, pointId);
  renderPage();
};

window.deletePoint = (pointId) => {
  if (confirm('Удалить точку?')) {
    DB.deletePoint(routeId, pointId);
    renderPage();
  }
};

// Экспорт в JSON
window.exportJSON = () => {
  const data = JSON.stringify(currentRoute, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Маршрут_${currentRoute.title}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Экспорт в PDF (через печать браузера)
window.exportPDF = () => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${escapeHtml(currentRoute.title)}</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:auto}
    h1{color:#0ea5e9} .point{border-left:3px solid #0ea5e9;padding-left:15px;margin:20px 0}
    .meta{color:#666;font-size:14px;margin-top:5px}</style></head>
    <body>
      <h1>${escapeHtml(currentRoute.title)}</h1>
      <p>${escapeHtml(currentRoute.description) || ''}</p>
      <h3>Точки маршрута:</h3>
      ${currentRoute.points.map((p, i) => `
        <div class="point">
          <b>${i + 1}. ${escapeHtml(p.name)}</b>
          <div class="meta">${p.time ? '🕒 '+p.time : ''} ${p.cost ? ' | 💰 '+fmtMoney(p.cost) : ''}</div>
          <p>${escapeHtml(p.note) || ''}</p>
        </div>
      `).join('')}
      <script>window.onload = () => window.print()<\/script>
    </body></html>
  `);
  win.document.close();
};

// Запуск
renderPage();