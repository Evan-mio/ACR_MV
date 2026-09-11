// =========================================================================
// 1. БЕЗОПАСНЫЕ ПРЕФИКСЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// =========================================================================
if (typeof ARCHIVE_PREFIX === 'undefined') { var ARCHIVE_PREFIX = 'qaArchive_'; }
if (typeof ACTIVE_ACTS_KEY === 'undefined') { var ACTIVE_ACTS_KEY = 'global_active_acts_list'; }
if (typeof DRAFT_DATA_KEY === 'undefined') { var DRAFT_DATA_KEY = 'qa_all_drafts_data'; }
if (typeof SHADOW_PREFIX === 'undefined') { var SHADOW_PREFIX = 'shadow_arch_'; }
if (typeof FINAL_ARCHIVE_PREFIX === 'undefined') { var FINAL_ARCHIVE_PREFIX = 'qaArchive_'; }

var BLANK_VERSION = '4.1.0'; 
var mainForm = null;

// Переменные Excel-пакета
var sheetsData = {};     
var sheetCounter = 1;    
var activeTabId = null;  
var tabList = null;      

// =========================================================================
// 2. ОБРАБОТЧИК ЗАГРУЗКИ СТРАНИЦЫ И РАЗВОРАЧИВАНИЕ ЧЕРНОВИКА
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    mainForm = document.getElementById('wash-sd-form') || document.querySelector('form');
    tabList = document.getElementById('tab-list') || document.querySelector('.tabs-container');

    if (!mainForm) {
        console.error("Критическая ошибка: Форма не найдена в HTML!");
        return;
    }

    // Привязка авторасчета Батча
    const citySelect = document.getElementById('cyti') || mainForm.querySelector('[name*="fabrika" i]');
    const daySelect = mainForm.querySelector('[name*="smena" i]') || document.getElementById('day');
    const dateInput = mainForm.querySelector('input[type="date"]') || document.getElementById('doc-date');
    const shiftColorSelect = document.getElementById('shift-color');

    if (citySelect) citySelect.addEventListener('change', updateLotValue);
    if (daySelect) daySelect.addEventListener('change', updateLotValue);
    if (dateInput) dateInput.addEventListener('change', updateLotValue);
    if (shiftColorSelect) shiftColorSelect.addEventListener('change', updateLotValue);

    updateLotValue(); 

    // Автоматическое ФИО сотрудника
    const savedFirstName = localStorage.getItem('userFirstName') || '';
    const savedLastName = localStorage.getItem('userLastName') || '';
    const fullUserName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : '';

    const techFieldUpper = mainForm.querySelector('[name*="tech" i]') || mainForm.querySelector('[id*="tech" i]');
    const nameFieldLower = mainForm.querySelector('[name*="lab" i]') || mainForm.querySelector('[name="name" i]');
    
    if (techFieldUpper && !techFieldUpper.value) techFieldUpper.value = fullUserName;
    if (nameFieldLower && !nameFieldLower.value) nameFieldLower.value = fullUserName;

    // Кнопки управления
    const btnCancel = document.getElementById('btnCancel');
    const btnSaveArchive = document.getElementById('btnSaveArchive') || document.getElementById('saveArchiveBtn');
    const btnCollapse = document.getElementById('btnCollapse') || document.getElementById('collapseBtn');

    if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти? Изменения будут потеряны.')) {
                window.location.href = '/menu/index.html';
            }
        });
    }
    if (btnCollapse) { btnCollapse.addEventListener('click', (e) => { e.preventDefault(); handleCollapse(); }); }
    if (btnSaveArchive) {
        btnSaveArchive.removeAttribute('onclick');
        btnSaveArchive.addEventListener('click', (e) => { e.preventDefault(); handleSaveArchive(); });
    }

    // Чтение параметров URL и восстановление пакета листов
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId'); 
    let currentMode = urlParams.get('mode'); 
    let hasRestoredSheets = false;

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

            if (foundData) {
                const targetData = foundData.meta ? foundData.meta : foundData;
                
                // Заполняем Шапку (исключая инпуты внутри таблиц)
                mainForm.querySelectorAll('input, select, textarea').forEach((field, index) => {
                    if (field.closest('.act-table') || field.closest('table')) return;

                    const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
                    const savedValue = targetData[name];
                    
                    if (savedValue !== undefined) {
                        if (field.type === 'checkbox') { field.checked = savedValue; } 
                        else { field.value = savedValue; }
                    }

                    if (currentMode === 'view') {
                        field.readOnly = true; field.disabled = true;
                        field.style.backgroundColor = '#f1f5f9'; field.style.color = '#475569';
                    }
                });

                // Восстановление динамических Excel-листов
                if (foundData['excel_sheets_package'] && Object.keys(foundData['excel_sheets_package']).length > 0) {
                    sheetsData = foundData['excel_sheets_package'];
                    const keys = Object.keys(sheetsData).map(Number);
                    sheetCounter = Math.max(...keys) + 1;

                    if (tabList) tabList.innerHTML = '';
                    keys.forEach(id => { renderTabElement(id); });

                    const firstKey = keys[0];
                    const firstTab = tabList ? tabList.querySelector(`[data-sheet-id="${firstKey}"]`) : null;
                    if (firstTab) {
                        switchTab(firstTab);
                        loadSheetData(firstKey);
                    }
                    hasRestoredSheets = true;
                }
                updateLotValue();
            }
        } catch (error) {
            console.error('Ошибка разворачивания черновика:', error);
        }
    }

    // Если это новый документ — создаем стартовый Лист 1
    if (!hasRestoredSheets) {
        if (!tabList) { createDynamicTabListElement(); }
        window.addNewSheet();
    }

    if (currentMode === 'view') {
        ['#btnCollapse', '#collapseBtn', '#btnSaveArchive', '#saveArchiveBtn'].forEach(sel => {
            const el = document.getElementById(sel) || document.querySelector(sel);
            if (el) el.style.setProperty('display', 'none', 'important');
        });
    }

    setTimeout(updateShadowArchiveCopy, 600);
    mainForm.addEventListener('input', updateShadowArchiveCopy);
    mainForm.addEventListener('change', updateShadowArchiveCopy);
});

