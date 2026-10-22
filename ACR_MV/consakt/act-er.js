// =========================================================================
// 1. БЕЗОПАСНЫЕ ПРЕФИКСЫ (ФИКС ОШИБКИ RE-DECLARATION CONST)
// =========================================================================
if (typeof ARCHIVE_PREFIX === 'undefined') { var ARCHIVE_PREFIX = 'qaArchive_'; }
if (typeof ACTIVE_ACTS_KEY === 'undefined') { var ACTIVE_ACTS_KEY = 'global_active_acts_list'; }
if (typeof DRAFT_DATA_KEY === 'undefined') { var DRAFT_DATA_KEY = 'qa_all_drafts_data'; }
if (typeof SHADOW_PREFIX === 'undefined') { var SHADOW_PREFIX = 'shadow_arch_'; }
if (typeof FINAL_ARCHIVE_PREFIX === 'undefined') { var FINAL_ARCHIVE_PREFIX = 'qaArchive_'; }

var BLANK_VERSION = '2.1.0'; 
var mainForm = null;

// =========================================================================
// 2. ОБРАБОТЧИК ЗАГРУЗКИ СТРАНИЦЫ И РАЗВОРАЧИВАНИЕ ИЗ ХРАНИЛИЩА
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 🔥 СНАЧАЛА ГЕНЕРИРУЕМ ТАБЛИЦУ, чтобы поля появились в DOM-дереве
    renderSwabsTable();
    
    mainForm = document.getElementById('wash-sd-form') || document.querySelector('form');
    if (!mainForm) {
        console.error("Критическая ошибка: Форма wash-sd-form не найдена в HTML!");
        return;
    }

    // Привязываем авторасчет Батча к реальным элементам чеклиста смывов
    const citySelect = document.getElementById('cyti') || mainForm.querySelector('[name*="fabrika" i]');
    const daySelect = mainForm.querySelector('[name*="smena" i]') || document.getElementById('day');
    const dateInput = mainForm.querySelector('input[type="date"]');

    if (citySelect) citySelect.addEventListener('change', updateLotValue);
    if (daySelect) daySelect.addEventListener('change', updateLotValue);
    if (dateInput) dateInput.addEventListener('change', updateLotValue);

    updateLotValue(); // Запуск первичного расчета кода

    // Автоматическая подстановка ФИО сотрудника в оба поля разметки смывов
    const savedFirstName = localStorage.getItem('userFirstName') || '';
    const savedLastName = localStorage.getItem('userLastName') || '';
    const fullUserName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : '';

    // Ищем верхнее поле Техника и нижнее поле Лаборанта
    const techFieldUpper = mainForm.querySelector('[name*="tech" i]') || mainForm.querySelector('[id*="tech" i]');
    const nameFieldLower = mainForm.querySelector('[name*="lab" i]') || mainForm.querySelector('[name="name" i]');
    
    if (techFieldUpper && !techFieldUpper.value) techFieldUpper.value = fullUserName;
    if (nameFieldLower && !nameFieldLower.value) nameFieldLower.value = fullUserName;

    // Кнопки управления чеклистом микробиологии
    const btnCancel = document.getElementById('btnCancel');
    const btnSaveArchive = document.getElementById('btnSaveArchive') || document.getElementById('saveArchiveBtn');
    const btnCollapse = document.getElementById('btnCollapse') || document.getElementById('collapseBtn');

    if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти? Все несохраненные изменения в чеклисте смывов будут потеряны.')) {
                window.location.href = '/menu/index.html';
            }
        });
    }

    if (btnCollapse) {
        btnCollapse.addEventListener('click', (e) => {
            e.preventDefault();
            handleCollapse(); // Запуск логики черновика
        });
    }

    if (btnSaveArchive) {
        btnSaveArchive.removeAttribute('onclick'); // Зачистка инлайн-атрибутов
        btnSaveArchive.addEventListener('click', (e) => {
            e.preventDefault();
            handleSaveArchive(); // Запуск логики публикации в архив
        });
    }

    // Чтение параметров URL для разворачивания документа из памяти
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId'); 
    let currentMode = urlParams.get('mode'); 

    if (currentDraftId) {
        try {
            const allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
            let foundData = allDrafts[currentDraftId]?.fields;

            if (!foundData) {
                const archivedDocRaw = localStorage.getItem(`${ARCHIVE_PREFIX}${currentDraftId}`);
                if (archivedDocRaw) {
                    const parsedObj = JSON.parse(archivedDocRaw);
                    foundData = parsedObj.data ? parsedObj.data : parsedObj;
                }
            }

            // Пошагово заполняем чеклист сохраненными значениями
            if (foundData) {
                const targetData = foundData.meta ? foundData.meta : foundData;
                
                mainForm.querySelectorAll('input, select, textarea').forEach((field, index) => {
                    const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
                    const savedValue = targetData[name];
                    
                    if (savedValue !== undefined) {
                        if (field.type === 'checkbox') {
                            field.checked = savedValue;
                        } else {
                            field.value = savedValue;
                        }
                    }

                    // 🔥 АВТОМАТИЧЕСКАЯ ЗАЩИТА РЕЖИМА "ПРОСМОТР" (MODE = VIEW)
                    if (currentMode === 'view') {
                        field.readOnly = true;
                        field.disabled = true;
                        field.style.backgroundColor = '#f1f5f9'; 
                        field.style.color = '#475569';
                        field.style.cursor = 'not-allowed';
                    }
                });
                updateLotValue();
            }
        } catch (error) {
            console.error('Ошибка восстановления чеклиста смывов из JSON:', error);
        }
    }

    // Полное скрытие кнопок управления при режиме просмотра view
    if (currentMode === 'view') {
        const elementsToHide = ['#btnCollapse', '#collapseBtn', '#btnSaveArchive', '#saveArchiveBtn'];
        elementsToHide.forEach(selector => {
            const el = document.getElementById(selector) || document.querySelector(selector);
            if (el) el.style.setProperty('display', 'none', 'important');
        });
    }

    // Запуск фонового резервного копирования
    setTimeout(updateShadowArchiveCopy, 600);
    mainForm.addEventListener('input', updateShadowArchiveCopy);
    mainForm.addEventListener('change', updateShadowArchiveCopy);
});

