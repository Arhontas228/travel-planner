function doLogin() {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    if (!email || !pass) return toast('Заполните все поля', 'error');
    
    const res = DB.login(email, pass);
    if (res.error) return toast(res.error, 'error');
    
    toast('Добро пожаловать!');
    setTimeout(() => location.href = 'index.html', 500);
  }
  
  function doRegister() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    if (!name || !email || !pass) return toast('Заполните все поля', 'error');
    if (pass.length < 4) return toast('Пароль слишком короткий', 'error');
    
    const res = DB.register(name, email, pass);
    if (res.error) return toast(res.error, 'error');
    
    DB.login(email, pass);
    toast('Аккаунт создан!');
    setTimeout(() => location.href = 'index.html', 500);
  }