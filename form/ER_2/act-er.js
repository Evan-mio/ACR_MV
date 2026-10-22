// =========================================================================
// 1. БЕЗОПАСНЫЕ ПРЕФИКСЫ (ФИКС ОШИБКИ RE-DECLARATION CONST)
// =========================================================================
if (typeof ARCHIVE_PREFIX === 'undefined') { var ARCHIVE_PREFIX = 'qaArchive_'; }
if (typeof ACTIVE_ACTS_KEY === 'undefined') { var ACTIVE_ACTS_KEY = 'global_active_acts_list'; }
if (typeof DRAFT_DATA_KEY === 'undefined') { var DRAFT_DATA_KEY = 'qa_all_drafts_data'; }
if (typeof SHADOW_PREFIX === 'undefined') { var SHADOW_PREFIX = 'shadow_arch_'; }
if (typeof FINAL_ARCHIVE_PREFIX === 'undefined') { var FINAL_ARCHIVE_PREFIX = 'qaArchive_'; }

var BLANK_VERSION = '4.1.2'; 
var mainForm = null;

// =========================================================================
// 2. ОБРАБОТЧИК ЗАГРУЗКИ СТРАНИЦЫ И РАЗВОРАЧИВАНИЕ ИЗ ХРАНИЛИЩА
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // СНАЧАЛА ГЕНЕРИРУЕМ ТАБЛИЦУ, чтобы поля появились в DOM-дереве
    renderSwabsTable();
    
    mainForm = document.getElementById('wash-sd-form') || document.querySelector('form');
    if (!mainForm) {
        console.error("Критическая ошибка: Форма wash-sd-form не найдена в HTML!");
        return;
    }

    // Привязываем авторасчет Батча к реальным элементам чеклиста крошки
    const citySelect = document.getElementById('cyti') || mainForm.querySelector('[name*="fabrika" i]');
    const daySelect = mainForm.querySelector('[name*="smena" i]') || document.getElementById('day');
    const dateInput = mainForm.querySelector('input[type="date"]');

    if (citySelect) citySelect.addEventListener('change', updateLotValue);
    if (daySelect) daySelect.addEventListener('change', updateLotValue);
    if (dateInput) dateInput.addEventListener('change', updateLotValue);

    updateLotValue(); // Запуск первичного расчета кода

    // Автоматическая подстановка ФИО сотрудника в оба поля разметки крошки
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
            if (confirm('Вы уверены, что хотите выйти? Все несохраненные изменения в чеклисте крошки будут потеряны.')) {
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
            console.error('Ошибка восстановления чеклиста крошки из JSON:', error);
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
    let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации кронки';
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
    let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации крошки';
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

    alert(`Документ крошки успешно сохранен в архив!\nПаспорт ID: ${archiveFinalId}`);
    window.location.href = '/menu/index.html'; 
}

// ====================================================
// 5. АВТОМАТИЧЕСКИЙ РАСЧЕТ BATCH CODE (LOT) ДЛЯ крошки
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
// 7. ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ ТАБЛИЦЫ крошки
// =========================================================================

// 1. Справочники для выпадающих списков (опций)
const binOptions = ['', 'n/a', 'Ok', 'Not Ok'];

const grdOptions = [
    { value: "", group: "" },
  { value: "25108", group: "крошка" },
  { value: "1337565", group: "жир" },
  { value: "1337564", group: "жир" },
  { value: "1117245", group: "жир" },
  { value: "1226674", group: "спрей" },
  { value: "1119397", group: "спрей" }
];

// Вспомогательная функция для сборки Опций Бина
function getBinOptionsHtml(currentRowValue) {
    return binOptions.map(opt => {
        const isSelected = currentRowValue === opt ? 'selected' : '';
        return `<option value="${opt}" ${isSelected}>${opt}</option>`;
    }).join('');
}

