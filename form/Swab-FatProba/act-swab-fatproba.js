// =========================================================================
// 1. ИНИЦИАЛИЗАЦИЯ СЕРВИСОВ И АВТОПОДСТАНОВКА ДАННЫХ СОТРУДНИКА
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('wash-sd-form') || document.querySelector('form');
    const tableBody = document.getElementById('wash-table-body');
    const btnCancel = document.getElementById('btnCancel');
    const btnSaveArchive = document.getElementById('btnSaveArchive');
    const btnCollapse = document.getElementById('btnCollapse');
    const btnAddSupply = document.getElementById('btnAddSupply');

    if (!form) {
        console.error("Критическая ошибка: Форма с id='wash-sd-form' не найдена!");
        return;
    }

    // Автоматическое извлечение данных сотрудника из локальной сессии системы
    const savedFirstName = localStorage.getItem('userFirstName') || '';
    const savedLastName = localStorage.getItem('userLastName') || '';
    const fullUserName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : '';

    // Подставляем имя контролера/техника в поля формы, если они пустые
    const techField = form.querySelector('[name*="tech" i]') || form.querySelector('[name*="name" i]');
    if (techField && !techField.value) techField.value = fullUserName;

    // Извлекаем draftId из адреса строки браузера (для черновиков)
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId');

    // Переменная-счетчик для уникальной индексации динамических строк таблицы поставщиков
    let rowCounter = 2;

    // Регистрируем перехватчик клавиш на форму
    form.addEventListener('keydown', handleTableNavigation);

        // =========================================================================
    // 2. ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ СТРОК ПОСТАВОК ТАБЛИЦЫ
    // =========================================================================
    function createNewSupplyRow() {
        rowCounter++;
        const nextRow1 = rowCounter;
        rowCounter++;
        const nextRow2 = rowCounter;

        const supplyHtml = `
            <tr>
                <td class="section-row-header" colspan="7">
                    <select name="supplier_select" class="supplier-selector" required>
                        <option value="поставщик1">поставщик №1</option>
                        <option value="поставщик2">поставщик №2</option>
                        <option value="поставщик3">поставщик №3</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td class="text-static">атла чтота</td>
                <td class="text-static">атлас какта</td>
                <td class="text-static">состараны шарового крана</td>
                <td><input type="time" name="time_1" class="table-input tm-l"></td>
                <td class="text-center-bold">1</td>
                <td><input type="text" name="lab_num_1" class="table-input lb-l"></td>
                <td><input type="text" name="il_1" class="table-input lb-l"></td>
            </tr>
            <tr>
                <td class="text-static">атла чтота</td>
                <td class="text-static">атлас какта</td>
                <td class="text-static">состараны латунного коннектора</td>
                <td><input type="time" name="time_2" class="table-input tm-l"></td>
                <td class="text-center-bold">2</td>
                <td><input type="text" name="lab_num_2" class="table-input lb-l"></td>
                <td><input type="text" name="il_2" class="table-input lb-l"></td>
            </tr>
        `;
        if (tableBody) {
            tableBody.insertAdjacentHTML('beforeend', supplyHtml);
        }
    }

    if (btnAddSupply) {
        btnAddSupply.addEventListener('click', (e) => {
            e.preventDefault();
            createNewSupplyRow();
        });
    }

        // =========================================================================
    // 3. ВОССТАНОВЛЕНИЕ ДИНАМИЧЕСКОЙ СТРУКТУРЫ ИЗ ЧЕРНОВИКА
    // =========================================================================
    if (currentDraftId) {
        try {
            const allDrafts = JSON.parse(localStorage.getItem('qa_all_drafts_data')) || {};
            const savedData = allDrafts[currentDraftId]?.fields;

            if (savedData) {
                const savedKeys = Object.keys(savedData);
                let maxIndex = 2;
                
                savedKeys.forEach(key => {
                    if (key.startsWith('time_')) {
                        const num = parseInt(key.split('_')[1], 10);
                        if (num > maxIndex) maxIndex = num;
                    }
                });

                // Генерируем блоки поставок на экране до тех пор, пока структура не совпадет с черновиком
                while (rowCounter < maxIndex) {
                    createNewSupplyRow();
                }

                // Заполняем сгенерированные и базовые поля данными
                Object.keys(savedData).forEach(name => {
                    const field = form.querySelector(`[name="${name}"]`);
                    if (field) {
                        if (field.type === 'checkbox') field.checked = savedData[name];
                        else field.value = savedData[name];
                    }
                });
                console.log(`✅ Черновик прямых поставок успешно подгружен. Восстановлено строк: ${rowCounter}`);
            }
        } catch (e) {
            console.error("Ошибка при восстановлении динамической таблицы:", e);
        }
    }

        // =========================================================================
    // 4. ОБРАБОТЧИКИ КНОПОК ДЕЙСТВИЙ (ЧЕРНОВИК, АРХИВ, ОТМЕНА)
    // =========================================================================
    
    // КНОПКА «СВЕРНУТЬ АКТ»
    if (btnCollapse) {
        btnCollapse.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.QA_Core) return;

            const formData = window.QA_Core.collectData(form);
            const now = Date.now();

            if (!currentDraftId) {
                currentDraftId = 'draft_' + now;
            }

            const shiftColor = formData['shiftColor'] || formData['shift'] || 'ВЫБОР';
            const shiftTime = formData['sutki'] || formData['smena'] || 'ВЫБОР';
            const batchVal = formData['batchCode'] || formData['batch'] || '';
            
            const titleEl = document.querySelector('.main-title');
            let cleanTitle = titleEl ? titleEl.innerText.trim() : 'Прямые поставки';
            if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

            let displayTitle = `💼 ${cleanTitle}`;
            if (shiftColor !== 'ВЫБОР' || shiftTime !== 'ВЫБОР') {
                displayTitle += ` [${shiftColor}/${shiftTime}]`;
            }
            if (batchVal.trim() !== '') {
                displayTitle += ` [Лот: ${batchVal}]`;
            }

            // Запекаем данные в локальную базу черновиков через ядро
            window.QA_Core.saveDraftState(currentDraftId, window.location.pathname, displayTitle, formData);

            form.reset();
            currentDraftId = null;
            window.location.href = '/menu/index.html';
        });
    }

    // КНОПКА «СОХРАНИТЬ В АРХИВ»
    if (btnSaveArchive) {
        btnSaveArchive.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.QA_Core) return;

            const formData = window.QA_Core.collectData(form);
            const archiveId = 'arch_' + Date.now();

            // 1. Публикуем тело документа в архив
            localStorage.setItem(`qaArchive_${archiveId}`, JSON.stringify({
                data: formData,
                savedAt: new Date().toISOString()
            }));

            // 2. Интегрируем паспорт записи в общий реестр архива для отображения в таблице журнала
            let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
            const titleEl = document.querySelector('.main-title');
            let cleanTitle = titleEl ? titleEl.innerText.trim() : 'Прямые поставки';
            if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

            const finalBatchVal = formData['batchCode'] || formData['batch'] || 'БЕЗ БАТЧА';

            archiveActs.unshift({
                id: archiveId,
                date: new Date().toISOString().split('T')[0],
                number: "1.1.0",
                controller: fullUserName || "Не указан",
                actType: cleanTitle,
                batch: finalBatchVal,
                blankPath: window.location.pathname
            });
            localStorage.setItem('archiveActs', JSON.stringify(archiveActs));

            // 3. Вычищаем черновик смены, если он был открыт
            if (currentDraftId) {
                window.QA_Core.clearDraft(currentDraftId);
            }

            alert('Акт успешно за архивирован и сохранен в журнал фабрики!');
            form.reset();
            window.location.href = '/menu/index.html';
        });
    }

    // КНОПКА «ОТМЕНА»
    if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Выйти без сохранения? Вся внесенная информация будет безвозвратно стерта.')) {
                window.location.href = '/menu/index.html';
            }
        });
    }
});