// ====================================================
// 3. СБОР И СВЕРТЫВАНИЕ В ЧЕРНОВИК (ПОД СТРУКТУРУ QA_CORE)
// ====================================================
function collectFormData() {
    if (!mainForm) return {};
    const data = {};
    mainForm.querySelectorAll('input, select, textarea').forEach((field, index) => {
        const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
        data[name] = field.type === 'checkbox' ? field.checked : field.value;
    });
    return data;
}

function handleCollapse() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId') || 'draft_' + Date.now();
    
    const formData = collectFormData();
    const now = Date.now();

    // Съем живого значения Батча с экрана для карточки черновика в главном меню
    const targetInput = document.getElementById('batch-code-field') || mainForm.querySelector('input[name*="batch" i]');
    const batchVal = targetInput && targetInput.value.trim() ? targetInput.value.trim() : '';

    const titleEl = document.querySelector('.main-title');
    let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации смывов';
    if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

    const displayTitle = `💼 ${cleanTitle} ${batchVal ? '['+batchVal+']' : ''}`;

    let allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
    allDrafts[currentDraftId] = { timestamp: now, fields: formData };
    localStorage.setItem(DRAFT_DATA_KEY, JSON.stringify(allDrafts));

    let registry = JSON.parse(localStorage.getItem(ACTIVE_ACTS_KEY)) || [];
    const existsIndex = registry.findIndex(a => a.id === currentDraftId);
    
    const meta = { id: currentDraftId, url: window.location.pathname, title: displayTitle, updated: now };

    if (existsIndex !== -1) registry[existsIndex] = meta;
    else registry.push(meta);
    localStorage.setItem(ACTIVE_ACTS_KEY, JSON.stringify(registry));

    if (mainForm) mainForm.reset();
    alert('Акт успешно свернут в черновик. Оригинал обнулен!');
    window.location.href = '/menu/index.html'; 
}

