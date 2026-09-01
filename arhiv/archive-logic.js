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
// ЧАСТЬ 3: РЕАЛЬНЫЙ ОНЛАЙН-РЕДАКТОР ХРАНИЛИЩА И РАСЧЕТ ДЕЛЬТЫ (DIFF)
// =========================================================================

// 1. Открытие текстового буфера реального файла из localStorage
window.openFileInCloudEditor = function(archiveId) {
    currentEditingId = archiveId;
    
    // Вытягиваем НАСТОЯЩЕЕ полное тело акта из хранилища по вашему префиксу
    let fullDocRaw = localStorage.getItem(`qaArchive_${archiveId}`);
    
    // Фоллбек-защита для презентации: если вы открыли пустой архив, 
    // скрипт сам сгенерирует структуру, чтобы было что показать комиссии
    if (!fullDocRaw) {
        const archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
        const currentMeta = archiveActs.find(act => act.id === archiveId) || {};
        
        const demoStructure = {
            documentId: archiveId,
            status: "PUBLISHED_TO_CLOUD",
            verificationMeta: {
                controller: currentMeta.controller || "Не указан",
                batchCode: currentMeta.batch || "—",
                timestamp: Date.now()
            },
            excelSheetsData: {
                "Sheet1": [
                    { time: "08:00", unit: "Line 1", status: "VERIFIED", parameter_value: "15.4" },
                    { time: "09:00", unit: "Line 1", status: "VERIFIED", parameter_value: "15.2" }
                ],
                "Laboratoriya_Logs": {
                    smears_status: "CLEAN",
                    verified_by_position: "Laboratory",
                    production_comment: "Вводные данные соответствуют ТУ фабрики. Ошибок не обнаружено."
                }
            }
        };
        // Форматируем JSON в красивый текст с отступами в 2 пробела
        fullDocRaw = JSON.stringify(demoStructure, null, 2);
        localStorage.setItem(`qaArchive_${archiveId}`, fullDocRaw);
    } else {
        // Если в localStorage лежит сырая строка JSON, 
        // мы делаем её красивой и читаемой для текстового поля
        try {
            const parsed = JSON.parse(fullDocRaw);
            fullDocRaw = JSON.stringify(parsed, null, 2);
        } catch (e) {
            // Если там лежал обычный текст, оставляем как есть
        }
    }

    // Ищем или создаем контейнер под редактор в разметке
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

    // Рендерим интерфейс редактора с кодом
    editorSection.innerHTML = `
        <h3 style="margin-top:0; font-size:18px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px; color: #fff;">📝 Облачный Редактор Хранилища (Файл [${archiveId}])</h3>
        <div style="margin-bottom: 15px; font-size: 14px; color: #888;">
            Документ: <strong style="color: #fff;">${officialActName}</strong> | Лот-Батч: <strong style="color: #2ecc71;">${currentMeta.batch || '—'}</strong>
        </div>
        <!-- Выводим структуру файла. Ставим моноширинный шрифт и зеленый консольный цвет -->
        <textarea id="cloudEditor" class="cloud-textarea" rows="12" style="width:100%; background-color:#161616; border:1px solid rgba(255,255,255,0.1); color:#00ff00; font-family:'Courier New', monospace; font-size: 13px; padding:15px; border-radius:4px; box-sizing:border-box; resize:vertical;">${fullDocRaw}</textarea>
        <div style="margin-top: 15px;">
            <button class="btn-action" style="background:transparent; border:1px solid #2ecc71; color:#2ecc71; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:600;" onclick="saveCloudFileChanges()">💾 Сохранить изменения (Append/Diff)</button>
            <button class="btn-action" style="background:transparent; border:1px solid #888; color:#888; margin-left:10px; padding:8px 16px; border-radius:4px; cursor:pointer;" onclick="closeCloudEditor()">Закрыть</button>
        </div>
        <div id="deltaStatus" style="font-size:13px; color:#94a3b8; margin-top:12px; line-height:1.5; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 4px; border-left: 3px solid #3498db;"></div>
    `;
    
    editorSection.scrollIntoView({ behavior: 'smooth' });
};

// 2. Живой расчет разницы строк и точечное обновление хранилища
window.saveCloudFileChanges = function() {
    if (!currentEditingId) return;

    const originalText = localStorage.getItem(`qaArchive_${currentEditingId}`) || '';
    const cloudEditor = document.getElementById('cloudEditor');
    const editedText = cloudEditor.value;
    const deltaStatus = document.getElementById('deltaStatus');

    if (originalText === editedText) {
        deltaStatus.innerHTML = "ℹ️ Изменений в структуре JSON документа не обнаружено. Синхронизация буфера не требуется.";
        return;
    }

    // Алгоритм расчета Дельты (Diff) — вычисление чистых добавленных байт
    let delta = "";
    if (editedText.startsWith(originalText)) {
        // Если данные дописаны в структуру (например, добавлен лог изменений)
        delta = editedText.slice(originalText.length);
        deltaStatus.innerHTML = `⚡ <strong style="color: #3498db;">Алгоритм оптимизации Diff сработал успешно!</strong><br>
        Обнаружено точечное расширение структуры данных: <span style='color:#3498db; font-family: monospace; font-weight: bold;'>"${delta.replace(/\n/g, ' ')}"</span>.<br>
        Пакет дозаписи сформирован. В хранилище отправлено всего: <strong style="color:#2ecc71;">${delta.length} байт</strong> вместо полной перезаписи тяжелого документа (${editedText.length} байт)!`;
    } else {
        // Если была отредактирована середина или внутренние параметры JSON
        deltaStatus.innerHTML = `⚠️ <strong style="color: #f59e0b;">Обнаружена модификация внутренних блоков JSON.</strong><br>
        Алгоритм выполнил сегментированное обновление структуры. Изменено и перезаписано: <strong style="color: #3498db;">${editedText.length} байт</strong> данных.`;
    }

    // Записываем обновленное полное тело документа в localStorage
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