// Вспомогательная функция для сборки Опций GRD
function getGrdOptionsHtml(currentRowValue) {
    return grdOptions.map(opt => {
        const isSelected = String(currentRowValue) === opt.value ? 'selected' : '';
        return `<option value="${opt.value}" ${isSelected}>${opt.value}</option>`;
    }).join('');
}

const swabsStructure = [
    {
        zone: "КАЖДАЯ СТРОЧКА - ОТДЕЛЬНЫЙ IL с одним PS",
        rows: [
            { 
                checked: `<input type="checkbox" name="checked_left_1">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "влажный спрей Л1", 
                tochkaName: "возле спрейбарабана", 
                typeName: 1,
                isBinName: "n/a", 
                grdNul: 1, 
                binNum: 1,  
                timeNum: 1, 
                grdNum: 1,  
                labNum: 1, 
                ilNum: 1 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_2">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "влажный спрей Л2", 
                tochkaName: "возле спрейбарабана", 
                typeName: 2,
                isBinName: "n/a", 
                grdNul: 2, 
                binNum: 2,  
                timeNum: 2, 
                grdNum: 2,  
                labNum: 2, 
                ilNum: 2 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_3">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "влажный спрей Л3", 
                tochkaName: "возле спрейбарабана", 
                typeName: 3,
                isBinName: "n/a", 
                grdNul: 3, 
                binNum: 3,  
                timeNum: 3, 
                grdNum: 3,  
                labNum: 3, 
                ilNum: 3 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_4">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "влажный спрей Л4", 
                tochkaName: "возле спрейбарабана", 
                typeName: 4,
                isBinName: "n/a", 
                grdNul: 4, 
                binNum: 4,  
                timeNum: 4, 
                grdNum: 4,  
                labNum: 4, 
                ilNum: 4 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_5">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "жир из сиcтемы Л2", 
                tochkaName: "возле спрейбарабана", 
                typeName: 5,
                isBinName: "n/a", 
                grdNul: 5, 
                binNum: 5,  
                timeNum: 5, 
                grdNum: 5,  
                labNum: 5, 
                ilNum: 5 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_6">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "жир из сиcтемы Л3", 
                tochkaName: "возле спрейбарабана", 
                typeName: 6,
                isBinName: "n/a", 
                grdNul: 6, 
                binNum: 6,  
                timeNum: 6, 
                grdNum: 6,  
                labNum: 6, 
                ilNum: 6 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_7">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "жир из сиcтемы Л4", 
                tochkaName: "возле спрейбарабана", 
                typeName: 7,
                isBinName: "n/a", 
                grdNul: 7, 
                binNum: 7,  
                timeNum: 7, 
                grdNum: 7,  
                labNum: 7, 
                ilNum: 7 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_8">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка линия №1", 
                tochkaName: "Бин под виброконвейером", 
                typeName: 8,
                isBinName: 8, 
                grdNul: "25108",  
                binNum: 8,  
                timeNum: 8, 
                grdNum: 8,  
                labNum: 8, 
                ilNum: 8 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_9">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка линия №1", 
                tochkaName: "Бин под шнеком сушилки №1", 
                typeName: 9,
                isBinName: 9, 
                grdNul: "25108",  
                binNum: 9,  
                timeNum: 9, 
                grdNum: 9,  
                labNum: 9, 
                ilNum: 9 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_10">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка линия №2", 
                tochkaName: "Циклон вытыжки куллера №2", 
                typeName: 10,
                isBinName: 10, 
                grdNul: "25108",  
                binNum: 10,  
                timeNum: 10, 
                grdNum: 10,  
                labNum: 10, 
                ilNum: 10 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_11">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка линия №2", 
                tochkaName: "сушилная печь №2", 
                typeName: 11,
                isBinName: 11, 
                grdNul: "25108",  
                binNum: 11,  
                timeNum: 11, 
                grdNum: 11,  
                labNum: 11, 
                ilNum: 11 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_12">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка линия №3", 
                tochkaName: "Циклон вытыжки куллера №3", 
                typeName: 12,
                isBinName: 12, 
                grdNul: "25108",  
                binNum: 12,  
                timeNum: 12, 
                grdNum: 12,  
                labNum: 12, 
                ilNum: 12 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_13">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка линия №3", 
                tochkaName: "сушилная печь №3", 
                typeName: 13,
                isBinName: 13, 
                grdNul: "25108",  
                binNum: 13,  
                timeNum: 13, 
                grdNum: 13,  
                labNum: 13, 
                ilNum: 13 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_14">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка линия №4", 
                tochkaName: "Циклон вытыжки куллера №4", 
                typeName: 14,
                isBinName: 14, 
                grdNul: "25108",  
                binNum: 14,  
                timeNum: 14, 
                grdNum: 14,  
                labNum: 14, 
                ilNum: 14 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_15">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка линия №4", 
                tochkaName: "сушилная печь №4", 
                typeName: 15,
                isBinName: 15, 
                grdNul: "25108",  
                binNum: 15,  
                timeNum: 15, 
                grdNum: 15,  
                labNum: 15, 
                ilNum: 15 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_16">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка с Fish Line", 
                tochkaName: "Бин под конвейером", 
                typeName: 16,
                isBinName: 16, 
                grdNul: "25108",  
                binNum: 16,  
                timeNum: 16, 
                grdNum: 16,  
                labNum: 16, 
                ilNum: 16 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_17">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c белой упаковочной линии (4)", 
                tochkaName: "Бин под вибростолом", 
                typeName: 17,
                isBinName: 17, 
                grdNul: "25108",  
                binNum: 17,  
                timeNum: 17, 
                grdNum: 17,  
                labNum: 17, 
                ilNum: 17 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_18">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c голубой упаковочной линии (5)", 
                tochkaName: "Бин под конвейером", 
                typeName: 18,
                isBinName: 18, 
                grdNul: "25108",  
                binNum: 18,  
                timeNum: 18, 
                grdNum: 18,  
                labNum: 18, 
                ilNum: 18 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_19">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c зеленой упаковочной линии (6)", 
                tochkaName: "Бин под вибростолом", 
                typeName: 19,
                isBinName: 19, 
                grdNul: "25108",  
                binNum: 19,  
                timeNum: 19, 
                grdNum: 19,  
                labNum: 19, 
                ilNum: 19 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_20">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c фиолетовой упаковочной линии (7)", 
                tochkaName: "Бин под вибростолом", 
                typeName: 20,
                isBinName: 20, 
                grdNul: "25108",  
                binNum: 20,  
                timeNum: 20, 
                grdNum: 20,  
                labNum: 20, 
                ilNum: 20 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_21">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c розовой упаковочной линии (8)", 
                tochkaName: "Бин под конвейером", 
                typeName: 21,
                isBinName: 21, 
                grdNul: "25108",  
                binNum: 21,  
                timeNum: 21, 
                grdNum: 21,  
                labNum: 21, 
                ilNum: 21 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_22">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c желтой упаковочной линии (9)", 
                tochkaName: "Бин под вибростолом", 
                typeName: 22,
                isBinName: 22, 
                grdNul: "25108",  
                binNum: 22,  
                timeNum: 22, 
                grdNum: 22,  
                labNum: 22, 
                ilNum: 22 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_23">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c оранжевой упаковочной линии (10)", 
                tochkaName: "Бин под вибростолом", 
                typeName: 23,
                isBinName: 23, 
                grdNul: "25108",  
                binNum: 23,  
                timeNum: 23, 
                grdNum: 23,  
                labNum: 23, 
                ilNum: 23 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_24">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c конвейера Р-52", 
                tochkaName: "Бин под конвейером", 
                typeName: 24,
                isBinName: 24, 
                grdNul: "25108",  
                binNum: 24,  
                timeNum: 24, 
                grdNum: 24,  
                labNum: 24, 
                ilNum: 24 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_25">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c конвейера Р-53", 
                tochkaName: "Бин под конвейером", 
                typeName: 25,
                isBinName: 25, 
                grdNul: "25108",  
                binNum: 25,  
                timeNum: 25, 
                grdNum: 25,  
                labNum: 25, 
                ilNum: 25 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_26">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c конвейера Р-54", 
                tochkaName: "Бин под конвейером", 
                typeName: 26,
                isBinName: 26, 
                grdNul:"25108",  
                binNum: 26,  
                timeNum: 26, 
                grdNum: 26,  
                labNum: 26, 
                ilNum: 26 
            },
            { 
                checked: `<input type="checkbox" name="checked_left_27">`, 
                atlasNo: "чтота атлас", 
                atlasName: "както атлас", 
                nulName: "крошка c конвейера Р-55", 
                tochkaName: "Бин под конвейером", 
                typeName: 27,
                isBinName: 27, 
                grdNul:"25108",  
                binNum: 27,  
                timeNum: 27, 
                grdNum: 27, 
                labNum: 27, 
                ilNum: 27 
            },
        ]
    }
];

// Функция рендеринга таблицы
function renderSwabsTable() {
    const container = document.getElementById('microbiology-table-container');
    if (!container) return;

    let html = `
        <table class="act-table" style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
                <tr style="background-color: #f1f5f9; font-size: 13px;">
                    <th colspan="2" style="border: 1px solid #cbd5e1; padding: 6px; width: 10%;">чтота атлас</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; width: 10%;">както атлас</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; width: 21%;">Назваание образца</th>
                    <th style="border: 1px solid #d0cbe1; padding: 6px; width: 15%;">точка отбора</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; width: 9%;">Условие отбора</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; width: 3%;">Бин соответствует месту отбора ok/not ok</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; width: 5%;">Время отбора образца</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; width: 7%;">GRD-code</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; width: 10%;">Лаб. №</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; width: 10%;">IL</th>
                </tr>
            </thead>
            <tbody>
    `;

    swabsStructure.forEach(section => {
        html += `
            <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td colspan="11" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${section.zone}</td>
            </tr>
        `;

        section.rows.forEach(row => {
            html += `
                 <tr>
                    <td style="border: 1px solid #fff; padding: 6px; font-size: 0.95rem; text-align: center; width: 2%;">${row.checked}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 0.95rem; text-align: left; font-weight: 700;">${row.atlasNo}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 0.95rem; text-align: left; font-weight: 700;">${row.atlasName}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 0.95rem; text-align: left; font-weight: 700;">${row.nulName}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 0.95rem; text-align: left; font-weight: 700;">${row.tochkaName}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 0.95rem; text-align: center; font-weight: 700;">${row.typeName}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 0.95rem; text-align: center; font-weight: 700;">
                        <select name="is_bin_left_${row.binNul}" style="text-align: center; font-weight: 700">
                            ${getBinOptionsHtml(row.isBinName)}
                        </select>
                    </td>
                    <td style="border: 1px solid #fff; padding: 4px; font-weight: 700;">
                        <input type="time" name="time_left_${row.timeNum}" style="width: 100%; border: 1px solid #cbd5e1; padding: 2px; font-size: 0.95rem;">
                    </td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: 700; font-size: 0.95rem;">
                        <select name="grd_nul_left_${row.grdNum}" style="text-align: center; font-weight: 700">
                            ${getGrdOptionsHtml(row.grdNul)}
                        </select>
                    </td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: 700;">
                        <input type="text" name="lab_left_${row.labNum}" placeholder="...." style="width: 100%; border: 1px solid #cbd5e1; padding: 2px; font-size: 0.95rem;">
                    </td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: 700;">
                        <input type="text" name="il_left_${row.ilNum}" placeholder="...." style="width: 100%; border: 1px solid #cbd5e1; padding: 2px; font-size: 0.95rem;">
                    </td>
                </tr>
            `;
        });
    });

    html += `
            </tbody>
        </table>
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

