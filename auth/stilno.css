// =========================================================================
// БЛОК 1: КОНСТАНТЫ СЕССИИ И НАМЕРТВО ФИКСИРОВАННОЕ ХРАНИЛИЩЕ ПАРОЛЕЙ
// =========================================================================

// Защитный редирект Vercel: если сессия уже активна — отправляем в меню автоматически
if (localStorage.getItem('isAuth') === 'true') {
    window.location.href = '../menu/'; 
}

const USERS_STORAGE_KEY = 'qa_platform_modified_users';
let activeUserBase = [];

// Инициализация базы данных: проверяем, менял ли кто-то пароли ранее на этом устройстве
if (typeof mockUserBase !== 'undefined') {
    const savedModifiedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedModifiedUsers) {
        // Если в браузере есть сохраненный массив с новыми паролями — берем его
        activeUserBase = JSON.parse(savedModifiedUsers);
    } else {
        // Если запуск первый раз — берем исходный массив сотрудников
        activeUserBase = mockUserBase;
    }
} else {
    console.error("Критическая ошибка: Файл базы данных mockUserBase (users.js) не подключен!");
}

// =========================================================================
// БЛОК 2: ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА И УПРАВЛЕНИЕ 3D FLIP КАРТОЧКОЙ
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const flipper = document.getElementById('flipper') || document.querySelector('.card-flipper');
    const toResetBtn = document.getElementById('to-reset');
    const toLoginBtn = document.getElementById('to-login');
    
    // Элементы формы Входа (Лицевая сторона)
    const userIdInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Элементы формы Смены пароля (Изнаночная сторона)
    const resetUserIdInput = document.getElementById('user-id') || document.getElementById('resetUserId') || document.querySelector('input[readonly]');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const resetForm = document.getElementById('resetForm') || document.querySelector('.card-back form');
    const resetErrorMessage = document.getElementById('resetErrorMessage') || document.getElementById('errorMessageBack');

    // Анимация перехода на смену пароля (Поворот на 180 градусов по оси Y)
    if (toResetBtn && flipper) {
        toResetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            flipper.classList.add('flipped');
            
            // Дублируем введенный ID на скрытую сторону в заблокированный инпут
            if (userIdInput && userIdInput.value.trim() !== "") {
                if (resetUserIdInput) resetUserIdInput.value = userIdInput.value.trim();
            } else {
                if (resetUserIdInput) resetUserIdInput.value = "НЕ УКАЗАН";
            }
        });
    }

    // Возврат к стандартному окну входа (Лицо карточки)
    if (toLoginBtn && flipper) {
        toLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            flipper.classList.remove('flipped');
            if (resetErrorMessage) resetErrorMessage.style.display = 'none';
        });
    }

        // =========================================================================
    // БЛОК 3: ЛОГИКА АВТОРИЗАЦИИ ПОЛЬЗОВАТЕЛЕЙ (ВХОД В СИСТЕМУ)
    // =========================================================================
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!userIdInput || !passwordInput) return;
            const idInput = userIdInput.value.trim();
            const enteredPassword = passwordInput.value;
            
            if (activeUserBase.length > 0) {
                // Ищем сотрудника в живой базе данных (учитывая измененные пароли)
                const user = activeUserBase.find(u => String(u.id) === idInput);
                
                if (user && user.password === enteredPassword) {
                    // Записываем сессию и параметры сотрудника фабрики в localStorage
                    localStorage.setItem('isAuth', 'true');
                    localStorage.setItem('userId', idInput);
                    localStorage.setItem('userFirstName', user.firstName);
                    localStorage.setItem('userLastName', user.lastName);
                    localStorage.setItem('userPosition', user.position); // Admin / SysAdmin / User
                    localStorage.setItem('userBranch', user.branch);
                    localStorage.setItem('userShift', user.shift);
                    localStorage.setItem('userCompany', user.company);
                    
                    if (errorMessage) errorMessage.style.display = 'none';
                    
                    // Безопасный относительный путь роутинга для серверов Vercel (без .html)
                    window.location.href = '../menu/';
                } else {
                    // Включаем красную неоновую лампу ошибки
                    if (errorMessage) errorMessage.style.display = 'block';
                }
            } else {
                alert("Системная ошибка: База данных сотрудников пуста или недоступна.");
            }
        });
    }

        // =========================================================================
    // БЛОК 4: ИСТИННАЯ СМЕНА ПАРОЛЯ В РЕАЛЬНОМ ВРЕМЕНИ ДЛЯ VERCEL
    // =========================================================================
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!resetUserIdInput || !currentPasswordInput || !newPasswordInput || !confirmPasswordInput) return;
            
            const idInput = resetUserIdInput.value.trim();
            const currentPass = currentPasswordInput.value;
            const newPass = newPasswordInput.value;
            const confirmPass = confirmPasswordInput.value;

            if (activeUserBase.length > 0) {
                const user = activeUserBase.find(u => String(u.id) === idInput);

                // Проверка 1: Существует ли пользователь и совпадает ли текущий пароль
                if (!user || user.password !== currentPass) {
                    showResetError("Текущий пароль введен неверно!");
                    return;
                }

                // Проверка 2: Совпадают ли новые пароли между собой
                if (newPass !== confirmPass) {
                    showResetError("Пароли не совпадают!");
                    return;
                }

                // Проверка 3: Защита от дублирования старого пароля
                if (currentPass === newPass) {
                    showResetError("Новый пароль совпадает с текущим!");
                    return;
                }

                // ПЕРЕЗАПИСЫВАЕМ ПАРОЛЬ ПО-НАСТОЯЩЕМУ:
                user.password = newPass; // Меняем внутри текущего массива в памяти
                
                // Фиксируем измененную базу сотрудников в локальной памяти браузера намертво
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(activeUserBase));
                
                if (resetErrorMessage) resetErrorMessage.style.display = 'none';
                alert("🎉 Пароль успешно изменен навсегда!\nКарточка возвращается на форму входа.");
                
                // Сбрасываем поля и разворачиваем карточку обратно на форму логина
                resetForm.reset();
                if (flipper) flipper.classList.remove('flipped');

            } else {
                alert("Ошибка модификации: база данных заблокирована.");
            }
        });
    }

    // Хелпер вывода неоновых ошибок на стороне смены пароля
    function showResetError(text) {
        if (resetErrorMessage) {
            resetErrorMessage.innerText = text;
            resetErrorMessage.style.display = 'block';
        }
    }
}); // Конец обработчика DOMContentLoaded

