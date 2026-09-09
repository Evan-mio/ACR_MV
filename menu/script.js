/// =========================================================================
// 1. ПРОВЕРКА АВТОРИЗАЦИИ
// =========================================================================
if (localStorage.getItem('isAuth') !== 'true') {
    window.location.href = '/auth/index.html';
}

// =========================================================================
// 2. ЧАСЫ И ДАТА С ПЕРИУДОМ В ШАПКЕ
// =========================================================================
function updateClock() {
    const now = new Date();
    const dateEl = document.getElementById('date');
    const timeEl = document.getElementById('time');

    const optionsDate = { day: '2-digit', month: 'long', year: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    if (dateEl) dateEl.textContent = now.toLocaleDateString('ru-RU', optionsDate);
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('ru-RU', optionsTime);
}
updateClock();
setInterval(updateClock, 1000); // Перезапуск каждую секунду

// Базовая точка старта: 3 января 2021 года (Воскресенье, P1:W1:D1)
const START_DATE = new Date('2021-01-03T00:00:00'); 

function updatePeriodCalendar() {
    const now = new Date();
    
    // Считаем разницу в днях, округляя в меньшую сторону
    const diffTime = now - START_DATE;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Если текущая дата вдруг меньше даты старта
    if (diffDays < 0) return;

    const DAYS_IN_WEEK = 7;
    const DAYS_IN_PERIOD = 28; // 4 недели по 7 дней

    // 1. Сколько всего полных периодов прошло с 2021 года
    const totalPeriods = Math.floor(diffDays / DAYS_IN_PERIOD);
    
    // 2. Текущий период в рамках 13-месячного цикла (от 1 до 13)
    const currentPeriod = (totalPeriods % 13) + 1;
    
    // 3. Текущая неделя внутри этого периода (от 1 до 4)
    const currentWeek = Math.floor((diffDays % DAYS_IN_PERIOD) / DAYS_IN_WEEK) + 1;
    
    // 4. Текущий день внутри недели (от 1 до 7, где 1 — Воскресенье)
    const currentDay = (diffDays % DAYS_IN_WEEK) + 1;

    // Выводим данные в ваши HTML-элементы
    document.getElementById('pereaud').textContent = `P${currentPeriod}`;
    document.getElementById('wek').textContent = `:W${currentWeek}`;
    document.getElementById('day').textContent = `:D${currentDay}`;
}

// Запускаем расчет при загрузке страницы
updatePeriodCalendar();

// =========================================================================
// 3. ДИНАМИЧЕСКИЕ НОВОСТИ (Исправленная синхронизированная версия)
// =========================================================================
const newsContainer = document.getElementById('news-container');
const addNewsBtn = document.getElementById('add-news-btn');
const addNewsModal = document.getElementById('add-news-modal');
const newsForm = document.getElementById('news-form');
const formCancelBtn = document.getElementById('form-cancel-btn');

// Инициализируем массив новостей из localStorage, либо берем дефолтные, если память пуста
let newsData = JSON.parse(localStorage.getItem('qa_news_data_store')) || [
    { timestamp: 1710000000001, title: "Запуск системы", desc: "QA Control переходит на цифровой документооборот", type: "info", details: "Инструкция по переходу на цифровой документооборот доступна на внутреннем портале." },
    { timestamp: 1710000000002, title: "Обновление регламента", desc: "Новые требования к проверке упаковки в мешках", type: "warning", details: "Внимание! С 25 числа вводится тройной контроль швов." },
    { timestamp: 1710000000003, title: "Техническое обслуживание", desc: "Плановая чистка сушилки ER Dryer завтра в 10:00", type: "alert", details: "Работа сушилки будет приостановлена на 4 часа." }
];

// Вспомогательная функция защиты от XSS-атак
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

// Открытие модального окна добавления новости
window.openAddModal = function() {
    const modal = document.getElementById('add-news-modal');
    if (modal) {
        modal.style.display = 'flex'; // Применяем flex для центрирования контента
    }
};

// Вспомогательная функция закрытия формы создания новости
window.closeAddModal = function() {
    const modal = document.getElementById('add-news-modal');
    const form = document.getElementById('news-form');
    if (modal) {
        modal.style.display = 'none';
    }
    if (form) {
        form.reset(); // Очищаем поля формы при закрытии
        // Сбрасываем аварийные красные рамки валидации, если они были
        form.querySelectorAll('input, textarea').forEach(inp => inp.style.borderColor = '');
    }
};

// Функция обработки отправки формы
window.handleNewsSubmit = function(event) {
    event.preventDefault(); // Предотвращаем стандартную перезагрузку страницы

    const titleEl = document.getElementById('form-title');
    const descEl = document.getElementById('form-desc');
    const detailsEl = document.getElementById('form-details');
    const publishTimeEl = document.getElementById('form-publish-time');

    const title = titleEl ? titleEl.value.trim() : '';
    const desc = descEl ? descEl.value.trim() : '';
    const details = detailsEl ? detailsEl.value.trim() : '';
    const publishTimeVal = publishTimeEl ? publishTimeEl.value : '';

    let isValid = true;

    // Сброс предыдущих ошибок валидации
    if (titleEl) titleEl.style.borderColor = '';
    if (descEl) descEl.style.borderColor = '';

    // Простая валидация обязательных полей
    if (!title) {
        isValid = false;
        if (titleEl) {
            titleEl.style.borderColor = '#ef4444'; 
            titleEl.placeholder = 'Поле обязательно для заполнения!';
        }
    }
    if (!desc) {
        isValid = false;
        if (descEl) {
            descEl.style.borderColor = '#ef4444'; 
            descEl.placeholder = 'Поле обязательно для заполнения!';
        }
    }

    if (!isValid) return; 

    const nowTimestamp = Date.now();
    const publishTimestamp = publishTimeVal ? new Date(publishTimeVal).getTime() : nowTimestamp;

    // Сохраняем новую новость в массив
    newsData.push({
        timestamp: nowTimestamp, 
        publishAt: publishTimestamp, 
        title: title,
        desc: desc,
        details: details || "Подробное описание отсутствует.",
        type: "info" // По умолчанию вешается бирюзовый неоновый стиль
    });

    // Синхронизируем базу данных с localStorage
    localStorage.setItem('qa_news_data_store', JSON.stringify(newsData));

    // Обновляем отображение и закрываем окно
    if (typeof window.renderNews === 'function') window.renderNews();
    window.closeAddModal();
};

// Функция (отрисовки) карточек на экране
window.renderNews = function() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return; 

    const now = Date.now();

  // Проверка прав: Администраторы видят все отложенные публикации, пользователи — только текущие
    const currentPosition = localStorage.getItem('userPosition') || 'User';
    const hasManagerRights = (currentPosition === "Admin" || currentPosition === "SysAdmin");

    const visibleNews = newsData.filter(news => {
        if (hasManagerRights) return true; // админы видят отложенные посты заранее
        return !news.publishAt || news.publishAt <= now;
    });

    if (visibleNews.length === 0) {
        newsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Нет доступных новостей</p>';
        return;
    }

  // Сортируем: свежие новости выводим в самом начале списка
    visibleNews.sort((a, b) => b.timestamp - a.timestamp);

    newsContainer.innerHTML = visibleNews.map((news) => {
        const isFuture = news.publishAt > now;
      // Если новость запланирована на будущее, добавляем фиолетовые CSS-классы
        const scheduleClass = isFuture ? 'scheduled-card' : '';
        const badgeHTML = isFuture 
            ? `<div class="schedule-badge">⏱ Отложено: ${new Date(news.publishAt).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</div>`
            : '';

        return `
            <div class="card act-card ${news.type || ''} ${scheduleClass}">
            ${badgeHTML}
            <div>
                <div class="card-name">${escapeHTML(news.title)}</div>
                <div class="card-desc">${escapeHTML(news.desc)}</div>
            </div>
            <div class="card-actions-row">
                ${hasManagerRights ? `<button class="btn-delete-card" onclick="window.deleteNewsCard(${news.timestamp})">Удалить</button>` : ''}
                <div class="card-btn" onclick="openDetailsModalByTimestamp(${news.timestamp})">Подробнее &rarr;</div>
            </div>
        </div>
        `;
    }).join('');
};

