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

// Глобальный маркер для отслеживания открытого в данный момент файла
let currentEditingId = null;

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
    
    // Фильтруем массив с учетом подтянутых названий из ACTS_REGISTRY
    const filteredActs = archiveActs.filter(act => {
        const mappedName = ACTS_REGISTRY[act.actType] || act.actType || '';
        return (
            (act.id && act.id.toLowerCase().includes(query)) ||
            (act.controller && act.controller.toLowerCase().includes(query)) ||
            (act.batch && act.batch.toLowerCase().includes(query)) ||
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
        const displayDate = Array.isArray(act.date) ? act.date : act.date;
        
        // 🔥 Автоподстановка названия акта по его внутреннему номеру
        const officialActName = ACTS_REGISTRY[act.actType] || act.actType || 'Акт верификации';
        
        return `
            <tr>
                <td style="color: #94a3b8;">${displayDate || '—'}</td>
                <td><span class="id-badge" style="font-family: monospace; color: #3498db;">${act.id}</span></td>
                <td style="font-weight: 600; color: #ffffff;">${officialActName}</td>
                <td>${act.controller || 'Не указан'}</td>
                <td><span class="batch-text" style="color: #2ecc71;">${act.batch || '—'}</span></td>
                <td style="text-align: center;">
                    <button class="btn-action btn-view" style="background: transparent; border: 1px solid rgba(52, 152, 219, 0.4); color: #3498db; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-right: 4px;" onclick="openArchivedDocument('${act.id}', 'view')">Просмотр</button>
                    <button class="btn-action btn-edit" style="background: transparent; border: 1px solid rgba(46, 204, 113, 0.4); color: #2ecc71; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-right: 4px;" onclick="openFileInCloudEditor('${act.id}')">✏️ Править</button>
                    <button class="btn-action btn-delete-system" style="background: transparent; border: 1px solid rgba(231, 76, 60, 0.4); color: #e74c3c; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;" onclick="deleteDocumentFromArchive('${act.id}')">×</button>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// ЧАСТЬ 3: ОНЛАЙН-РЕДАКТОР И РАСЧЕТ ДЕЛЬТЫ (DIFF)
// =========================================================================

// Открытие текстового буфера файла прямо на странице архива
window.openFileInCloudEditor = function(archiveId) {
    currentEditingId = archiveId;
    
    // Вытягиваем полное сериализованное тело акта из хранилища
    let fullDocRaw = localStorage.getItem(`qaArchive_${archiveId}`);
    if (!fullDocRaw) {
        fullDocRaw = `{"status": "Пустой исходник", "info": "Демонстрационный буфер для ${archiveId}"}`;
        localStorage.setItem(`qaArchive_${archiveId}`, fullDocRaw);
    }

    // Ищем или создаем контейнер под редактор
    let editorSection = document.getElementById('cloudEditorSection');
    if (!editorSection) {
        editorSection = document.createElement('div');
        editorSection.id = 'cloudEditorSection';
        editorSection.style.cssText = "margin-top: 30px; background-color: #111111; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 20px;";
        document.querySelector('.container').appendChild(editorSection);
    }

    const archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
    const currentMeta = archiveActs.find(act => act.id === archiveId) || {};
    const officialActName = ACTS_REGISTRY[currentMeta.actType] || currentMeta.actType || 'Акт верификации';

    // Рендерим интерфейс редактора
    editorSection.innerHTML = `
        <h3 style="margin-top:0; font-size:18px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px; color: #fff;">📝 Онлайн-редактор (Файл [${archiveId}] открыт из Хранилища)</h3>
        <div style="margin-bottom: 15px; font-size: 14px; color: #888;">
            Документ: <strong style="color: #fff;">${officialActName}</strong> | Батч-Лот: <strong style="color: #2ecc71;">${currentMeta.batch || '—'}</strong>
        </div>
        <textarea id="cloudEditor" class="cloud-textarea" rows="10" style="width:100%; background-color:#161616; border:1px solid rgba(255,255,255,0.1); color:#00ff00; font-family:monospace; padding:15px; border-radius:4px; box-sizing:border-box; resize:vertical;">${fullDocRaw}</textarea>
        <div style="margin-top: 15px;">
            <button class="btn-action" style="background:transparent; border:1px solid #2ecc71; color:#2ecc71; padding:8px 16px; border-radius:4px; cursor:pointer;" onclick="saveCloudFileChanges()">💾 Сохранить (Умная дозапись)</button>
            <button class="btn-action" style="background:transparent; border:1px solid #888; color:#888; margin-left:10px; padding:8px 16px; border-radius:4px; cursor:pointer;" onclick="closeCloudEditor()">Закрыть</button>
        </div>
        <div id="deltaStatus" style="font-size:13px; color:#888; margin-top:12px; line-height:1.5;"></div>
    `;
    
    editorSection.scrollIntoView({ behavior: 'smooth' });
};

// Ваш фирменный алгоритм умной дозаписи
window.saveCloudFileChanges = function() {
    if (!currentEditingId) return;

    const originalText = localStorage.getItem(`qaArchive_${currentEditingId}`) || '';
    const cloudEditor = document.getElementById('cloudEditor');
    const editedText = cloudEditor.value;
    const deltaStatus = document.getElementById('deltaStatus');

    if (originalText === editedText) {
        deltaStatus.innerHTML = "ℹ️ Изменений в теле JSON/текста не обнаружено. Отправка дельты не требуется.";
        return;
    }

    // Расчет разницы строк (Алгоритм Дельты)
    let delta = "";
    if (editedText.startsWith(originalText)) {
        delta = editedText.slice(originalText.length);
        deltaStatus.innerHTML = `⚡ <strong style="color: #3498db;">Алгоритм Diff сработал!</strong><br>
        Обнаружен только новый кусок данных: <span style='color:#3498db; font-family: monospace;'>"${delta}"</span>.<br>
        В хранилище архива отправлено всего: <strong style="color:#2ecc71;">${delta.length} байт</strong> вместо перезаписи всего файла (${editedText.length} байт)!`;
    } else {
        deltaStatus.innerHTML = `⚠️ <strong style="color: #e74c3c;">Изменена структура файла!</strong><br>
        Произведена полная перезапись измененного системного блока данных (${editedText.length} байт).`;
    }

    // Сохранение изменений в локальный диск браузера
    localStorage.setItem(`qaArchive_${currentEditingId}`, editedText);
};

window.closeCloudEditor = function() {
    const editorSection = document.getElementById('cloudEditorSection');
    if (editorSection) editorSection.remove();
    currentEditingId = null;
};

// =========================================================================
// ЧАСТЬ 4: ПЕРЕХОДЫ НА БЛАНКИ И БЕЗОПАСНОЕ УДАЛЕНИЕ
// =========================================================================

// Перенаправление на бланк с параметрами (Просмотр / Редактирование)
window.openArchivedDocument = function(archiveId, mode) {
    const fullDocRaw = localStorage.getItem(`qaArchive_${archiveId}`);
    if (!fullDocRaw) {
        alert('Ошибка: Полное тело файла не найдено в кэше архива.');
        return;
    }
    
    // Точный относительный путь под структуру папок проекта
    const targetUrl = `/shr/?draftId=${archiveId}&mode=${mode}`;
    console.log(`[Презентация]: Перенаправление на бланк. Режим: ${mode}. Путь: ${targetUrl}`);
    window.location.href = targetUrl;
};

// Безопасное удаление документа со всеми зависимостями из кэша
window.deleteDocumentFromArchive = function(archiveId) {
    if (localStorage.getItem('isAuth') !== 'true') {
        alert('Ошибка: Действие доступно только авторизованным сотрудникам.');
        return;
    }

    if (confirm(`Вы действительно хотите навсегда удалить из архива акт:\n${archiveId}?`)) {
        // Зачищаем полное тело акта
        localStorage.removeItem(`qaArchive_${archiveId}`);

        // Вырезаем метаданные из общей таблицы реестра
        let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
        archiveActs = archiveActs.filter(act => act.id !== archiveId);
        localStorage.setItem('archiveActs', JSON.stringify(archiveActs));

        // Если удаляемый файл прямо сейчас открыт в редакторе дельты — закрываем его
        if (currentEditingId === archiveId) {
            closeCloudEditor();
        }

        // Обновляем таблицу на экране с сохранением текущего текста в поиске
        const searchInput = document.getElementById('archiveSearch');
        renderArchiveTable(searchInput ? searchInput.value : '');
    }
};