// =========================================================================
// ЧАСТЬ 2.1: ДИНАМИЧЕСКИЙ ИНЖЕКТОР ФОРМЫ РЕГИСТРАЦИИ В APP.JS
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const flipper = document.getElementById('flipper') || document.querySelector('.card-flipper');
    if (!flipper) return;

    // 1. Внедряем кнопку переключения на лицевую сторону
    const cardNav = document.querySelector('.card-front .card-nav');
    if (cardNav && !document.getElementById('to-register')) {
        const regLink = document.createElement('span');
        regLink.id = 'to-register';
        regLink.className = 'register-trigger-link';
        regLink.innerText = 'Регистрация';
        cardNav.appendChild(regLink);
    }

    // 2. Создаем структуру изнаночной стороны регистрации
    const registerCard = document.createElement('div');
    registerCard.className = 'login-card card-back';
    registerCard.style.transform = 'rotateY(-180deg)';
    
    registerCard.innerHTML = `
        <h2 class="register-title">Регистрация</h2>
        <form id="registerForm">
            <div class="register-scroll-area">
                <div style="margin-bottom:10px;">
                    <label>Табельный ID (Числа)</label>
                    <input type="number" id="reg-userId" placeholder="Например: 10010060" required>
                </div>
                <div style="margin-top:8px; margin-bottom:10px;">
                    <label>Имя сотрудника</label>
                    <input type="text" id="reg-firstName" placeholder="Имя..." required>
                </div>
                <div style="margin-top:8px; margin-bottom:10px;">
                    <label>Фамилия</label>
                    <input type="text" id="reg-lastName" placeholder="Фамилия..." required>
                </div>
                <div style="margin-top:8px; margin-bottom:10px;">
                    <label>Должность (Роль)</label>
                    <select id="reg-position" style="width:100%; padding:10px; background:rgba(0,0,0,0.45); color:#fff; border:1px solid rgba(16, 185, 129, 0.3); border-radius:6px; font-weight:700; outline:none;">
                        <option value="User">🧑‍🏭 Оператор линии</option>
                        <option value="Admin">👑 Главный технолог</option>
                        <option value="SysAdmin">⚙️ Помощник технолога</option>
                    </select>
                </div>
                <div style="margin-top:8px; margin-bottom:10px;">
                    <label>Фабрика</label>
                    <select id="reg-company" style="width:100%; padding:10px; background:rgba(0,0,0,0.45); color:#fff; border:1px solid rgba(16, 185, 129, 0.3); border-radius:6px; font-weight:700; outline:none;">
                        <option value="Mars">Mars</option>
                        <option value="Gradus">Gradus</option>
                    </select>
                </div>
                <div style="margin-top:8px; margin-bottom:10px;">
                    <label>Придумайте пароль</label>
                    <input type="password" id="reg-password" placeholder="Пароль..." required>
                </div>
            </div>
            <div id="registerErrorMessage" style="color:#ff3838; font-size:0.9rem; text-align:center; margin-bottom:10px; display:none; font-weight:700;"></div>
            <div class="neon-wrapper" style="box-shadow:0 0 15px rgba(16, 185, 129, 0.3); margin-top:5px;">
                <button type="submit" style="color:#10b981;">Создать аккаунт</button>
            </div>
            <div class="card-nav" style="padding-top:10px;">
                <span id="reg-to-login" style="font-size:1.1rem; color:rgba(16, 185, 129, 0.6);">← Вернуться ко входу</span>
            </div>
        </form>
    `;
    flipper.appendChild(registerCard);
});