// Хелпер авто-создания контейнера вкладок, если его забыли добавить в HTML
function createDynamicTabListElement() {
    const tableWrapper = document.querySelector('.table-container, .act-table-wrapper');
    if (tableWrapper) {
        const newTabsWin = document.createElement('div');
        newTabsWin.className = 'tabs-container';
        newTabsWin.style.cssText = 'margin-bottom: 15px; display: flex; gap: 8px; flex-wrap: wrap;';
        tabList = document.createElement('div');
        tabList.id = 'tab-list';
        tabList.style.cssText = 'display: flex; gap: 6px;';
        newTabsWin.appendChild(tabList);
        tableWrapper.parentNode.insertBefore(newTabsWin, tableWrapper);
    }
}

// =========================================================================
// 3. МЕХАНИКА УПРАВЛЕНИЯ ВКЛАДКАМИ И ИХ ИМЕНАМИ
// =========================================================================
window.addNewSheet = function() {
    saveCurrentSheetData(); 
    const id = sheetCounter;
    sheetCounter++;

    sheetsData[id] = {
        name: `Лист ${id}`,
        rows: []
    };
    renderTabElement(id);
};

function renderTabElement(id) {
    if (!tabList) return;
    const tab = document.createElement('div');
    tab.className = 'btn btn-outline-secondary';
    tab.style.cssText = 'cursor: pointer; padding: 6px 12px; font-size: 12px; font-weight: 600; user-select: none;';
    tab.innerText = sheetsData[id].name; 
    tab.dataset.sheetId = String(id);

    tab.addEventListener('click', () => {
        saveCurrentSheetData(); 
        switchTab(tab);         
        loadSheetData(id);      
    });

    tabList.appendChild(tab);
    switchTab(tab);
    loadSheetData(id);
}

function switchTab(selectedTab) {
    if (!tabList) return;
    const allTabs = tabList.querySelectorAll('.btn, div[data-sheet-id]');
    allTabs.forEach(t => {
        t.style.backgroundColor = '#ffffff';
        t.style.color = '#2563eb';
        t.style.borderColor = '#cbd5e1';
    });
    
    selectedTab.style.backgroundColor = '#2563eb';
    selectedTab.style.color = '#ffffff';
    selectedTab.style.borderColor = '#2563eb';

    activeTabId = Number(selectedTab.dataset.sheetId); 
}