// ====================================================
// 4. СИСТЕМА ПРОМЫШЛЕННОЙ АРХИВАЦИИ И ТЕНЕВОГО КОПИРОВАНИЯ
// ====================================================
function generateArchiveStandardId() {
    const operatorId = localStorage.getItem('userId') || '000';
    const cleanOperator = operatorId.trim().replace(/\s+/g, ''); 
    return `${BLANK_VERSION}-${cleanOperator}`;
}

function updateShadowArchiveCopy() {
    if (!mainForm) return;
    const urlParams = new URLSearchParams(window.location.search);
    const currentDraftId = urlParams.get('draftId') || 'temp';
    const formData = collectFormData();

    localStorage.setItem(`${SHADOW_PREFIX}${currentDraftId}`, JSON.stringify({
        meta: formData, shadowSavedAt: new Date().toISOString(), status: 'shadow'
    }));
}

function handleSaveArchive() {
    if (typeof validateForm === 'function' && !validateForm()) return;
    updateShadowArchiveCopy();

    const urlParams = new URLSearchParams(window.location.search);
    const currentDraftId = urlParams.get('draftId') || 'temp';
    
    const shadowDataRaw = localStorage.getItem(`${SHADOW_PREFIX}${currentDraftId}`);
    if (!shadowDataRaw) { alert('Ошибка: Данные документа пусты.'); return; }

    const shadowObj = JSON.parse(shadowDataRaw);
    const now = new Date();

    let archiveFinalId = (currentDraftId && currentDraftId.includes('-')) ? currentDraftId : generateArchiveStandardId();

    // 1. ПУБЛИКАЦИЯ / ОБНОВЛЕНИЕ ТЕЛА ФАЙЛА ДАННЫХ
    shadowObj.status = 'published';
    shadowObj.savedAt = now.toISOString();
    localStorage.setItem(`${FINAL_ARCHIVE_PREFIX}${archiveFinalId}`, JSON.stringify(shadowObj));

    // 2. ИНТЕГРАЦИЯ В ОБЩУЮ ТАБЛИЦУ ЖУРНАЛА АРХИВА (archive.html)
    let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
    
    const titleEl = document.querySelector('.main-title');
    let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации смывов';
    if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

    const savedLastName = localStorage.getItem('userLastName') || '';
    const savedFirstName = localStorage.getItem('userFirstName') || '';
    const controllerName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : "Не указан";
    
    // ЖЕСТКИЙ СЪЕМ БАТЧ-КОДА С ЭКРАНА СИЛОЙ (ОБХОД ОЧИСТКИ FORM-DATA)
    const targetInput = document.getElementById('batch-code-field') || mainForm.querySelector('input[name*="batch" i]');
    let finalBatchVal = 'БЕЗ БАТЧА';
    if (targetInput && targetInput.value.trim() !== '') {
        finalBatchVal = targetInput.value.trim();
    }
    
    const thisBlankPath = '../архив/хранилище/index.html';

    const archiveRegistryEntry = {
        id: archiveFinalId, 
        date: now.toISOString().split('T')[0], // Чистый текстовый формат ГГГГ-ММ-ДД
        number: `АКТ-${now.getTime().toString().slice(-6)}`, 
        controller: controllerName,
        actType: cleanTitle,
        batch: finalBatchVal, // В таблице архива будет точный лот (например, 622E)
        blankPath: thisBlankPath
    };

    const existingIndex = archiveActs.findIndex(act => act.id === archiveFinalId);
    if (existingIndex !== -1) archiveActs[existingIndex] = archiveRegistryEntry; 
    else archiveActs.unshift(archiveRegistryEntry); 
    
    localStorage.setItem('archiveActs', JSON.stringify(archiveActs));

    // 3. ПОЛНАЯ ОЧИСТКА ПАМЯТИ ЧЕРНОВИКОВ СМЕНЫ
    localStorage.removeItem(`${SHADOW_PREFIX}${currentDraftId}`);

    let registry = JSON.parse(localStorage.getItem('global_active_acts_list')) || [];
    registry = registry.filter(a => a.id !== currentDraftId);
    localStorage.setItem('global_active_acts_list', JSON.stringify(registry));

    let allDrafts = JSON.parse(localStorage.getItem('qa_all_drafts_data')) || {};
    delete allDrafts[currentDraftId];
    localStorage.setItem('qa_all_drafts_data', JSON.stringify(allDrafts));

    alert(`Документ смывов успешно сохранен в архив!\nПаспорт ID: ${archiveFinalId}`);
    window.location.href = '/menu/index.html'; 
}