// =========================================================================
// ЧАСТЬ 2.2: АНИМАЦИЯ ПЕРЕХОДОВ МЕЖДУ СТОРОНАМИ РЕГИСТРАЦИИ И ВХОДА
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const flipper = document.getElementById('flipper') || document.querySelector('.card-flipper');
    if (!flipper) return;

    // Ждём микропаузу, чтобы инжектированные элементы гарантированно появились в памяти
    setTimeout(() => {
        const toRegisterBtn = document.getElementById('to-register');
        const regToLoginBtn = document.getElementById('reg-to-login');
        const registerErrorMessage = document.getElementById('registerErrorMessage');

        if (toRegisterBtn) {
            toRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Разворачиваем карточку в противоположную сторону по оси Y
                flipper.style.transform = 'rotateY(-180deg)'; 
            });
        }

        if (regToLoginBtn) {
            regToLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                flipper.style.transform = ''; // Сбрасываем поворот в исходное положение (Лицо)
                if (registerErrorMessage) registerErrorMessage.style.display = 'none';
            });
        }
    }, 100);
});

// =========================================================================
// ЧАСТЬ 2.3: СЛУШАТЕЛЬ ФОРМЫ И ЖЕСТКАЯ ЗАПИСЬ СОТРУДНИКА В LOCALSTORAGE
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const registerForm = document.getElementById('registerForm');
        const registerErrorMessage = document.getElementById('registerErrorMessage');
        const flipper = document.getElementById('flipper') || document.querySelector('.card-flipper');

        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();

                const regId = document.getElementById('reg-userId').value.trim();
                const regFirstName = document.getElementById('reg-firstName').value.trim();
                const regLastName = document.getElementById('reg-lastName').value.trim();
                const regPosition = document.getElementById('reg-position').value;
                const regCompany = document.getElementById('reg-company').value;
                const regPassword = document.getElementById('reg-password').value;

                // Защита: проверяем, нет ли уже на заводе сотрудника с таким же табельным ID
                const isUserExists = activeUserBase.find(u => String(u.id) === regId);
                if (isUserExists) {
                    if (registerErrorMessage) {
                        registerErrorMessage.innerText = "❌ Данный ID уже зарегистрирован!";
                        registerErrorMessage.style.display = 'block';
                    }
                    return;
                }

                // Собираем объект сотрудника под стандарты mockUserBase
                const newEmployee = {
                    "id": parseInt(regId),
                    "password": regPassword,
                    "firstName": regFirstName,
                    "lastName": regLastName,
                    "position": regPosition,  
                    "branch": regPosition === 'User' ? 'Production' : 'Office',
                    "company": regCompany,
                    "shift": "White"
                };

                // Вкладываем в активную базу данных приложения
                activeUserBase.push(newEmployee);

                // Фиксируем обновленный массив в LocalStorage для Vercel продакшена
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(activeUserBase));

                if (registerErrorMessage) registerErrorMessage.style.display = 'none';
                alert(`🎉 Аккаунт сотрудника ${regFirstName} ${regLastName} успешно создан!\nТеперь можно выполнить вход под ID: ${regId}`);

                // Обнуляем форму и возвращаем карточку на экран логина
                registerForm.reset();
                if (flipper) flipper.style.transform = ''; 
            });
        }
    }, 150);
});
