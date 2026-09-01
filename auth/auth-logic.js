document.addEventListener('DOMContentLoaded', () => {
    const flipper = document.getElementById('flipper');
    const toResetBtn = document.getElementById('to-reset');
    const toLoginBtn = document.getElementById('to-login');
    const userIdInput = document.getElementById('userId');
    const resetUserIdInput = document.getElementById('user-id');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // 1. УПРАВЛЕНИЕ СТОРОНАМИ КАРТОЧКИ (3D FLIP)
    // Переход на смену пароля
    if (toResetBtn) {
        toResetBtn.addEventListener('click', () => {
            flipper.classList.add('flipped');
            
            // Автоматически переносим введенный ID, чтобы пользователю не вводить его дважды
            if (userIdInput.value.trim() !== "") {
                resetUserIdInput.value = userIdInput.value.trim();
            } else {
                resetUserIdInput.value = "USR-НЕ УКАЗАН";
            }
        });
    }

    // Возврат к окну входа
    if (toLoginBtn) {
        toLoginBtn.addEventListener('click', () => {
            flipper.classList.remove('flipped');
        });
    }

    // 2. ОБРАБОТКА ВХОДА В СИСТЕМУ
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const idInput = userIdInput.value.trim();
            const passwordInput = document.getElementById('password').value;
            
            // Проверяем, существует ли база данных mockUserBase, подключенная из users.js
            if (typeof mockUserBase !== 'undefined') {
                
                // ИСПРАВЛЕНО: берем правильную переменную idInput вместо enteredId
                const user = mockUserBase[idInput];
                
                // ИСПРАВЛЕНО: проверяем переменную user вместо userFound
                if (user && user.password === passwordInput) {
                    
                    // Сохраняем сессию и данные пользователя в localStorage
                    localStorage.setItem('isAuth', 'true');
                    localStorage.setItem('userId', idInput); // ИСПРАВЛЕНО: idInput
                    localStorage.setItem('userFirstName', user.firstName);
                    localStorage.setItem('userLastName', user.lastName);
                    localStorage.setItem('userPosition', user.position);
                    localStorage.setItem('userPlot', user.plot);
                    localStorage.setItem('userShift', user.shift);
                    localStorage.setItem('userCompany', user.company); // Синхронизировано под главную страницу!
                    
                    if (errorMessage) errorMessage.style.display = 'none';
                    
                    // ИСПРАВЛЕНО: Перенаправляем на физический адрес главного меню проекта
                    window.location.href = '/menu/index.html';
                } else {
                    if (errorMessage) errorMessage.style.display = 'block';
                }
            } else {
                console.error("Ошибка: База данных mockUserBase не найдена. Проверьте путь к users.js");
                alert("Системная ошибка: база данных недоступна.");
            }
        });
    }
});