// ====================================================
// 5. АВТОМАТИЧЕСКИЙ РАСЧЕТ BATCH CODE (LOT) ДЛЯ СМЫВОВ
// ====================================================
// Базовые элементы шапки
    const citySelect = document.getElementById('cyti');
    const daySelect = document.getElementById('day');
    const dateInput = document.getElementById('doc-date');
    const targetInput = document.querySelector('input[name="batchCode"]');
    const shiftColorSelect = document.getElementById('shift-color');

    // --- БЛОК 1: АВТОМАТИЧЕСКИЙ РАСЧЕТ BATCH CODE (LOT) ---
    function updateLotValue() {
        if (!dateInput || !dateInput.value || !targetInput) return;

        const date = new Date(dateInput.value);
        if (isNaN(date.getTime())) return;

        // 1. Логика года и недели (ISO-8601)
        const lastYearDigit = date.getFullYear().toString().slice(-1);
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
        }
        const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
        const formattedWeek = weekNumber.toString().padStart(2, '0');

        // Буква дня недели (Пн = A ... Вс = G)
        const daysLetters = ['G', 'A', 'B', 'C', 'D', 'E', 'F']; 
        const dayLetter = daysLetters[date.getDay()];
        const datePart = lastYearDigit + formattedWeek + dayLetter;

        // 2. Логика времени суток (Смена)
        let dayPart = "";
        if (daySelect && daySelect.value === "ДЕНЬ") dayPart = "1";
        if (daySelect && daySelect.value === "НОЧЬ") dayPart = "2";

        // 3. Логика города
        let cityPart = "";
        if (citySelect && citySelect.value === "ЛУЖНИКИ") cityPart = "LUZ";
        if (citySelect && citySelect.value === "НОВОСИБИРСК") cityPart = "NOV";

        // Запись результирующей строки
        targetInput.value = datePart + dayPart + cityPart;
    }

    // Слушатели генерации LOT кода
    if (citySelect) citySelect.addEventListener('change', updateLotValue);
    if (daySelect) daySelect.addEventListener('change', updateLotValue);
    if (dateInput) dateInput.addEventListener('change', updateLotValue);
    if (shiftColorSelect) shiftColorSelect.addEventListener('change', updateLotValue);

    // Первичный запуск расчета LOT
    updateLotValue();


// ====================================================
// 6. НАВИГАЦИЯ ПО ТАБЛИЦЕ КЛАВИШАМИ (ENTER / СТРЕЛКИ)
// ====================================================
function handleTableNavigation(e) {
    const validKeys = ['Enter', 'ArrowUp', 'ArrowDown'];
    if (!validKeys.includes(e.key)) return;

    const currentInput = e.target;
    if (currentInput.tagName !== 'INPUT' && currentInput.tagName !== 'SELECT') return;

    const currentTd = currentInput.closest('td');
    const currentTr = currentInput.closest('tr');
    if (!currentTd || !currentTr) return;

    const tableBody = currentTr.closest('tbody');
    if (!tableBody) return;

    const colIndex = Array.from(currentTr.children).indexOf(currentTd);
    const allRows = Array.from(tableBody.querySelectorAll('tr'));
    const rowIndex = allRows.indexOf(currentTr);

    let targetInput = null;

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault(); 
        if (rowIndex < allRows.length - 1) {
            targetInput = allRows[rowIndex + 1].children[colIndex].querySelector('input, select');
        }
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIndex > 0) {
            targetInput = allRows[rowIndex - 1].children[colIndex].querySelector('input, select');
        }
    }

    if (targetInput) {
        targetInput.focus();
        if (typeof targetInput.select === 'function') {
            targetInput.select();
        }
    }
}

// =========================================================================
// 7. ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ ТАБЛИЦЫ СМЫВОВ
// =========================================================================