// Функция удаления карточки новости по её ID с гарантированным сохранением
window.deleteNewsCard = function(timestamp) {
    const currentPosition = localStorage.getItem('userPosition') || 'User';
    if (currentPosition !== "Admin" && currentPosition !== "SysAdmin") {
        alert("Критическая ошибка доступа: Ваша должность не позволяет удалять публикации!");
        return;
    }

    if (confirm("Вы уверены, что хотите удалить эту публикацию?")) {
        // Фильтруем массив, исключая удаляемую новость
        newsData = newsData.filter(news => news.timestamp !== timestamp);
        
        // Гарантированная синхронизация с localStorage
        localStorage.setItem('qa_news_data_store', JSON.stringify(newsData));
        
        // Перерисовываем актуальный список на экране
        window.renderNews();
    }
};

// Кастомное модальное окно подробностей
window.openDetailsModalByTimestamp = function(timestamp) {
    const news = newsData.find(item => item.timestamp === timestamp);
    const modal = document.getElementById('details-news-modal');
    const modalTitle = document.getElementById('modal-details-title');
    const modalText = document.getElementById('modal-details-text');

    if (news && modal && modalTitle && modalText) {
        modalTitle.textContent = news.title;
        modalText.textContent = news.details || "Подробное описание отсутствует.";
        modal.style.display = 'flex'; // Открываем модалку
    } else {
        // Фоллбек-защита: если HTML-разметка модалки не найдена, покажется alert
        if (news) alert(`ЗАГОЛОВОК: ${news.title}\n\nПОДРОБНОСТИ: ${news.details}`);
    }
};