// =========================================================================
// 5. АВТОНОМНОЕ УНИВЕРСАЛЬНОЕ ЯДРО СБОРА ДАННЫХ БЛАНКОВ (QA_CORE)
// =========================================================================
window.QA_Core = {
    KEYS: {
        ACTIVE_ACTS: 'global_active_acts_list',
        ARCHIVE_PREFIX: 'qaArchive_',
        DRAFT_DATA: 'qa_all_drafts_data'
    },
    collectData(formElement) {
        const data = {};
        const fields = formElement.querySelectorAll('input, select, textarea');
        fields.forEach((field, index) => {
            const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
            if (field.type === 'checkbox') {
                data[name] = field.checked;
            } else if (field.type === 'radio') {
                if (field.checked) data[name] = field.value;
            } else {
                data[name] = field.value;
            }
        });
        return data;
    },
    restoreData(formElement, draftId) {
        if (!draftId) return;
        const allDrafts = JSON.parse(localStorage.getItem(this.KEYS.DRAFT_DATA)) || {};
        const savedDraft = allDrafts[draftId];
        if (!savedDraft || !savedDraft.fields) return;
        const fields = formElement.querySelectorAll('input, select, textarea');
        fields.forEach((field, index) => {
            const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
            const savedValue = savedDraft.fields[name];
            if (savedValue !== undefined) {
                if (field.type === 'checkbox') {
                    field.checked = savedValue;
                } else if (field.type === 'radio') {
                    if (field.value === savedValue) field.checked = true;
                } else {
                    field.value = savedValue;
                }
            }
        });
    },
    saveDraftState(draftId, fileUrl, title, fieldsData) {
        const now = Date.now();
        let allDrafts = JSON.parse(localStorage.getItem(this.KEYS.DRAFT_DATA)) || {};
        allDrafts[draftId] = { timestamp: now, fields: fieldsData };
        localStorage.setItem(this.KEYS.DRAFT_DATA, JSON.stringify(allDrafts));

        let acts = JSON.parse(localStorage.getItem(this.KEYS.ACTIVE_ACTS)) || [];
        const existingIndex = acts.findIndex(act => act.id === draftId);
        const actMeta = { id: draftId, url: fileUrl, title: title, updated: now };
        if (existingIndex !== -1) acts[existingIndex] = actMeta;
        else acts.push(actMeta);
        
        localStorage.setItem(this.KEYS.ACTIVE_ACTS, JSON.stringify(acts));
    },
    clearDraft(draftId) {
        if (!draftId) return;
        let acts = JSON.parse(localStorage.getItem(this.KEYS.ACTIVE_ACTS)) || [];
        acts = acts.filter(act => act.id !== draftId);
        localStorage.setItem(this.KEYS.ACTIVE_ACTS, JSON.stringify(acts));

        let allDrafts = JSON.parse(localStorage.getItem(this.KEYS.DRAFT_DATA)) || {};
        delete allDrafts[draftId];
        localStorage.setItem(this.KEYS.DRAFT_DATA, JSON.stringify(allDrafts));
    }
};

