// =========================================================================
// 1. БЕЗОПАСНЫЕ ПРЕФИКСЫ И НАСТРОЙКИ
// =========================================================================
if (typeof ARCHIVE_PREFIX === 'undefined') { var ARCHIVE_PREFIX = 'qaArchive_'; }
if (typeof ACTIVE_ACTS_KEY === 'undefined') { var ACTIVE_ACTS_KEY = 'global_active_acts_list'; }
if (typeof DRAFT_DATA_KEY === 'undefined') { var DRAFT_DATA_KEY = 'qa_all_drafts_data'; }
if (typeof SHADOW_PREFIX === 'undefined') { var SHADOW_PREFIX = 'shadow_arch_'; }
if (typeof FINAL_ARCHIVE_PREFIX === 'undefined') { var FINAL_ARCHIVE_PREFIX = 'qaArchive_'; }

var BLANK_VERSION = '2.2.0'; 
var mainForm = null;
let rowCounter = 0; 

// =========================================================================
// 2. ИНИЦИАЛИЗАЦИЯ И РАЗВОРАЧИВАНИЕ ЧЕРНОВИКОВ
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    mainForm = document.getElementById('wash-sd-form') || document.querySelector('form');
    if (!mainForm) {
        console.error("Критическая ошибка: Форма не найдена в HTML!");
        return;
    }

    // Слушатели для авторасчета Батч-кода
    const citySelect = document.getElementById('cyti') || mainForm.querySelector('[name*="fabrika" i]');
    const daySelect = mainForm.querySelector('[name*="smena" i]') || document.getElementById('day');
    const dateInput = mainForm.querySelector('input[type="date"]') || document.getElementById('doc-date');
    const shiftColorSelect = document.getElementById('shift-color');

    if (citySelect) citySelect.addEventListener('change', updateLotValue);
    if (daySelect) daySelect.addEventListener('change', updateLotValue);
    if (dateInput) dateInput.addEventListener('change', updateLotValue);
    if (shiftColorSelect) shiftColorSelect.addEventListener('change', updateLotValue);

    // Автоподстановка ФИО
    const savedFirstName = localStorage.getItem('userFirstName') || '';
    const savedLastName = localStorage.getItem('userLastName') || '';
    const fullUserName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : '';

    const techFieldUpper = mainForm.querySelector('[name*="tech" i]') || mainForm.querySelector('[id*="tech" i]');
    const nameFieldLower = mainForm.querySelector('[name*="lab" i]') || mainForm.querySelector('[name="name" i]');
    
    if (techFieldUpper && !techFieldUpper.value) techFieldUpper.value = fullUserName;
    if (nameFieldLower && !nameFieldLower.value) nameFieldLower.value = fullUserName;

    // Привязка кнопок действий
    const btnCancel = document.getElementById('btnCancel') || document.querySelector('.btn-secondary');
    const btnSaveArchive = document.getElementById('btnSaveArchive') || document.getElementById('saveArchiveBtn') || document.querySelector('.btn-success');
    const btnCollapse = document.getElementById('btnCollapse') || document.getElementById('collapseBtn') || document.querySelector('.btn-warning');
    const btnAddSupply = document.getElementById('btnAddSupply') || document.querySelector('.btn-primary') || document.querySelector('[id*="Supply" i]');

    if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти? Все несохраненные изменения будут потеряны.')) {
                window.location.href = '/menu/index.html';
            }
        });
    }

    if (btnCollapse) {
        btnCollapse.addEventListener('click', (e) => {
            e.preventDefault();
            handleCollapse();
        });
    }

    if (btnSaveArchive) {
        btnSaveArchive.removeAttribute('onclick');
        btnSaveArchive.addEventListener('click', (e) => {
            e.preventDefault();
            handleSaveArchive();
        });
    }

    if (btnAddSupply) {
        btnAddSupply.addEventListener('click', (e) => {
            e.preventDefault();
            createNewSupplyRow();
        });
    }

    // Проверка режима работы (Новый бланк vs Черновик)
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

            if (foundData) {
                const targetData = foundData.meta ? foundData.meta : foundData;
                
                // Воссоздаем динамические строки на основе сохраненного клик-счетчика
                const savedClicks = parseInt(targetData['__dynamic_clicks_count'], 10) || 0;
                for (let i = 0; i < savedClicks; i++) {
                    createNewSupplyRow();
                }

                // Заполняем поля значениями
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

                    // Режим просмотра (VIEW)
                    if (currentMode === 'view') {
                        field.readOnly = true;
                        field.disabled = true;
                        field.style.backgroundColor = '#f1f5f9'; 
                        field.style.color = '#475569';
                        field.style.cursor = 'not-allowed';
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка восстановления чеклиста:', error);
        }
    } else {
        // Логика очистки исходника для другого/нового пользователя
        if (mainForm) {
            mainForm.reset();
            rowCounter = 0;
            document.querySelectorAll('.dynamic-supplier-row, .dynamic-data-row').forEach(el => el.remove());
        }
    }

    if (currentMode === 'view') {
        const elementsToHide = ['#btnCollapse', '#collapseBtn', '#btnSaveArchive', '#saveArchiveBtn', '#btnAddSupply', '.btn-primary', '.btn-warning', '.btn-success'];
        elementsToHide.forEach(selector => {
            const el = document.getElementById(selector) || document.querySelector(selector);
            if (el) el.style.setProperty('display', 'none', 'important');
        });
    }

    updateLotValue();
    setTimeout(updateShadowArchiveCopy, 600);
    mainForm.addEventListener('input', updateShadowArchiveCopy);
    mainForm.addEventListener('change', updateShadowArchiveCopy);
});