// =========================================================================
// 4. ТРЕКЕР МЫШИ ПО ВСЕМУ ЭКРАНУ
// =========================================================================
function initGlobalMouseTracker() {
    window.addEventListener('mousemove', (e) => {
        document.documentElement.style.setProperty('--screen-mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--screen-mouse-y', `${e.clientY}px`);
    });
}

// =========================================================================
// 5. ОСНОВНОЙ ЕДИНЫЙ БЛОК ИНИЦИАЛИЗАЦИИ КОНТЕНТА
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- ПОДБЛОК 5.1. ПЕРЕКЛЮЧЕНИЕ ТАБОВ (ВКЛАДОК) МЕНЮ ---
    const menuItems = document.querySelectorAll('.menu-item');
    const views = document.querySelectorAll('.view');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');

            menuItems.forEach(btn => btn.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));

            item.classList.add('active');
            const targetEl = document.getElementById(targetView);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // --- ПОДБЛОК 5.2. УПРАВЛЕНИЕ ОКНОМ СОЗДАНИЯ НОВОСТЕЙ (Интерфейс + Валидация) ---
    const currentNewsForm = document.getElementById('news-form');
    if (currentNewsForm) {
        currentNewsForm.addEventListener('submit', (e) => {
            e.preventDefault(); 

            const titleEl = document.getElementById('form-title');
            const descEl = document.getElementById('form-desc');
            const detailsEl = document.getElementById('form-details');
            const publishTimeEl = document.getElementById('form-publish-time');

            const title = titleEl ? titleEl.value.trim() : '';
            const desc = descEl ? descEl.value.trim() : '';
            const details = detailsEl ? detailsEl.value.trim() : '';
            const publishTimeVal = publishTimeEl ? publishTimeEl.value : '';

            let isValid = true;

            if (titleEl) titleEl.style.borderColor = '';
            if (descEl) descEl.style.borderColor = '';

            if (!title) {
                isValid = false;
                if (titleEl) {
                    titleEl.style.borderColor = '#ef4444'; 
                    titleEl.placeholder = 'Поле обязательно для заполнения!';
                }
            }

            if (!desc) {
                isValid = false;
                if (descEl) {
                    descEl.style.borderColor = '#ef4444'; 
                    descEl.placeholder = 'Поле обязательно для заполнения!';
                }
            }

            if (!isValid) return; 

            const publishTimestamp = publishTimeVal ? new Date(publishTimeVal).getTime() : Date.now();

            newsData.push({
                timestamp: Date.now(), 
                publishAt: publishTimestamp, 
                title: title,
                desc: desc,
                details: details || "Подробное описание отсутствует.", 
                type: "info"
            });

            localStorage.setItem('qa_news_data_store', JSON.stringify(newsData));

            if (typeof window.renderNews === 'function') window.renderNews();
            closeAddModal();
        });

        const inputs = currentNewsForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                input.style.borderColor = '';
            });
        });
    }

    // --- ПОДБЛОК 5.3. ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ПОДРОБНОСТЕЙ НОВОСТИ ---
    const detailsModal = document.getElementById('details-news-modal');
    const closeX = document.getElementById('details-close-btn');
    const closeBtn = document.getElementById('details-ok-btn');
    const closeModal = () => { if (detailsModal) detailsModal.style.display = 'none'; };

    if (closeX) closeX.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // --- ПОДБЛОК 5.4. РЕЕСТР ЧЕРНОВИКОВ С АВТООЧИСТКОЙ (13 часов) ---
    const listContainer = document.getElementById('activeActsList');
    const TWELVE_HOURS = 13 * 60 * 60 * 1000;

    if (listContainer) {
        let activeActs = JSON.parse(localStorage.getItem('global_active_acts_list')) || [];
        let allDraftsData = JSON.parse(localStorage.getItem('qa_all_drafts_data')) || {};
        let filteredActs = [];
        listContainer.innerHTML = '';

        activeActs.forEach(act => {
            const draftInfo = allDraftsData[act.id];

            if (!draftInfo || (Date.now() - draftInfo.timestamp > TWELVE_HOURS)) {
                if (draftInfo) delete allDraftsData[act.id];
                return;
            }

            filteredActs.push(act);

            const actCard = document.createElement('div');
            actCard.className = 'draft-card';
            actCard.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: #f8fafc; border-radius: 6px; cursor: pointer; border-left: 4px solid #f59e0b; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;';
            
            const timeString = new Date(draftInfo.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            const textBlock = document.createElement('div');
            textBlock.style.cssText = 'flex: 1; padding-right: 10px;';
            textBlock.innerHTML = `
                <div style="font-weight: 600; color: #1e293b; font-size: 12px; line-height: 1.4;">${act.title}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Свернут в: <b>${timeString}</b></div>
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.innerHTML = '×';
            deleteBtn.style.cssText = 'background: none; border: none; color: #94a3b8; font-size: 20px; font-weight: bold; cursor: pointer; padding: 0 5px; line-height: 1; transition: color 0.2s;';
            
            deleteBtn.addEventListener('mouseenter', () => deleteBtn.style.color = '#ef4444');
            deleteBtn.addEventListener('mouseleave', () => deleteBtn.style.color = '#94a3b8');

            textBlock.addEventListener('click', () => {
                window.location.href = `${act.url}?draftId=${act.id}`;
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Удалить черновик "${act.title}"? Данные будут безвозвратно стерты.`)) {
                    let currentAllDrafts = JSON.parse(localStorage.getItem('qa_all_drafts_data')) || {};
                    delete currentAllDrafts[act.id];
                    localStorage.setItem('qa_all_drafts_data', JSON.stringify(currentAllDrafts));

                    let currentActiveActs = JSON.parse(localStorage.getItem('global_active_acts_list')) || [];
                    currentActiveActs = currentActiveActs.filter(item => item.id !== act.id);
                    localStorage.setItem('global_active_acts_list', JSON.stringify(currentActiveActs));
                    
                    actCard.remove();

                    if (listContainer.children.length === 0) {
                        listContainer.innerHTML = '<p style="font-size:12px; color:#94a3b8; margin: 4px 0; text-align: center;">Нет активных черновиков</p>';
                    }
                }
            });

            actCard.appendChild(textBlock);
            actCard.appendChild(deleteBtn);

            textBlock.addEventListener('mouseenter', () => actCard.style.background = '#f1f5f9');
            textBlock.addEventListener('mouseleave', () => actCard.style.background = '#f8fafc');

            listContainer.appendChild(actCard);
        });

        localStorage.setItem('global_active_acts_list', JSON.stringify(filteredActs));
        localStorage.setItem('qa_all_drafts_data', JSON.stringify(allDraftsData));

        if (filteredActs.length === 0) {
            listContainer.innerHTML = '<p style="font-size:12px; color:#94a3b8; margin: 4px 0; text-align: center;">Нет активных черновиков</p>';
        }
    }

    // --- ПОДБЛОК 5.5. КРАСИВОЕ ЗАПОЛНЕНИЕ КАРТОЧКИ С ИМЕНЕМ, КОМПАНИЕЙ, СМЕНОЙ И УЧАСТКОМ ---
    const mainPageUserField = document.getElementById('mainPageUserField');
    if (mainPageUserField) {
        const firstName = localStorage.getItem('userFirstName') || '';
        const lastName = localStorage.getItem('userLastName') || '';
        const company = localStorage.getItem('userCompany') || '';
        const shift = localStorage.getItem('userShift') || '';
        const plot = (localStorage.getItem('userPlot') || '').trim(); // Удаляет лишние пробелы из базы сотрудников

        const shortLastName = lastName ? ` ${lastName.charAt(0)}.` : '';
        const displayName = `${firstName}${shortLastName}` || 'Пользователь';
        
        mainPageUserField.innerHTML = `
            <div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5;">
                <div style="font-weight: 600; font-size: 1.1rem; color: #ffffff; margin-bottom: 6px;">
                    ${displayName}
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;">
                    <span style="background: rgba(189, 195, 199, 0.2); color: #bdc3c7; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">
                        ${company || 'Компания не указана'}
                    </span>
                    <span style="background: rgba(46, 204, 113, 0.2); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">
                        ${shift || 'Смена не указана'}
                    </span>
                </div>
                <div style="color: #bdc3c7; font-size: 0.85rem; font-style: italic;">
                    ${plot || 'Участок не назначен'}
                </div>
            </div>
        `;
    }