// =========================================================================
// 6. АВТОНОМНАЯ НАВИГАЦИЯ КЛАВИШАМИ (ENTER / СТРЕЛКИ) ДЛЯ ДИНАМИЧЕСКИХ СТРОК
// =========================================================================
function handleTableNavigation(e) {
    const validKeys = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
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
            targetInput = allRows[rowIndex + 1].children[colIndex]?.querySelector('input, select');
        }
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIndex > 0) {
            targetInput = allRows[rowIndex - 1].children[colIndex]?.querySelector('input, select');
        }
    } 
    else if (e.key === 'ArrowRight') {
        if (currentInput.selectionStart === currentInput.value.length || currentInput.type === 'select-one') {
            let nextTd = currentTd.nextElementSibling;
            while (nextTd) {
                const input = nextTd.querySelector('input, select');
                if (input && !input.hasAttribute('readonly')) {
                    targetInput = input;
                    break;
                }
                nextTd = nextTd.nextElementSibling;
            }
        }
    } 
    else if (e.key === 'ArrowLeft') {
        if (currentInput.selectionStart === 0 || currentInput.type === 'select-one') {
            let prevTd = currentTd.previousElementSibling;
            while (prevTd) {
                const input = prevTd.querySelector('input, select');
                if (input && !input.hasAttribute('readonly')) {
                    targetInput = input;
                    break;
                }
                prevTd = prevTd.previousElementSibling;
            }
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
// 7. СЛУЖБА АВТОМАТИЧЕСКОГО РАСЧЕТА BATCH CODE ДЛЯ ПРЯМЫХ ПОСТАВОК
// =========================================================================
(function() {
    function updateFatSupplyLotValue() {
        const factorySelect = document.querySelector('select[name*="fabrika" i]') || document.querySelector('select');
        const shiftSelect = document.querySelector('select[name*="smena" i]') || document.querySelectorAll('select')[2]; 
        const dateInput = document.querySelector('input[type="date"]');
        const targetBatchInput = document.querySelector('input[name*="batch" i]') || document.querySelector('[placeholder*="Batch" i]');

        if (!dateInput || !dateInput.value || !targetBatchInput) return;

        const date = new Date(dateInput.value.replace(/-/g, '/'));
        if (isNaN(date.getTime())) return;

        // 1. Извлекаем последнюю цифру года
        const lastYearDigit = date.getFullYear().toString().slice(-1);

        // 2. Вычисляем номер недели по стандарту ISO-8601
        const target = new Date(date.valueOf());
        const dayNum = date.getDay() === 0 ? 7 : date.getDay();
        target.setDate(target.getDate() - dayNum + 4);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
        }
        const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
        const formattedWeek = weekNumber.toString().padStart(2, '0');

        // 3. Вычисляем буквенный маркер дня недели
        const daysLetters = ['G', 'A', 'B', 'C', 'D', 'E', 'F']; 
        const dayLetter = daysLetters[date.getDay()];

        const datePart = lastYearDigit + formattedWeek + dayLetter;

        // 4. Логика кодирования Смены
        let dayPart = "1"; 
        if (shiftSelect && shiftSelect.value.trim().toUpperCase() === "НОЧЬ") dayPart = "2";

        // 5. Логика кодирования Фабрики
        let cityPart = "";
        const factoryVal = factorySelect ? factorySelect.value.trim().toUpperCase() : "";
        if (factoryVal === "ЛУЖНИКИ") cityPart = "LUZ";
        if (factoryVal === "НОВОСИБИРСК") cityPart = "NOV";

        // Записываем итоговый Batch Code в поле
        targetBatchInput.value = datePart + dayPart + cityPart;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const factorySelect = document.querySelector('select[name*="fabrika" i]') || document.querySelector('select');
        const shiftSelect = document.querySelector('select[name*="smena" i]') || document.querySelectorAll('select')[2];
        const dateInput = document.querySelector('input[type="date"]');

        if (factorySelect) factorySelect.addEventListener('change', updateFatSupplyLotValue);
        if (shiftSelect) shiftSelect.addEventListener('change', updateFatSupplyLotValue);
        if (dateInput) dateInput.addEventListener('change', updateFatSupplyLotValue);

        setTimeout(updateFatSupplyLotValue, 400);
    });
})();