// Структурированные данные акта (Добавлены недостающие ID для генерации уникальных name)
// { 
//                 checked: `<input type="checkbox" name="checked_1">`, 
//                 atlasNo: "чтота атлас", 
//                 atlasName: "както атлас", 
//                 obrazName: "", 
//                 tochkaName: "", 
//                 yserName: "",
//                 isBin: 1,
//                 typeName: 1,
//                 timeNum: 1, 
//                 grdNum: 1, 
//                 labNum: 1,  
//                 ilNum: 1
//             },
const swabsStructure = [
    {
        zone: "КАЖДАЯ СТРОЧКА - ОТДЕЛЬНЫЙ IL с одним PS (СПРЕИ, ЖИРЫ)",
        rows: [
            { 
                checked: `<input type="checkbox" name="checked_1">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                obrazName: "Влажныйй спрей Л1", 
                tochkaName: "Возле спрей баробана",
                yserName: "отбирает опиратор участка, оформляет контролер",
                isBin: 1,
                typeName: 1,
                timeNum: 1, 
                grdNum: 1, 
                labNum: 1,  
                ilNum: 1
            },
            { 
                checked: `<input type="checkbox" name="checked_2">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                obrazName: "Влажныйй спрей Л2", 
                tochkaName: "Возле спрей баробана", 
                yserName: "отбирает опиратор участка, оформляет контролер",
                isBin: 2,
                typeName: 2,
                timeNum: 2, 
                grdNum: 2, 
                labNum: 2,  
                ilNum: 2
            },
            { 
                checked: `<input type="checkbox" name="checked_3">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                obrazName: "Влажныйй спрей Л3", 
                tochkaName: "Возле спрей баробана", 
                yserName: "отбирает опиратор участка, оформляет контролер",
                isBin: 3,
                typeName: 3,
                timeNum: 3, 
                grdNum: 3, 
                labNum: 3,  
                ilNum: 3
            },
            { 
                checked: `<input type="checkbox" name="checked_4">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                obrazName: "Влажныйй спрей Л4", 
                tochkaName: "Возле спрей баробана", 
                yserName: "отбирает опиратор участка, оформляет контролер",
                isBin: 4,
                typeName: 4,
                timeNum: 4, 
                grdNum: 4, 
                labNum: 4,  
                ilNum: 4
            },
            { 
                checked: `<input type="checkbox" name="checked_5">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                obrazName: "Жир из системы Л2", 
                tochkaName: "Возле спрей баробана", 
                yserName: "отбирает опиратор участка, оформляет контролер",
                isBin: 5,
                typeName: 5,
                timeNum: 5, 
                grdNum: 5, 
                labNum: 5,  
                ilNum: 5
            },
            { 
                checked: `<input type="checkbox" name="checked_6">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                obrazName: "Жир из системы Л4", 
                tochkaName: "Возле спрей баробана", 
                yserName: "отбирает опиратор участка, оформляет контролер",
                isBin: 6,
                typeName: 6,
                timeNum: 6, 
                grdNum: 6, 
                labNum: 6,  
                ilNum: 6
            },
            { 
                checked: `<input type="checkbox" name="checked_7">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                obrazName: "Жир из системы Л4", 
                tochkaName: "Возле спрей баробана", 
                yserName: "отбирает опиратор участка, оформляет контролер",
                isBin: 7,
                typeName: 7,
                timeNum: 7, 
                grdNum: 7, 
                labNum: 7,  
                ilNum: 7
            }
        ]
    },
];

// Функция рендеринга таблицы
function renderSwabsTable() {
    const container = document.getElementById('microbiology-table-container');
    if (!container) return;

    // Обертка в карточку .microbiology-card для красивых скруглений и теней
    let html = `
        <div class="microbiology-card">
            <table class="act-table">
                <thead>
                    <tr>
                        <th colspan="2" style="width: 10%;">Атлас №</th>
                        <th style="width: 10%;">Атлас Наименование</th>
                        <th style="width: 13%;">Название образца</th>
                        <th style="width: 20%;">Точка отбора</th>
                        <th style="width: 10%;">Условия отбора</th>
                        <th style="width: 5%;">Бин соотв.?</th>
                        <th style="width: 5%;">Время отбора</th>
                        <th style="width: 8%;">GRD-code</th>
                        <th style="width: 8%;">Лаб. №</th>
                        <th style="width: 8%;">IL</th>
                    </tr>
                </thead>
                <tbody>
    `;

    swabsStructure.forEach(section => {
        // Красивый информационный разделитель зоны
        html += `
            <tr class="table-zone-header">
                <td colspan="11" style="text-align: center;"> ${section.zone}</td>
            </tr>
        `;

        section.rows.forEach(row => {
            // Модифицируем чекбокс, добавляя ему класс стиля
            let beautifulCheckbox = row.checked;
            if (beautifulCheckbox.includes('type="checkbox"')) {
                beautifulCheckbox = beautifulCheckbox.replace('type="checkbox"', 'type="checkbox" class="table-checkbox"');
            }

            html += `
                <tr>
                    <td style="text-align: center;">${beautifulCheckbox}</td>
                    <td style="font-weight: 600; color: #1e293b;">${row.atlasNo}</td>
                    <td style="font-weight: 500;">${row.atlasName}</td>
                    <td>${row.obrazName || '<span style="color:#94a3b8; font-weight:400;">—</span>'}</td>
                    <td>${row.tochkaName || '<span style="color:#94a3b8; font-weight:400;">—</span>'}</td>
                    <td style="text-align: center;">${row.yserName || '—'}</td>
                    <td>
                        <select class="table-select status-select">
                            <option value="n/a" ${row.isBin === 'n/a' || !row.isBin ? 'selected' : ''}>n/a</option>
                            <option value="Ok" ${row.isBin === 'Ok' ? 'selected' : ''} style="color: #16a34a; font-weight: bold;">Ok</option>
                            <option value="Not Ok" ${row.isBin === 'Not Ok' ? 'selected' : ''} style="color: #dc2626; font-weight: bold;">Not Ok</option>
                        </select>
                    </td>
                    <td>
                        <input type="time" name="time_${row.timeNum}" class="table-input" style="font-weight: bold; font-size: 0.95rem;">
                    </td>
                    <td>
                        <select name="grd_${row.timeNum}" class="table-select status-select">
                            <option value="1226674" ${row.grdNum === '1226674' || !row.grdNum ? 'selected' : ''}>1226674</option>
                            <option value="1119397" ${row.grdNum === '1119397' ? 'selected' : ''}>1119397</option>
                            <option value="1336575" ${row.grdNum === '1336575' ? 'selected' : ''}>1336575</option>
                            <option value="1336574" ${row.grdNum === '1336574' ? 'selected' : ''}>1336574</option>
                            <option value="25180" ${row.grdNum === '25180' ? 'selected' : ''}>25180</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" name="lab_${row.labNum}" placeholder="...." class="table-input" style="text-align: center;">
                    </td>
                    <td>
                        <input type="text" name="il_${row.ilNum}" placeholder="...." class="table-input" style="text-align: center;">
                    </td>
                </tr>
            `;
        });
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// ====================================================
// 8. АВТОМАТИЧЕСКАЯ ФИКСАЦИЯ ВРЕМЕНИ ПРИ КЛИКЕ НА ЧЕКБОКС (АДАПТИРОВАННАЯ)
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Слушаем клики на общем контейнере, куда рендерится таблица из Блока 7
    const tableContainer = document.getElementById('microbiology-table-container');

    if (tableContainer) {
        tableContainer.addEventListener('change', (e) => {
            // Проверяем, что изменение произошло именно в чекбоксе
            if (e.target && e.target.type === 'checkbox') {
                const checkbox = e.target;
                const currentRow = checkbox.closest('tr');
                
                if (!currentRow) return;

                // Находим поле времени в рамках этой же строки
                const timeInput = currentRow.querySelector('input[type="time"]');

                if (timeInput) {
                    if (checkbox.checked) {
                        // Записываем текущее локальное время
                        const now = new Date();
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        
                        timeInput.value = `${hours}:${minutes}`;
                    } else {
                        // Очищаем, если чекбокс сняли
                        timeInput.value = '';
                    }

                    // Обязательно уведомляем систему автосохранения
                    timeInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    }
});