// --- ПОДБЛОК 5.6. ВСПЛЫВАЮЩЕЕ БОКОВОЕ И ВЕРХНЕЕ МЕНЮ (Интерфейс анимации) ---
const toggleMenuBtn = document.getElementById('btn-toggle-topmenu');
const sidebar = document.querySelector('.sidebar');
const topBar = document.querySelector('.top-bar');

if (sidebar && topBar) {
    if (toggleMenuBtn) {
        toggleMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();sidebar.classList.toggle('forced-active');
        });
    }
    
    document.addEventListener('mousemove', (e) => {
        if (e.clientY <= 20) {
            topBar.classList.add('mouse-top-active');
        } else if (e.clientY > 110 && !topBar.contains(e.target)) {
            topBar.classList.remove('mouse-top-active');
        }
        
        if (e.clientX <= 20) {
            sidebar.classList.add('mouse-left-active');
        } else if (e.clientX > 290 && !sidebar.contains(e.target)) {
            sidebar.classList.remove('mouse-left-active');
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && e.target !== toggleMenuBtn) {
            sidebar.classList.remove('forced-active');
            sidebar.classList.remove('mouse-left-active');
        }
        if (!topBar.contains(e.target)) {
            topBar.classList.remove('forced-active');
            topBar.classList.remove('mouse-top-active');
        }
    });
}