function editSheetName() {
    if (!activeTabId) { alert('Сначала добавьте или выберите лист!'); return; }
    const currentTabElement = tabList && tabList.querySelector(`[data-sheet-id="${activeTabId}"]`);
    if (!currentTabElement) return;

    const newName = prompt('Введите новое название листа:', currentTabElement.innerText);
    if (newName && newName.trim() !== '') {
        const cleanName = newName.trim();
        currentTabElement.innerText = cleanName; 
        if (sheetsData[activeTabId]) {
            sheetsData[activeTabId].name = cleanName; 
        }
    }
}

// =========================================================================
// 4. СЧИТЫВАНИЕ И ЗАПИСЬ ДАННЫХ ИЗ ФИЗИЧЕСКОЙ HTML ТАБЛИЦЫ
// =========================================================================
function saveCurrentSheetData() {
    if (!activeTabId || !sheetsData[activeTabId]) return;

    const tableRows = document.querySelectorAll('.act-table tbody tr, table tbody tr');
    const rowsData = [];

    tableRows.forEach((tr) => {
        if (tr.classList.contains('section-row-header')) return; 

        const rowInputs = tr.querySelectorAll('input, select');
        if (rowInputs.length > 0) {
            const cellValues = [];
            rowInputs.forEach(input => { cellValues.push(input.value); });
            rowsData.push(cellValues);
        }
    });
    sheetsData[activeTabId].rows = rowsData; 
}

function loadSheetData(id) {
    if (!sheetsData[id]) return;

    const tableRows = document.querySelectorAll('.act-table tbody tr, table tbody tr');
    const savedRows = sheetsData[id].rows;

    let rowIndex = 0;
    tableRows.forEach((tr) => {
        if (tr.classList.contains('section-row-header')) return;

        const rowInputs = tr.querySelectorAll('input, select');
        if (rowInputs.length > 0) {
            if (savedRows && savedRows[rowIndex]) {
                rowInputs.forEach((input, inputIndex) => {
                    input.value = savedRows[rowIndex][inputIndex] || '';
                });
            } else {
                rowInputs.forEach(input => { input.value = ''; });
            }
            rowIndex++; // Буква "Ф" успешно ликвидирована!
        }
    });
}

// =========================================================================
// 5. ИНТЕГРАЦИЯ С СИСТЕМОЙ АРХИВАЦИИ И КНОПКАМИ ПОДВАЛА
// =========================================================================
function collectFormData() {
    if (!mainForm) return {};
    saveCurrentSheetData(); 
    
    const data = {};
    mainForm.querySelectorAll('input, select, textarea').forEach((field, index) => {
        if (field.closest('.act-table') || field.closest('table')) return; 
        const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
        data[name] = field.type === 'checkbox' ? field.checked : field.value;
    });

    data['excel_sheets_package'] = sheetsData; 
    return data;
}

function handleCollapse() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId') || 'draft_' + Date.now();
    const formData = collectFormData();
    const now = Date.now();

    const targetInput = document.getElementById('batch-code-field') || mainForm.querySelector('input[name*="batch" i]') || mainForm.querySelector('input[name="batchCode"]');
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

    if (existsIndex !== -1) registry[existsIndex] = meta; else registry.push(meta);
    localStorage.setItem(ACTIVE_ACTS_KEY, JSON.stringify(registry));

    if (mainForm) mainForm.reset();
    alert('Акт успешно свернут в черновик со всеми листами!');
    window.location.href = '/menu/index.html'; 
}

function updateShadowArchiveCopy() {
    if (!mainForm) return;
    const urlParams = new URLSearchParams(window.location.search);
    const currentDraftId = urlParams.get('draftId') || 'temp';
    localStorage.setItem(`${SHADOW_PREFIX}${currentDraftId}`, JSON.stringify({
        meta: collectFormData(), shadowSavedAt: new Date().toISOString(), status: 'shadow'
    }));
}

