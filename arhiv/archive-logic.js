// =========================================================================
// ЧАСТЬ 1: РЕЕСТР НАЗВАНИЙ И ИНИЦИАЛИЗАЦИЯ
// =========================================================================

// Официальный справочник: номер акта -> красивое название на производстве
const ACTS_REGISTRY = {
    "1": "Акт отбора образцов готового продукта с упаковочных линий",
    "2": "Акт на рутинные смывы (микробиология)",
    "3": "Акт на прямые поставки жира",
    "4": "Акт на кремпер",
    "5": "Акт на крошку и жир (ER Dryer)",
    "6": "Акт Нестандартных проб"
};

// Главная точка входа при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('archiveSearch');

    // Первичный вывод таблицы из localStorage
    renderArchiveTable();

    // Слушатель для живого поиска в реальном времени
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderArchiveTable(e.target.value);
        });
    }
});

// =========================================================================
// ЧАСТЬ 2: ГЕНЕРАЦИЯ СТРОК ТАБЛИЦЫ И ЖИВОЙ ПОИСК
// =========================================================================
function renderArchiveTable(filterText = '') {
    const tableBody = document.getElementById('archive-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    // Достаем массив метаданных сохраненных актов
    const archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];

    if (archiveActs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 30px;">
                    В архиве пока нет опубликованных документов.
                </td>
            </tr>
        `;
        return;
    }

    const query = filterText.toLowerCase().trim();
    
    // Фильтруем массив с учетом названий из ACTS_REGISTRY и жесткого номера W1.1.8
    const filteredActs = archiveActs.filter(act => {
        const mappedName = ACTS_REGISTRY[act.actType] || act.actType || '';
        const actNum = act.number || '';
        return (
            (act.id && act.id.toLowerCase().includes(query)) ||
            (act.controller && act.controller.toLowerCase().includes(query)) ||
            (act.batch && act.batch.toLowerCase().includes(query)) ||
            actNum.toLowerCase().includes(query) ||
            mappedName.toLowerCase().includes(query)
        );
    });

    if (filteredActs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 30px;">
                    Документы по вашему запросу не найдены.
                </td>
            </tr>
        `;
        return;
    }

    // Собираем HTML-строки для таблицы
    tableBody.innerHTML = filteredActs.map(act => {
        const displayDate = act.date || '—';
        const officialActName = ACTS_REGISTRY[act.actType] || act.actType || 'Акт верификации';
        
        // Берем сохраненный жесткий номер акта (например, W1.1.8) или автономер
        const actNumberDisplay = act.number || 'W1.1.8';
        
        // Безопасно определяем путь к бланку. Если в базе пути нет, ставим дефолтный шаблон
        const currentBlankPath = act.blankPath || '../form/_S_B_/index.html';

        return `
            <tr>
                <td style="color: #94a3b8; font-weight: 500;">${displayDate}</td>
                <td><span class="id-badge" style="font-family: monospace; color: #e74c3c; font-weight: bold; font-size: 11px;">${act.id}</span></td>
                <td style="font-weight: 600; color: #ffffff;">[${actNumberDisplay}] ${officialActName}</td>
                <td>${act.controller || 'Не указан'}</td>
                <td><span class="batch-text" style="color: #2ecc71; font-weight: bold;">${act.batch || '—'}</span></td>
                <td style="text-align: center;">
                    <!-- Кнопка Просмотра: открывает бланк в режиме view (заблокированном) -->
                    <button class="btn-action btn-view" style="background: transparent; border: 1px solid rgba(52, 152, 219, 0.6); color: #3498db; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-right: 4px;" 
                        onclick="redirectToBlank('${currentBlankPath}', '${act.id}', 'view')">👁️ Просмотр</button>
                    
                    <!-- Кнопка Править: открывает ТОТ ЖЕ бланк в режиме edit для исправления ошибок -->
                    <button class="btn-action btn-edit" style="background: transparent; border: 1px solid rgba(46, 204, 113, 0.6); color: #2ecc71; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-right: 4px;" 
                        onclick="redirectToBlank('${currentBlankPath}', '${act.id}', 'edit')">✏️ Исправить</button>
                    
                    <!-- Системное удаление строки -->
                    <button class="btn-action btn-delete-system" style="background: transparent; border: 1px solid rgba(231, 76, 60, 0.6); color: #e74c3c; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold;" 
                        onclick="deleteDocumentFromArchive('${act.id}')">×</button>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// ЧАСТЬ 3: БЕЗОПАСНОЕ ПЕРЕНАПРАВЛЕНИЕ НА ЖИВОЙ БЛАНК ДЛЯ ИСПРАВЛЕНИЙ
// =========================================================================
window.redirectToBlank = function(blankPath, archiveId, mode) {
    // Проверяем, существует ли вообще тело файла в памяти
    const fullDocRaw = localStorage.getItem(`qaArchive_${archiveId}`);
    if (!fullDocRaw) {
        alert('Ошибка: Полное тело файла данных не найдено в хранилище архива.');
        return;
    }

    // Собираем красивую ссылку на реальный бланк формы (например, ../form/_S_B_/index.html?draftId=...&mode=edit)
    const targetUrl = `${blankPath}?draftId=${archiveId}&mode=${mode}`;
    
    console.log(`[Архив-Навигация]: Переход на бланк. Путь: ${targetUrl} | Режим: ${mode}`);
    window.location.href = targetUrl;
};

// =========================================================================
// ЧАСТЬ 4: БЕЗОПАСНОЕ УДАЛЕНИЕ ИЗ РЕЕСТРА
// =========================================================================
window.deleteDocumentFromArchive = function(archiveId) {
    // Защитная проверка авторизации (если у вас используется)
    if (localStorage.getItem('isAuth') !== 'true') {
        alert('Ошибка доступа: Действие доступно только авторизованным контролёрам.');
        return;
    }

    if (confirm(`Вы действительно хотите навсегда удалить из архива акт:\nНомер паспорта ID: ${archiveId}?`)) {
        // 1. Зачищаем полное JSON тело документа
        localStorage.removeItem(`qaArchive_${archiveId}`);
        localStorage.removeItem(`shadow_arch_${archiveId}`); // Чистим теневые копии, если были

        // 2. Вырезаем метаданные из таблицы реестра
        let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
        archiveActs = archiveActs.filter(act => act.id !== archiveId);
        localStorage.setItem('archiveActs', JSON.stringify(archiveActs));

        // 3. Обновляем таблицу на экране с сохранением поискового запроса
        const searchInput = document.getElementById('archiveSearch');
        renderArchiveTable(searchInput ? searchInput.value : '');
    }
};