// --- ПОДБЛОК 5.7. ОБРАБОТЧИК КНОПКИ БЕЗОПАСНОГО ВЫХОДА (Logout) ---
const logoutButton = document.getElementById('logoutBtn');
if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Выборочно чистим сессию авторизации, не ломая локальную базу черновиков фабрики
        const keysToRemove = ['isAuth', 'userFirstName', 'userLastName', 'userPosition', 'userPlot', 'userShift', 'userCompany', 'userEmpType', 'userId'];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        window.location.href = '/auth/index.html';
    });
}

// --- ПОДБЛОК 5.8. СТАРТОВАЯ ИНИЦИАЛИЗАЦИЯ СЛУЖБ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
if (typeof window.renderNews === 'function') window.renderNews();
initGlobalMouseTracker();

// --- ПОДБЛОК 5.9. ЛОКАЛЬНЫЙ НЕОНОВЫЙ ТРЕКИНГ КУРСОРA НА КАРТОЧКАХ ---
function initCardMouseTracker() {
    const observeContainer = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.card, .act-card');
            if (!card) return;
            
            const rect = card.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${localX}px`);
            card.style.setProperty('--mouse-y', `${localY}px`);
        });
    };
    
    observeContainer('news-container');
    const views = document.querySelectorAll('.view');
    views.forEach(view => { if (view.id) observeContainer(view.id); 
    });
}

initCardMouseTracker();

const tabButtons = document.querySelectorAll('.menu-item');
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(initCardMouseTracker, 50);
    });
});
});

// =========================================================================
// 6. СИСТЕМА РАЗГРАНИЧЕНИЯ ПРАВ ДОСТУПА ПО ДОЛЖНОСТЯМ (RBAC)
// =========================================================================
(function() {
    // 1. Конфигурация прав доступа
    const ROLES = {
        ADMIN: "Admin",
        SYSADMIN: "SysAdmin",
        LAB: "Лаборатория",
        USER: "User"
    };

    // Вспомогательная функция для проверки прав администратора (создание/удаление)
    function isAuthorizedManager() {
        const currentPosition = localStorage.getItem('userPosition') || ROLES.USER;
        return currentPosition === ROLES.ADMIN || currentPosition === ROLES.SYSADMIN;
    }

    // 2. Модификация функции рендеринга новостей (Декоратор/Перехватчик)
    window.renderNews = function() {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return; 
        
        const now = Date.now();
        const visibleNews = newsData.filter(news => !news.publishAt || news.publishAt <= now);
        
        if (visibleNews.length === 0) {
            newsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Нет доступных новостей</p>';
            return;
        }

        // Кнопку "Удалить" увидят только Админ и СиСАдмин. Лаборатория и Пользователь её не увидят.
        const hasManagerRights = isAuthorizedManager();

        newsContainer.innerHTML = visibleNews.map((news) => `
          <div class="card act-card ${news.type || ''}">
            <div>
              <div class="card-name">${news.title}</div>
              <div class="card-desc">${news.desc}</div>
            </div>
            <div class="card-actions-row">
              ${hasManagerRights ? `<button class="btn-delete-card" onclick="window.deleteNewsCard(${news.timestamp})">Удалить</button>` : ''}
              <div class="card-btn" onclick="openDetailsModalByTimestamp(${news.timestamp})">Подробнее &rarr;</div>
            </div>
          </div>
        `).join('');
    };

    // 3. Защита функции удаления новостей на уровне вызова
    window.deleteNewsCard = function(timestamp) {
        if (!isAuthorizedManager()) {
            alert("Критическая ошибка доступа: Ваша должность не позволяет удалять публикации!");
            return;
        }
        
        if (confirm("Вы уверены, что хотите удалить эту публикацию?")) {
            newsData = newsData.filter(news => news.timestamp !== timestamp);
            localStorage.setItem('qa_news_data_store', JSON.stringify(newsData));
            window.renderNews();
        }
    };

    // 4. Управление элементами интерфейса (Скрытие вкладок и кнопок создания)
    function enforceInterfaceRestrictions() {
        const currentPosition = localStorage.getItem('userPosition') || ROLES.USER;
        const hasManagerRights = isAuthorizedManager();

        // Поиск кнопки создания новостей
        const addNewsBtn = document.getElementById('add-news-btn') || 
                           document.querySelector('button[onclick*="openAddModal"]') || 
                           document.querySelector('.btn-content');
        
        // Кнопка создания новостей доступна ТОЛЬКО Админу и СиСАдмину
        if (addNewsBtn) {
            if (!hasManagerRights) {
                addNewsBtn.style.setProperty('display', 'none', 'important');
            } else {
                addNewsBtn.style.display = 'flex';
            }
        }

        // Фильтрация вкладок бокового меню
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const viewTarget = item.getAttribute('data-view') || '';
            const itemText = item.textContent.trim().toLowerCase();

            if (currentPosition === ROLES.LAB) {
                // Логика для Лаборатории: разрешены ТОЛЬКО новости, архив и библиотека
                // Проверяем как по data-view атрибуту, так и по тексту (для надежности)
                const isAllowedTab = 
                    viewTarget === 'news' || itemText.includes('новост') || 
                    viewTarget === 'archive' || itemText.includes('архив') || 
                    viewTarget === 'library' || itemText.includes('библиот');

                if (!isAllowedTab) {
                    item.style.setProperty('display', 'none', 'important');
                } else {
                    item.style.setProperty('display', 'block', 'important');
                }
            } else if (currentPosition === ROLES.USER) {
                // Логика для обычного Пользователя: скрываем только Базу данных
                const isDbTab = viewTarget === 'db' || itemText.includes('база данных');
                if (isDbTab) {
                    item.style.setProperty('display', 'none', 'important');
                } else {
                    item.style.setProperty('display', 'block', 'important');
                }
            } else {
                // Для Админа и СиСАдмина показываем абсолютно все вкладки меню
                item.style.setProperty('display', 'block', 'important');
            }
        });

        // Защита от прямого ручного перехода к запрещенным экранам (через консоль)
        const dbView = document.getElementById('db');
        if (!hasManagerRights && dbView) {
            dbView.innerHTML = `
                <div style="padding: 40px; text-align: center; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; margin-top: 50px;">
                    <h2 style="color: #ef4444; margin-bottom: 10px; background: none; -webkit-text-fill-color: #ef4444;">Доступ ограничен</h2>
                    <p style="color: var(--text-secondary);">У вашей роли нет прав для работы с базой данных.</p>
                </div>
            `;
        }
    }

    // 5. Автоматический запуск при инициализации страницы и переключении вкладок
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            enforceInterfaceRestrictions();
            window.renderNews();
        });
    } else {
        enforceInterfaceRestrictions();
        window.renderNews();
    }

    // Повторная проверка при кликах для пресечения попыток обойти разметку
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('menu-item')) {
            setTimeout(enforceInterfaceRestrictions, 30);
        }
    });

})();

// =========================================================================
// 6. СИСТЕМА РАЗГРАНИЧЕНИЯ ПРАВ ДОСТУПА ПО ДОЛЖНОСТЯМ (RBAC)
// =========================================================================
(function() {
    const ROLES = {
        ADMIN: "Admin",
        SYSADMIN: "SysAdmin",
        LAB: "Laboratory",
        USER: "User"
    };

    function isAuthorizedManager() {
        const currentPosition = localStorage.getItem('userPosition') || ROLES.USER;
        return currentPosition === ROLES.ADMIN || currentPosition === ROLES.SYSADMIN;
    }

    // Декоратор/Перехватчик рендеринга новостей (управляет видимостью кнопки Удалить)
    window.renderNews = function() {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return; 
        
        const now = Date.now();
        const visibleNews = newsData.filter(news => !news.publishAt || news.publishAt <= now);
        
        if (visibleNews.length === 0) {
            newsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Нет доступных новостей</p>';
            return;
        }

        const hasManagerRights = isAuthorizedManager();

        newsContainer.innerHTML = visibleNews.map((news) => `
          <div class="card act-card ${news.type || ''}">
            <div>
              <div class="card-name">${news.title}</div>
              <div class="card-desc">${news.desc}</div>
            </div>
            <div class="card-actions-row">
              ${hasManagerRights ? `<button class="btn-delete-card" onclick="window.deleteNewsCard(${news.timestamp})">Удалить</button>` : ''}
              <div class="card-btn" onclick="openDetailsModalByTimestamp(${news.timestamp})">Подробнее &rarr;</div>
            </div>
          </div>
        `).join('');
    };

    // Защита обработчика удаления
    window.deleteNewsCard = function(timestamp) {
        if (!isAuthorizedManager()) {
            alert("Критическая ошибка доступа: Ваша должность не позволяет удалять публикации!");
            return;
        }
        if (confirm("Вы уверены, что хотите удалить эту публикацию?")) {
            newsData = newsData.filter(news => news.timestamp !== timestamp);
            localStorage.setItem('qa_news_data_store', JSON.stringify(newsData));
            window.renderNews();
        }
    };

    // Главная функция контроля видимости элементов интерфейса смены
    function enforceInterfaceRestrictions() {
        const currentPosition = localStorage.getItem('userPosition') || ROLES.USER;
        const hasManagerRights = isAuthorizedManager();

        const addNewsBtn = document.getElementById('add-news-btn') || 
                           document.querySelector('button[onclick*="openAddModal"]') || 
                           document.querySelector('.btn-content');
        
        if (addNewsBtn) {
            if (!hasManagerRights) {
                addNewsBtn.style.setProperty('display', 'none', 'important');
            } else {
                addNewsBtn.style.display = 'flex';
            }
        }

        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const viewTarget = item.getAttribute('data-view') || '';
            const itemText = item.textContent.trim().toLowerCase();

            if (currentPosition === ROLES.LAB) {
                const isAllowedTab = 
                    viewTarget === 'news' || itemText.includes('новост') || 
                    viewTarget === 'archive' || itemText.includes('архив') || 
                    viewTarget === 'library' || itemText.includes('библиот');

                if (!isAllowedTab) {
                    item.style.setProperty('display', 'none', 'important');
                } else {
                    item.style.setProperty('display', 'block', 'important');
                }
            } else if (currentPosition === ROLES.USER) {
                const isDbTab = viewTarget === 'db' || itemText.includes('база данных');
                if (isDbTab) {
                    item.style.setProperty('display', 'none', 'important');
                } else {
                    item.style.setProperty('display', 'block', 'important');
                }
            } else {
                item.style.setProperty('display', 'block', 'important');
            }
        });

        const dbView = document.getElementById('db');
        if (!hasManagerRights && dbView) {
            dbView.innerHTML = `
                <div style="padding: 40px; text-align: center; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; margin-top: 50px;">
                    <h2 style="color: #ef4444; margin-bottom: 10px; background: none; -webkit-text-fill-color: #ef4444;">Доступ ограничен</h2>
                    <p style="color: var(--text-secondary);">У вашей роли нет прав для работы с базой данных.</p>
                </div>
            `;
        }
    }

    // Инициализация ограничений ролей
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            enforceInterfaceRestrictions();
            window.renderNews();
        });
    } else {
        enforceInterfaceRestrictions();
        window.renderNews();
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('menu-item')) {
            setTimeout(enforceInterfaceRestrictions, 30);
        }
    });
})();