function handleSaveArchive() {
    if (typeof validateForm === 'function' && !validateForm()) return;
    updateShadowArchiveCopy();

    const urlParams = new URLSearchParams(window.location.search);
    const currentDraftId = urlParams.get('draftId') || 'temp';
    const shadowDataRaw = localStorage.getItem(`${SHADOW_PREFIX}${currentDraftId}`);
    if (!shadowDataRaw) { alert('Ошибка: Данные пусты.'); return; }

    const shadowObj = JSON.parse(shadowDataRaw);
    const now = new Date();
    let archiveFinalId = (currentDraftId && currentDraftId.includes('-')) ? currentDraftId : generateArchiveStandardId();

    shadowObj.status = 'published';
    shadowObj.savedAt = now.toISOString();
    localStorage.setItem(`${FINAL_ARCHIVE_PREFIX}${archiveFinalId}`, JSON.stringify(shadowObj));

    let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
    const titleEl = document.querySelector('.main-title');
    let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации смывов';
    
    const targetInput = document.getElementById('batch-code-field') || mainForm.querySelector('input[name*="batch" i]') || mainForm.querySelector('input[name="batchCode"]');
    let finalBatchVal = targetInput && targetInput.value.trim() ? targetInput.value.trim() : 'БЕЗ БАТЧА';

    archiveActs.unshift({
        id: archiveFinalId, date: now.toISOString().split('T')[0], number: `АКТ-${now.getTime().toString().slice(-6)}`,
        controller: localStorage.getItem('userLastName') || "Не указан", actType: cleanTitle, batch: finalBatchVal, blankPath: '../архив/хранилище/index.html'
    });
    localStorage.setItem('archiveActs', JSON.stringify(archiveActs));

    localStorage.removeItem(`${SHADOW_PREFIX}${currentDraftId}`);
    localStorage.setItem(ACTIVE_ACTS_KEY, JSON.stringify((JSON.parse(localStorage.getItem(ACTIVE_ACTS_KEY)) || []).filter(a => a.id !== currentDraftId)));
    
    let allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
    delete allDrafts[currentDraftId];
    localStorage.setItem(DRAFT_DATA_KEY, JSON.stringify(allDrafts));

    alert(`Документ успешно сохранен в архив!\nID: ${archiveFinalId}`);
    window.location.href = '/menu/index.html'; 
}

// Авторасчет Batch-кода
function updateLotValue() {
    const citySelect = document.getElementById('cyti');
    const daySelect = document.getElementById('day');
    const dateInput = document.getElementById('doc-date') || document.querySelector('input[type="date"]');
    const targetInput = document.querySelector('input[name="batchCode"]');

    if (!dateInput || !dateInput.value || !targetInput) return;
    const date = new Date(dateInput.value);
    if (isNaN(date.getTime())) return;

    const lastYearDigit = date.getFullYear().toString().slice(-1);
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);

    const daysLetters = ['G', 'A', 'B', 'C', 'D', 'E', 'F']; 
    const datePart = lastYearDigit + weekNumber.toString().padStart(2, '0') + daysLetters[date.getDay()];
    const dayPart = daySelect && daySelect.value === "ДЕНЬ" ? "1" : (daySelect && daySelect.value === "НОЧЬ" ? "2" : "");
    const cityPart = citySelect && citySelect.value === "ЛУЖНИКИ" ? "LUZ" : (citySelect && citySelect.value === "НОВОСИБИРСК" ? "NOV" : "");

    targetInput.value = datePart + dayPart + cityPart;
}

// Умные стрелочки навигации
function handleTableNavigation(e) {
    const validKeys = ['Enter', 'ArrowUp', 'ArrowDown'];
    if (!validKeys.includes(e.key)) return;
    const currentInput = e.target;
    if (currentInput.tagName !== 'INPUT' && currentInput.tagName !== 'SELECT') return;

    const currentTd = currentInput.closest('td');
    const currentTr = currentInput.closest('tr');
    if (!currentTd || !currentTr) return;

    const tableBody = currentTr.closest('tbody');
    const colIndex = Array.from(currentTr.children).indexOf(currentTd);
    const allRows = Array.from(tableBody.querySelectorAll('tr'));
    const rowIndex = allRows.indexOf(currentTr);
    let targetInput = null;

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault(); if (rowIndex < allRows.length - 1) targetInput = allRows[rowIndex + 1].children[colIndex].querySelector('input, select');
    } else if (e.key === 'ArrowUp') {
        e.preventDefault(); if (rowIndex > 0) targetInput = allRows[rowIndex - 1].children[colIndex].querySelector('input, select');
    }
    if (targetInput) { targetInput.focus(); if (typeof targetInput.select === 'function') targetInput.select(); }
}
document.addEventListener('keydown', handleTableNavigation);
