// js/db.js
const DB = {
  // --- Пользователи ---
  getUsers() {
    return JSON.parse(localStorage.getItem('tp_users') || '[]');
  },
  saveUsers(u) {
    localStorage.setItem('tp_users', JSON.stringify(u));
  },
  
  register(name, email, password) {
    const users = DB.getUsers();
    if (users.find(u => u.email === email)) return { error: 'Email уже занят' };
    const user = { id: crypto.randomUUID(), name, email, password: btoa(password) };
    users.push(user);
    DB.saveUsers(users);
    return { user };
  },
  
  login(email, password) {
    const users = DB.getUsers();
    const u = users.find(x => x.email === email);
    if (!u || u.password !== btoa(password)) return { error: 'Неверный email или пароль' };
    localStorage.setItem('tp_currentUser', JSON.stringify({ id: u.id, name: u.name, email: u.email }));
    return { user: u };
  },
  
  logout() {
    localStorage.removeItem('tp_currentUser');
  },
  
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('tp_currentUser') || 'null');
  },
  
  // --- Ключи для маршрутов (привязка к юзеру) ---
  _key(base) {
    const u = DB.getCurrentUser();
    return u ? `${base}_${u.id}` : base;
  },

  // --- Маршруты ---
  getRoutes() {
    return JSON.parse(localStorage.getItem(DB._key('tp_routes')) || '[]');
  },
  
  saveRoutes(r) {
    localStorage.setItem(DB._key('tp_routes'), JSON.stringify(r));
  },
  
  getRoute(id) {
    return DB.getRoutes().find(r => r.id === id);
  },
  
  createRoute(data) {
    const routes = DB.getRoutes();
    
    // Безопасная генерация уникального ID
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    };

    const route = {
      id: generateId(),
      title: data.title || 'Без названия',
      description: data.description || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      budget: Number(data.budget) || 0,
      points: []
    };
    
    routes.push(route);
    DB.saveRoutes(routes);
    return route;
  },
  
  deleteRoute(id) {
    DB.saveRoutes(DB.getRoutes().filter(r => r.id !== id));
  },

  updateRoute(id, patch) {
    const routes = DB.getRoutes();
    const i = routes.findIndex(r => r.id === id);
    if (i > -1) {
      routes[i] = { ...routes[i], ...patch };
      DB.saveRoutes(routes);
    }
  },
  
  // --- Точки (для страницы маршрута) ---
  addPoint(routeId, point) {
    const route = DB.getRoute(routeId);
    if (!route) return;
    route.points.push({
      id: crypto.randomUUID ? crypto.randomUUID() : 'p-'+Date.now(),
      name: point.name,
      time: point.time || '',
      cost: Number(point.cost) || 0,
      note: point.note || '',
      lat: point.lat ? Number(point.lat) : null,
      lng: point.lng ? Number(point.lng) : null,
      done: false
    });
    DB.updateRoute(routeId, { points: route.points });
  },
  
  deletePoint(routeId, pointId) {
    const route = DB.getRoute(routeId);
    if (!route) return;
    route.points = route.points.filter(p => p.id !== pointId);
    DB.updateRoute(routeId, { points: route.points });
  },
  
  togglePoint(routeId, pointId) {
    const route = DB.getRoute(routeId);
    if (!route) return;
    const p = route.points.find(x => x.id === pointId);
    if (p) p.done = !p.done;
    DB.updateRoute(routeId, { points: route.points });
  }
};