// ====================================================
// 3. СБОР ДАННЫХ И СВЕРТЫВАНИЕ В ЧЕРНОВИК
// ====================================================
function collectFormData() {
    if (!mainForm) return {};
    const data = {};
    mainForm.querySelectorAll('input, select, textarea').forEach((field, index) => {
        const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
        data[name] = field.type === 'checkbox' ? field.checked : field.value;
    });
    // Сохраняем точное число кликов добавления строк
    data['__dynamic_clicks_count'] = Math.ceil(rowCounter / 2);
    return data;
}

function handleCollapse() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId') || 'draft_' + Date.now();
    
    const formData = collectFormData();
    const now = Date.now();

    const targetInput = document.getElementById('batch-code-field') || mainForm.querySelector('input[name="batchCode"]');
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

    alert('Акт успешно свернут в черновик!');
    window.location.href = '/menu/index.html'; 
}

// ====================================================
// 4. СИСТЕМА АРХИВАЦИИ И ТЕНЕВОГО КОПИРОВАНИЯ
// ====================================================
function generateArchiveStandardId() {
    const operatorId = localStorage.getItem('userId') || '000';
    return `${BLANK_VERSION}-${operatorId.trim().replace(/\s+/g, '')}`;
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
    if (!shadowDataRaw) { 
        alert('Ошибка: Данные документа пусты.'); return; 
    }
    
    const shadowObj = JSON.parse(shadowDataRaw);
    const now = new Date();
    let archiveFinalId = (currentDraftId && currentDraftId.includes('-')) ? currentDraftId : 
    generateArchiveStandardId();
    
    shadowObj.status = 'published';
    shadowObj.savedAt = now.toISOString();
    localStorage.setItem(`${FINAL_ARCHIVE_PREFIX}${archiveFinalId}`, 
        JSON.stringify(shadowObj));
        
        let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
        const titleEl = document.querySelector('.main-title');
        let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации смывов';
        
        if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();
        
        const savedLastName = localStorage.getItem('userLastName') || '';
        const savedFirstName = localStorage.getItem('userFirstName') || '';
        const controllerName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : "Не указан";

        
        const targetInput = document.getElementById('batch-code-field') || 
        mainForm.querySelector('input[name="batchCode"]');
        let finalBatchVal = targetInput && targetInput.value.trim() ? targetInput.value.trim() : 'БЕЗ БАТЧА';
        
        const archiveRegistryEntry = {
            id: archiveFinalId,
            date: now.toISOString().split('T')[0],
            number:` АКТ-${now.getTime().toString().slice(-6)}`,
            controller: controllerName,
            actType: cleanTitle,
            batch: finalBatchVal,
            blankPath: '../архив/хранилище/index.html'
        };
        
        const existingIndex = archiveActs.findIndex(act => act.id === archiveFinalId);
        if (existingIndex !== -1) archiveActs[existingIndex] = archiveRegistryEntry;
        else archiveActs.unshift(archiveRegistryEntry);
        
        localStorage.setItem('archiveActs', JSON.stringify(archiveActs));
        localStorage.removeItem(`${SHADOW_PREFIX}${currentDraftId}`);
        
        let registry = JSON.parse(localStorage.getItem('global_active_acts_list')) || [];
        localStorage.setItem('global_active_acts_list', JSON.stringify(registry.filter(a => a.id !== currentDraftId)));
        
        let allDrafts = JSON.parse(localStorage.getItem('qa_all_drafts_data')) || {};
        delete allDrafts[currentDraftId];
        localStorage.setItem('qa_all_drafts_data', JSON.stringify(allDrafts));
        
        // ИСПРАВЛЕНО: Добавлены косые кавычки `...` внутрь alert
        alert(`Документ смывов успешно сохранен в архив!\nID: ${archiveFinalId}`);
            window.location.href = '/menu/index.html'; 
    }
    
    // ====================================================
    // 5. РАСЧЕТ BATCH CODE И ДИНАМИЧЕСКИЕ СТРОКИ
    // ====================================================
    function updateLotValue() {
        const citySelect = document.getElementById('cyti') || 
        mainForm.querySelector('[name*="fabrika" i]');
        
        const daySelect = mainForm.querySelector('[name*="smena" i]') || 
        document.getElementById('day');
        
        const dateInput = mainForm.querySelector('input[type="date"]') || 
        document.getElementById('doc-date');
        
        const targetInput = mainForm.querySelector('input[name="batchCode"]') || 
        document.getElementById('batch-code-field');
        
        if (!dateInput || !dateInput.value || !targetInput) return;
        
        const date = new Date(dateInput.value);
        if (isNaN(date.getTime())) return;
        
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

        const daysLetters = ['G', 'A', 'B', 'C', 'D', 'E', 'F'];
        const dayLetter = daysLetters[date.getDay()];
        const datePart = lastYearDigit + formattedWeek + dayLetter;
        
        let dayPart = "";
        if (daySelect && daySelect.value === "ДЕНЬ") dayPart = "1";
        if (daySelect && daySelect.value === "НОЧЬ") dayPart = "2";

        let cityPart = "";
        if (citySelect && citySelect.value.toUpperCase().includes("ЛУЖНИКИ")) cityPart = "LUZ";
        if (citySelect && citySelect.value.toUpperCase().includes("НОВОСИБИРСК")) cityPart = "NOV";
        
        targetInput.value = datePart + dayPart + cityPart;
    }
    
    function createNewSupplyRow() {
        const tableBody = document.querySelector('#wash-sd-form table tbody') || 
        document.querySelector('table tbody');
        if (!tableBody) return;
        
        rowCounter++;
        const idx1 = rowCounter;
        rowCounter++;
        const idx2 = rowCounter;
        
        const supplyHtml = `
        <tr class="dynamic-supplier-row">
            <td class="section-row-header" colspan="7">
                <select name="supplier_select_${idx1}" class="supplier-selector" required>
                    <option value="поставщик1">поставщик №1</option>
                    <option value="поставщик2">поставщик №2</option>
                    <option value="поставщик3">поставщик №3</option>
                </select>
            </td>
        </tr>
        <tr class="dynamic-data-row">
            <td class="text-static">атла чтота</td>
            <td class="text-static">атлас какта</td>
            <td class="text-static">состараны шарового крана</td>
            <td><input type="time" name="time_${idx1}" class="table-input tm-l"></td>
            <td class="text-center-bold">${idx1}</td>
            <td><input type="text" name="lab_num_${idx1}" class="table-input lb-l"></td>
            <td><input type="text" name="il_${idx1}" class="table-input lb-l"></td>
        </tr>
        <tr class="dynamic-data-row">
            <td class="text-static">атла чтота</td>
            <td class="text-static">атлас какта</td>
            <td class="text-static">состараны латунного коннектора</td>
            <td><input type="time" name="time_${idx2}" class="table-input tm-2"></td>
            <td class="text-center-bold">${idx2}</td>
            <td><input type="text" name="lab_num_${idx2}" class="table-input lb-2"></td>
            <td><input type="text" name="il_${idx2}" class="table-input lb-2"></td>
        </tr>
    `;
    // 4. Безопасно добавляем строки в самый конец таблицы
    tableBody.insertAdjacentHTML('beforeend', supplyHtml);
}
