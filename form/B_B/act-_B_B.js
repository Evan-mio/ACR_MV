// ====================================================
// 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КЛЮЧИ LOCALSTORAGE
// ====================================================
let sheetsData = {};
let sheetCounter = 1;
let activeTabId = null; // Числовой ID активной вкладки

let tabList = null;
let tableBody = null;
let nake1Input = null;
let nake2Input = null;
let labLotInput = null;
let mainForm = null;

// Стандартизированные ключи хранилища проекта ACR
const ACTIVE_ACTS_KEY = 'global_active_acts_list'; 
const DRAFT_DATA_KEY = 'qa_all_drafts_data';


// ====================================================
// 2. ИНИЦИАЛИЗАЦИЯ И ОБРАБОТКА ЗАГРУЗКИ СТРАНИЦЫ
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Привязываем элементы к переменным
    tabList = document.getElementById('tab-list');
    tableBody = document.getElementById('table-body');
    nake1Input = document.getElementById('sheet-nake-1');
    nake2Input = document.getElementById('sheet-nake-2');
    labLotInput = document.getElementById('sheet-lab-lot');
    mainForm = document.getElementById('wash-sd-form');

    const citySelect = document.getElementById('cyti');
    const daySelect = document.getElementById('day');
    const dateInput = document.getElementById('doc-date');
    const shiftColorSelect = document.getElementById('shift-color');

    // Навешиваем слушатели на шапку
    if (citySelect) citySelect.addEventListener('change', updateLotValue);
    if (daySelect) daySelect.addEventListener('change', updateLotValue);
    if (dateInput) dateInput.addEventListener('change', updateLotValue);
    if (shiftColorSelect) shiftColorSelect.addEventListener('change', updateLotValue);

    updateLotValue();
    initDatalists(); // Подгружаем выпадающую базу 

    // Кнопки управления
    const btnEditSheetName = document.getElementById('btnEditSheetName');
    const btnAddRow = document.getElementById('btnAddRow');
    const btnAddRows5 = document.getElementById('btnAddRows5');
    const btnAddRows15 = document.getElementById('btnAddRows15');
    const btnCancel = document.getElementById('btnCancel');
    const btnSaveArchive = document.getElementById('btnSaveArchive');
    const btnCollapse = document.getElementById('btnCollapse');

    if (btnAddRow) btnAddRow.addEventListener('click', (e) => { e.preventDefault(); addTableRows(1); });
    if (btnAddRows5) btnAddRows5.addEventListener('click', (e) => { e.preventDefault(); addTableRows(5); });
    if (btnAddRows15) btnAddRows15.addEventListener('click', (e) => { e.preventDefault(); addTableRows(15); });
    if (btnEditSheetName) btnEditSheetName.addEventListener('click', (e) => { e.preventDefault(); editSheetName(); });
    if (btnCollapse) btnCollapse.addEventListener('click', (e) => { e.preventDefault(); handleCollapse(); });
    if (btnSaveArchive) btnSaveArchive.addEventListener('click', (e) => { e.preventDefault(); handleSaveArchive(); });
    
    if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти без сохранения? Все новые изменения будут потеряны.')) {
                window.location.href = '/menu/index.html';
            }
        });
    }

    // Слушатели интерактивных изменений в таблице (ввод + клики мыши из базы)
    if (tableBody) {
        const handleTableChanges = (e) => {
            if (!e.target.name) return;

            if (e.target.name.startsWith('no_car_')) {
                const tr = e.target.closest('tr');
                updateRowLot(tr);
            }
            validateTableNakeConsistency(); // Вызывает блок расчета и валидации Nake
        };

        tableBody.addEventListener('input', handleTableChanges);
        tableBody.addEventListener('change', handleTableChanges);
        tableBody.addEventListener('keydown', handleTableNavigation);
    }

    // Разбор параметров URL-строки браузера
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId'); 
    let currentMode = urlParams.get('mode'); // Получаем режим: view или edit

    if (currentDraftId) {
        try {
            // ШАГ 1. Сначала пытаемся найти документ в реестре активных черновиков смены
            const allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
            let foundData = allDrafts[currentDraftId]?.fields;

            // ШАГ 2. Если в черновиках файла нет — значит, этот запрос пришёл из Архива
            if (!foundData) {
                const archivedDocRaw = localStorage.getItem(`${ARCHIVE_PREFIX}${currentDraftId}`);
                if (archivedDocRaw) {
                    // Распаковываем полную внутреннюю структуру архивного файла
                    foundData = JSON.parse(archivedDocRaw).data;
                }
            }

            // ШАГ 3. Если данные успешно найдены в любой из баз — восстанавливаем бланк
            if (foundData) {
                if (foundData.meta && mainForm) {
                    Object.keys(foundData.meta).forEach(name => {
                        const field = mainForm.querySelector(`[name="${name}"]`);
                        if (field) field.value = foundData.meta[name];
                    });
                }

                sheetsData = {}; 
                if (tabList) tabList.innerHTML = '';

                if (foundData.sheets && Object.keys(foundData.sheets).length > 0) {
                    let maxId = 0;
                    Object.keys(foundData.sheets).forEach(idStr => {
                        const id = Number(idStr);
                        maxId = Math.max(maxId, id);
                        sheetsData[id] = foundData.sheets[idStr];

                        const tab = document.createElement('div');
                        tab.className = 'btn btn-outline-secondary';
                        tab.style.cursor = 'pointer';
                        tab.innerText = sheetsData[id].name || `Лист ${id}`;
                        tab.dataset.sheetId = String(id);

                        tab.addEventListener('click', () => {
                            // Разрешаем сохранять вкладку только если это НЕ режим просмотра
                            if (currentMode !== 'view') saveCurrentSheetData();
                            switchTab(tab);
                            loadSheetData(id);
                        });

                        if (tabList) tabList.appendChild(tab);
                    });
                    sheetCounter = maxId + 1;

                    const firstTab = tabList.firstElementChild;
                    if (firstTab) {
                        switchTab(firstTab);
                        loadSheetData(Number(firstTab.dataset.sheetId));
                    }
                } else {
                    addNewSheet();
                }
                updateLotValue();
            } else {
                // Если ID в URL передан, но в памяти такого файла нет — строим чистый бланк
                generateFreshInitialSheets();
            }
        } catch (error) {
            console.error('Ошибка восстановления данных документа:', error);
            generateFreshInitialSheets();
        }
    } else {
        // Если ID в URL вообще отсутствует — генерируем 10 стандартных листов с нуля
        generateFreshInitialSheets();
    }

    // 🔥 АВТОМАТИЧЕСКАЯ ЗАЩИТА РЕЖИМА "ПРОСМОТР" (MODE = VIEW)
    if (currentMode === 'view') {
        // 1. Намертво блокируем все инпуты, селекты и текстовые зоны формы
        const inputsToBlock = document.querySelectorAll('input, select, textarea');
        inputsToBlock.forEach(field => {
            field.readOnly = true;
            field.disabled = true;
            field.style.backgroundColor = '#f1f5f9'; // Системный светло-серый цвет блокировки
            field.style.color = '#475569';
            field.style.cursor = 'not-allowed';
        });

        // 2. Скрываем кнопки изменения строк, переименования вкладок и сохранения
        const elementsToHide = [
            '#btnAddRow', '#btnAddRows5', '#btnAddRows15',
            '#btnEditSheetName', '#btnCollapse', '#btnSaveArchive',
            '#collapseBtn', '#saveArchiveBtn'
        ];
        elementsToHide.forEach(selector => {
            const el = document.getElementById(selector) || document.querySelector(selector);
            if (el) el.style.setProperty('display', 'none', 'important');
        });

        // 3. Скрываем кнопку "Добавить лист", если она отрендерилась без ID
        const allActionButtons = document.querySelectorAll('.btn, button');
        allActionButtons.forEach(btn => {
            if (btn.textContent.includes('Добавить лист')) {
                btn.style.setProperty('display', 'none', 'important');
            }
        });

        // 4. Перехватываем функцию переименования вкладок через двойной клик или prompt
        window.editSheetName = function() { return false; };
    }
});

// Вспомогательная изолированная функция генерации 10 стартовых листов
function generateFreshInitialSheets() {
    if (typeof addNewSheet === 'function') {
        for (let i = 0; i < 10; i++) {
            // Передаем false, чтобы листы генерировались без моргания экрана
            addNewSheet(false);
        }
        // Делаем активным самый первый Лист 1 по умолчанию
        const firstTab = tabList ? tabList.firstElementChild : null;
        if (firstTab) {
            switchTab(firstTab);
            loadSheetData(Number(firstTab.dataset.sheetId));
        }
    }
}

/// ====================================================
// 3. АВТОМАТИЧЕСКИЕ РАСЧЕТЫ: НОМЕРА ПРОБ, ИМЕНА И БАТЧ-ЛОТЫ
// ====================================================
function validateTableNakeConsistency() {
    if (!tableBody || !nake1Input || !nake2Input) return;
    const rows = tableBody.querySelectorAll('tr');
    if (rows.length === 0) return;

    if (typeof NAKE_PRODUCKT_DATABASE === 'undefined') return;

    let firstActiveNake = null;
    let firstActiveNakeName = null;
    let currentProbaNumber = 1; // 🔥 ИСПРАВЛЕНО: Базовый номер инициализируется с 1
    let lastFilledRowForProba = null;

    // ШАГ 1: Сканируем таблицу и находим САМУЮ ПЕРВУЮ заполненную строку с валидным GRD
    for (let i = 0; i < rows.length; i++) {
        const grdInput = rows[i].querySelector('[name^="grd_"]');
        if (grdInput && grdInput.value.trim() !== "") {
            const grdValue = parseInt(grdInput.value.trim());
            const foundProd = NAKE_PRODUCKT_DATABASE.find(item => item.GRD === grdValue);
            
            if (foundProd && foundProd.Nake) {
                firstActiveNake = foundProd.Nake;
                firstActiveNakeName = foundProd.NakeName || "";
                break; // Нашли эталон — выходим из цикла поиска
            }
        }
    }

    // ШАГ 2: Фиксируем или очищаем поля Nake в шапке листа на основе эталона
    if (firstActiveNake !== null) {
        if (nake1Input.value !== String(firstActiveNake)) nake1Input.value = firstActiveNake;
        if (nake2Input.value !== firstActiveNakeName) nake2Input.value = firstActiveNakeName;
    } else {
        nake1Input.value = "";
        nake2Input.value = "";
    }

    // ШАГ 3: Обход строк таблицы для комплексного расчета и валидации
    rows.forEach((currentRow) => {
        const casInput = currentRow.querySelector('[name^="cas_"]');
        const minInput = currentRow.querySelector('[name^="min_"]');
        const lineInput = currentRow.querySelector('[name^="no_line_"]');
        const grdInput = currentRow.querySelector('[name^="grd_"]');
        const nameInput = currentRow.querySelector('[name^="name-prod_"]') || currentRow.querySelector('[name^="name_prod_"]');
        const carInput = currentRow.querySelector('[name^="no_car_"]');
        const meshInput = currentRow.querySelector('[name^="no_mesh_"]');
        const probaInput = currentRow.querySelector('[name^="proba_"]');

        // Динамическая ленивая привязка datalist подсказок к новым и старым строкам
        if (lineInput && !lineInput.hasAttribute('list')) lineInput.setAttribute('list', 'linesList');
        if (grdInput && !grdInput.hasAttribute('list')) grdInput.setAttribute('list', 'grdList');
        if (carInput && !carInput.hasAttribute('list')) carInput.setAttribute('list', 'carsList');

        if (!grdInput || !nameInput) return;

        const grdValue = parseInt(grdInput.value.trim());

        // Проверка и очистка статуса ячейки GRD
        if (isNaN(grdValue) || grdInput.value.trim() === "") {
            if (nameInput.value === "Найк не соответствует продукту!") nameInput.value = "";
            nameInput.style.color = "#000";
            nameInput.style.backgroundColor = "#fff";
            nameInput.style.fontWeight = "normal";
        } else {
            const currentProd = NAKE_PRODUCKT_DATABASE.find(item => item.GRD === grdValue);

            if (currentProd) {
                // Если продукт совпадает с эталоном Nake первого заполненного инпута
                if (firstActiveNake === null || currentProd.Nake === firstActiveNake) {
                    nameInput.value = currentProd.GRDName || "";
                    nameInput.style.color = "#000";
                    nameInput.style.backgroundColor = "#fff";
                    nameInput.style.fontWeight = "normal";
                } else {
                    // 🛑 ПРОДУКТ ИЗ ДРУГОЙ СЕРИИ NAKE: Жесткое уведомление об ошибке
                    nameInput.value = "Найк не соответствует продукту!";
                    nameInput.style.color = "red";
                    nameInput.style.backgroundColor = "#ffebeb"; // Мягкая красная подсветка
                    nameInput.style.fontWeight = "bold";
                }
            } else {
                nameInput.value = "КОД НЕ НАЙДЕН В БАЗЕ!";
                nameInput.style.color = "orange";
                nameInput.style.backgroundColor = "#fffdf0";
            }
        }

        // Блок автоматического пошагового расчета номеров точечных проб (proba_)
        if (!casInput || !minInput || !lineInput || !probaInput) return;

        const currentCas = casInput.value.trim();
        const currentMin = minInput.value.trim();
        const currentLine = lineInput.value.trim();

        if (!currentCas || !currentMin || !currentLine) {
            probaInput.value = "";
            probaInput.style.color = "";
            probaInput.style.fontWeight = "";
            return; 
        }

        if (lastFilledRowForProba === null) {
            currentProbaNumber = 1;
            probaInput.value = "1";
            probaInput.style.color = "";
            probaInput.style.fontWeight = "";
            lastFilledRowForProba = currentRow; 
            return;
        }

        const prevCas = lastFilledRowForProba.querySelector('[name^="cas_"]').value.trim();
        const prevMin = lastFilledRowForProba.querySelector('[name^="min_"]').value.trim();
        const prevLine = lastFilledRowForProba.querySelector('[name^="no_line_"]').value.trim();

        // 🔥 ОПТИМИЗИРОВАНО: Корректный расчет шага и фиксация изменений серий
        if (currentCas === prevCas && currentMin === prevMin && currentLine === prevLine) {
            // Если параметры совпадают с предыдущей строкой — номер пробы остается прежним
            if (currentProbaNumber >= 16) {
                probaInput.value = "Превышено количество проб!";
                probaInput.style.color = "red";
                probaInput.style.fontWeight = "bold";
            } else {
                probaInput.value = currentProbaNumber.toString();
                probaInput.style.color = "";
                probaInput.style.fontWeight = "";
            }
        } else {
            // Если параметры изменились — номер пробы увеличивается на 1
            currentProbaNumber += 1;
            if (currentProbaNumber >= 16) {
                probaInput.value = "Превышено количество проб!";
                probaInput.style.color = "red";
                probaInput.style.fontWeight = "bold";
            } else {
                probaInput.value = currentProbaNumber.toString();
                probaInput.style.color = "";
                probaInput.style.fontWeight = "";
            }
        }

        lastFilledRowForProba = currentRow;
    });
}

// 🔥 ФУНКЦИЯ-МОСТ ДЛЯ СОВМЕСТИМОСТИ С МЕТОДОМ addTableRows
// Устраняет предупреждение "updateAllProbaValues не определена"
function updateAllProbaValues() {
    validateTableNakeConsistency();
}


function updateRowLot(rowElement) {
    const batchCodeInput = document.getElementById('batch-code-field') || document.querySelector('input[name="batchCode"]');
    if (!batchCodeInput || !rowElement) return;

    const batchCode = batchCodeInput.value;
    const carInput = rowElement.querySelector('[name^="no_car_"]');
    const lotInput = rowElement.querySelector('[name^="lot_fg_prod_"]');

    if (!carInput || !lotInput) return;

    const carValue = carInput.value.trim();
    lotInput.value = carValue && batchCode ? `${batchCode}${carValue}` : batchCode;
}

function updateAllRowsLots() {
    if (!tableBody) return;
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => updateRowLot(row));
}

function initDatalists() {
    const fillList = (id, db, key, labelKey) => {
        let dl = document.getElementById(id);
        if (typeof db !== 'undefined' && dl && dl.children.length === 0) {
            db.forEach(item => {
                if (item[key]) {
                    const opt = document.createElement('option');
                    opt.value = item[key];
                    if (labelKey && item[labelKey]) opt.setAttribute('label', item[labelKey]);
                    dl.appendChild(opt);
                }
            });
        }
    };
    fillList('linesList', PAC_LINES_DATABASE, 'PacLine');
    fillList('grdList', NAKE_PRODUCKT_DATABASE, 'GRD', 'GRDName');
    fillList('carsList', PAC_CAR_DATABASE, 'PacCar');
}

// Патч-перехватчик для интеграции контроля Nake при переключении листов из памяти
const originalLoadSheetData = window.loadSheetData;
window.loadSheetData = function(sheetId) {
    if (typeof originalLoadSheetData === 'function') originalLoadSheetData(sheetId);
    validateTableNakeConsistency();
};

// ====================================================
// 4. УПРАВЛЕНИЕ ЛИСТАМИ: СОХРАНЕНИЕ И ЗАГРУЗКА ИЗ ПАМЯТИ
// ====================================================
function saveCurrentSheetData() {
    if (!activeTabId || !tableBody) return;

    const rows = [];
    const trs = tableBody.querySelectorAll('tr');
    
    trs.forEach(tr => {
        const casEl = tr.querySelector('[name^="cas_"]');
        const minEl = tr.querySelector('[name^="min_"]');
        const noLineEl = tr.querySelector('[name^="no_line_"]');
        const grdEl = tr.querySelector('[name^="grd_"]');
        const nameProdEl = tr.querySelector('[name^="name-prod_"]') || tr.querySelector('[name^="name_prod_"]');
        const noCarEl = tr.querySelector('[name^="no_car_"]');
        const lotFgEl = tr.querySelector('[name^="lot_fg_prod_"]');
        const noMeshEl = tr.querySelector('[name^="no_mesh_"]');
        const probaEl = tr.querySelector('[name^="proba_"]');

        if (casEl || minEl || noLineEl) {
            rows.push({
                cas: casEl ? casEl.value : '',
                min: minEl ? minEl.value : '',
                no_line: noLineEl ? noLineEl.value : '',
                grd: grdEl ? grdEl.value : '',
                name_prod: nameProdEl ? nameProdEl.value : '',
                no_car: noCarEl ? noCarEl.value : '',
                lot_fg: lotFgEl ? lotFgEl.value : '',
                no_mesh: noMeshEl ? noMeshEl.value : '',
                proba: probaEl ? probaEl.value : ''
            });
        }
    });

    const currentName = sheetsData[activeTabId] ? sheetsData[activeTabId].name : `Лист ${activeTabId}`;

    sheetsData[activeTabId] = {
        name: currentName,
        nake_1: nake1Input ? nake1Input.value : '',
        nake_2: nake2Input ? nake2Input.value : '',
        lab_lot: labLotInput ? labLotInput.value : '',
        rows: rows
    };
}

function loadSheetData(sheetId) {
    const data = sheetsData[sheetId];
    if (!data) return;

    if (nake1Input) nake1Input.value = data.nake_1 || '';
    if (nake2Input) nake2Input.value = data.nake_2 || '';
    if (labLotInput) labLotInput.value = data.lab_lot || '';

    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!data.rows || data.rows.length === 0) {
        addTableRows(15);
    } else {
        data.rows.forEach((row, index) => {
            const nextIndex = index + 1;
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td><input type="text" name="cas_${nextIndex}" value="${row.cas || ''}" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
                <td><input type="text" name="min_${nextIndex}" value="${row.min || ''}" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
                <td><input type="text" name="no_line_${nextIndex}" value="${row.no_line || ''}" list="linesList" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
                <td><input type="text" name="grd_${nextIndex}" value="${row.grd || ''}" list="grdList" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
                <td><input type="text" name="name-prod_${nextIndex}" value="${row.name_prod || ''}" style="text-align: center; font-size: 0.85rem; background-color: #f1f5f9;" readonly></td>
                <td><input type="text" name="no_car_${nextIndex}" value="${row.no_car || ''}" list="carsList" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
                <td><input type="text" name="lot_fg_prod_${nextIndex}" value="${row.lot_fg || ''}" style="text-align: center; font-size: 0.85rem; color: #000; background-color: #f1f5f9;" readonly></td>
                <td><input type="text" name="no_mesh_${nextIndex}" value="${row.no_mesh || ''}" style="text-align: center; font-size: 0.85rem; color: #000;"></td>
                <td><input type="text" name="proba_${nextIndex}" value="${row.proba || ''}" style="text-align: center; font-size: 0.85rem; color: #000; background-color: #f1f5f9;" readonly></td>
            `;

            tableBody.appendChild(tr);
        });
    }

    if (typeof validateTableNakeConsistency === 'function') {
        validateTableNakeConsistency();
    }
    updateAllRowsLots();
}

// ====================================================
// 5. СОЗДАНИЕ ЛИСТОВ И ИХ ПЕРЕИМЕНОВАНИЕ
// ====================================================
window.addNewSheet = function() {
    saveCurrentSheetData();
    const id = sheetCounter;
    sheetCounter++;

    sheetsData[id] = {
        name: `Лист ${id}`,
        name_1: '',
        name_2: '',
        lab_lot: '',
        rows: []
    };

    const tab = document.createElement('div');
    tab.className = 'btn btn-outline-secondary';
    tab.style.cursor = 'pointer';
    tab.innerText = sheetsData[id].name;
    tab.dataset.sheetId = String(id);

    tab.addEventListener('click', () => {
        saveCurrentSheetData();
        switchTab(tab);
        loadSheetData(id);
    });

    if (tabList) {
        tabList.appendChild(tab);
        switchTab(tab);
        loadSheetData(id);
    }
};

function switchTab(selectedTab) {
    if (!tabList) return;
    const allTabs = tabList.querySelectorAll('.btn');
    allTabs.forEach(t => {
        t.classList.remove('btn-primary');
        t.classList.add('btn-outline-secondary');
    });
    selectedTab.classList.remove('btn-outline-secondary');
    selectedTab.classList.add('btn-primary');

    //  Приведение к числу для строгого соответствия ключам в объекте sheetsData
    activeTabId = Number(selectedTab.dataset.sheetId);
}

function editSheetName() {
    if (!activeTabId) return;
    const currentTabElement = tabList && tabList.querySelector(`[data-sheet-id="${activeTabId}"]`);
    if (!currentTabElement) return;

    const newName = prompt('Введите новое название листа:', currentTabElement.innerText);
    if (newName && newName.trim() !== '') {
        const cleanName = newName.trim();
        currentTabElement.innerText = cleanName;
        
        if (sheetsData[activeTabId]) {
            sheetsData[activeTabId].name = cleanName; // Намертво фиксируем имя в памяти черновика
        }
    }
}

// ====================================================
// 6. ДОБАВЛЕНИЕ СТРОК В ТАБЛИЦУ ИНТЕРФЕЙСА
// ====================================================
function addTableRows(count) {
    if (!tableBody) return;
    for (let i = 0; i < count; i++) {
        const currentRowsCount = tableBody.getElementsByTagName('tr').length;
        const nextIndex = currentRowsCount + 1;

        const tr = document.createElement('tr');
        // Чистая 8-колоночная структура без лишнего поля no_mesh
        tr.innerHTML = `
            <td><input type="text" name="cas_${nextIndex}" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
            <td><input type="text" name="min_${nextIndex}" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
            <td><input type="text" name="no_line_${nextIndex}" list="linesList" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
            <td><input type="text" name="grd_${nextIndex}" list="grdList" style="text-align: center; font-size: 0.85rem; background-color: #fff;"></td>
            <td><input type="text" name="name-prod_${nextIndex}" style="text-align: center; font-size: 0.85rem; background-color: #f1f5f9;"></td>
            <td><input type="text" name="no_car_${nextIndex}" list="carsList" style="text-align: center; font-size: 0.85rem;background-color: #fff;" readonly></td>
            <td><input type="text" name="lot_fg_prod_${nextIndex}" style="text-align: center; font-size: 0.85rem; color: #000; background-color: #f1f5f9;" readonly></td>
            <td><input type="text" name="no_mesh_${nextIndex}" style="text-align: center; font-size: 0.85rem; color: #000;"></td>
            <td><input type="text" name="proba_${nextIndex}" style="text-align: center; font-size: 0.85rem; color: #000; background-color: #f1f5f9;" readonly></td>
        `;
        tableBody.appendChild(tr);
        
        if (typeof updateRowLot === 'function') {
            updateRowLot(tr); 
        }
    }
    
    // 🔥 ИСПРАВЛЕНО: Защитная проверка существования функции
    if (typeof updateAllProbaValues === 'function') {
        updateAllProbaValues();
    } else {
        console.warn("Предупреждение: Функция updateAllProbaValues() не определена в коде. Шаг пропущен.");
    }
}

// ====================================================
// 7. СБОР ПОЛНОЙ СТРУКТУРЫ ДАННЫХ (ВСЕ ЛИСТЫ + МЕТА)
// ====================================================
function collectFormData() {
    saveCurrentSheetData(); // Принудительно запекаем текущий лист в sheetsData

    if (!mainForm) return { meta: {}, sheets: sheetsData };

    const formData = new FormData(mainForm);
    const metaData = Object.fromEntries(formData.entries());

    //  Регулярное выражение железно вычищает строки таблицы Акта ссыпки из шапки
    Object.keys(metaData).forEach(key => {
        if (/^(cas|min|no_line|grd|name[-_]prod|no_car|lot_fg_prod|no_mesh|proba)_/i.test(key)) {
            delete metaData[key];
        }
    });

    return {
        meta: metaData,
        sheets: sheetsData
    };
}

// ====================================================
// 8. ОБРАБОТЧИКИ ГЛАВНЫХ КНОПОК ДЕЙСТВИЙ И РЕЕСТРОВ
// ====================================================
function handleCollapse() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId');
    
    const fullStructure = collectFormData();
    const now = Date.now();

    if (!currentDraftId) {
        currentDraftId = 'draft_' + now;
    }

    // Формируем имя карточки черновика
    const batchVal = fullStructure.meta['batchCode'] || fullStructure.meta['batch_code'] || '';
    const titleEl = document.querySelector('.main-title');
    let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации';
    if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

    const displayTitle = `💼 ${cleanTitle} ${batchVal ? '['+batchVal+']' : ''}`;

    // А) Записываем начинку всех вкладок в общую базу черновиков
    let allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
    allDrafts[currentDraftId] = {
        timestamp: now,
        fields: fullStructure
    };
    localStorage.setItem(DRAFT_DATA_KEY, JSON.stringify(allDrafts));

    // Б) Добавляем карточку в реестр для главной страницы
    let registry = JSON.parse(localStorage.getItem(ACTIVE_ACTS_KEY)) || [];
    const existsIndex = registry.findIndex(a => a.id === currentDraftId);
    
    const meta = {
        id: currentDraftId,
        url: window.location.pathname,
        title: displayTitle,
        updated: now
    };

    if (existsIndex !== -1) registry[existsIndex] = meta;
    else registry.push(meta);
    localStorage.setItem(ACTIVE_ACTS_KEY, JSON.stringify(registry));

    // В) СБРОС И ОБНУЛЕНИЕ ОРИГИНАЛА
    if (mainForm) mainForm.reset();
    sheetsData = {};
    if (tabList) tabList.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';
    sheetCounter = 1;
    
    // 🔥 Безопасный сброс параметров в URL-строке браузера
    if (window.history.pushState) {
        const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({ path: cleanURL }, '', cleanURL);
    }
    currentDraftId = null;

    // 🔥 Инициализируем стартовый чистый бланк, чтобы DOM не оставался пустым
    if (typeof addNewSheet === 'function') addNewSheet();

    alert('Акт успешно свернут в черновик. Оригинал обнулен!');
    window.location.href = '/menu/index.html'; 
}

function handleSaveArchive() {
    if (typeof validateForm === 'function' && !validateForm()) return;

    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId');

    const fullStructure = collectFormData();
    const archiveId = 'arch_' + Date.now();

    // 1. Отправляем полный пакет документов в архив
    localStorage.setItem(`${ARCHIVE_PREFIX}${archiveId}`, JSON.stringify({
        data: fullStructure,
        savedAt: new Date().toISOString()
    }));

    // 2. Вычищаем завершенный черновик из активной базы смены
    if (currentDraftId) {
        let registry = JSON.parse(localStorage.getItem(ACTIVE_ACTS_KEY)) || [];
        registry = registry.filter(a => a.id !== currentDraftId);
        localStorage.setItem(ACTIVE_ACTS_KEY, JSON.stringify(registry));

        let allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
        delete allDrafts[currentDraftId];
        localStorage.setItem(DRAFT_DATA_KEY, JSON.stringify(allDrafts));
    }

    alert('Данные успешно отправлены в архив!');
    
    if (mainForm) mainForm.reset();
    window.location.href = '/menu/index.html'; 
}

// ====================================================
// 9. НАВИГАЦИЯ ПО ТАБЛИЦЕ КЛАВИШАМИ (ENTER / СТРЕЛКИ)
// ====================================================
function handleTableNavigation(e) {
    const validKeys = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!validKeys.includes(e.key)) return;

    const currentInput = e.target;
    if (currentInput.tagName !== 'INPUT' && currentInput.tagName !== 'SELECT') return;

    // 🔥 Защита навигации при выборе элементов из выпадающей базы данных datalist
    if (currentInput.hasAttribute('list') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        return; // Даем встроенному меню браузера выбрать строку из database.js
    }

    const currentTd = currentInput.closest('td');
    const currentTr = currentInput.closest('tr');
    if (!currentTd || !currentTr) return;

    // Вычисляем текущие координаты ячейки
    const colIndex = Array.from(currentTr.children).indexOf(currentTd);
    const allRows = Array.from(tableBody.querySelectorAll('tr'));
    const rowIndex = allRows.indexOf(currentTr);

    let targetInput = null;

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault(); // Блокируем стандартный перенос строки или отправку формы
        if (rowIndex < allRows.length - 1) {
            targetInput = allRows[rowIndex + 1].children[colIndex].querySelector('input:not([readonly])');
        }
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIndex > 0) {
            targetInput = allRows[rowIndex - 1].children[colIndex].querySelector('input:not([readonly])');
        }
    } 
    else if (e.key === 'ArrowRight') {
        // Переходим на ячейку вправо, только если курсор находится в самом конце текста
        if (currentInput.selectionStart === currentInput.value.length || currentInput.type === 'select-one') {
            let nextTd = currentTd.nextElementSibling;
            while (nextTd) {
                const input = nextTd.querySelector('input');
                if (input && !input.hasAttribute('readonly')) {
                    targetInput = input;
                    break;
                }
                nextTd = nextTd.nextElementSibling;
            }
        }
    } 
    else if (e.key === 'ArrowLeft') {
        // Переходим на ячейку влево, только если курсор находится в самом начале текста
        if (currentInput.selectionStart === 0 || currentInput.type === 'select-one') {
            let prevTd = currentTd.previousElementSibling;
            while (prevTd) {
                const input = prevTd.querySelector('input');
                if (input && !input.hasAttribute('readonly')) {
                    targetInput = input;
                    break;
                }
                prevTd = prevTd.previousElementSibling;
            }
        }
    }

    // Если целевая ячейка найдена — плавно переносим на неё фокус
    if (targetInput) {
        targetInput.focus();
        if (typeof targetInput.select === 'function') {
            targetInput.select();
        }
    }
}

// ====================================================
// 10. АВТОМАТИЧЕСКИЙ РАСЧЕТ BATCH CODE (LOT)
// ====================================================
function updateLotValue() {
    const citySelect = document.getElementById('cyti');
    const daySelect = document.getElementById('day');
    const dateInput = document.getElementById('doc-date');
    const targetInput = document.getElementById('batch-code-field') || document.querySelector('input[name="batchCode"]');

    if (!dateInput || !dateInput.value || !targetInput) return;

    // 🔥 Избегаем внутренних сдвигов часовых поясов браузера при локальном запуске
    const date = new Date(dateInput.value.replace(/-/g, '/'));
    if (isNaN(date.getTime())) return;

    // 1. Извлекаем последнюю цифру года
    const lastYearDigit = date.getFullYear().toString().slice(-1);

    // 2. Вычисляем номер недели по международному стандарту ISO-8601
    const target = new Date(date.valueOf());
    const dayNum = date.getDay() === 0 ? 7 : date.getDay(); // Считаем Вс как 7
    
    target.setDate(target.getDate() - dayNum + 4); // Сдвигаемся на четверг текущей недели
    const firstThursday = target.valueOf();
    
    target.setMonth(0, 1); // Ищем точку отсчета года
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    const formattedWeek = weekNumber.toString().padStart(2, '0');

    // 3. Вычисляем буквенный маркер дня недели (JS: 0 = Вс, 1 = Пн, 2 = Вт...)
    const daysLetters = ['G', 'A', 'B', 'C', 'D', 'E', 'F']; 
    const dayLetter = daysLetters[date.getDay()];

    const datePart = lastYearDigit + formattedWeek + dayLetter;

    // 4. Логика буквенно-цифрового кодирования Смены
    let dayPart = "";
    if (daySelect && daySelect.value.trim().toUpperCase() === "ДЕНЬ") dayPart = "1";
    if (daySelect && daySelect.value.trim().toUpperCase() === "НОЧЬ") dayPart = "2";

    // 5. Логика кодирования Фабрики (Города)
    let cityPart = "";
    if (citySelect && citySelect.value.trim().toUpperCase() === "ЛУЖНИКИ") cityPart = "LUZ";
    if (citySelect && citySelect.value.trim().toUpperCase() === "НОВОСИБИРСК") cityPart = "NOV";

    // Записываем собранный код батча в шапку формы
    targetInput.value = datePart + dayPart + cityPart;

    // 🔥 Сигнализируем таблице, что лоты готовой продукции для машин нужно пересчитать
    if (typeof updateAllRowsLots === 'function') {
        updateAllRowsLots();
    }
}


/// ====================================================
// 11. СИНХРОНИЗАЦИЯ И СКВОЗНАЯ ВАЛИДАЦИЯ КОНТЕНТА ЛИСТА
// ====================================================
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const tBody = document.getElementById('table-body');
        if (!tBody) return;

        tBody.addEventListener('change', (event) => {
            // Передаем event внутрь стрелочной функции
        setTimeout(() => handleLiveChanges(event), 50); 
        });
            const grdValue = parseInt(target.value.trim());
            if (isNaN(grdValue)) return;

            if (typeof NAKE_PRODUCKT_DATABASE !== 'undefined') {
                const foundProd = NAKE_PRODUCKT_DATABASE.find(item => item.GRD === grdValue);
                if (foundProd) {
                    const nakeInput = document.getElementById('sheet-nake-1');
                    const nakeNameInput = document.getElementById('sheet-nake-2');

                    // Автозаполнение полей Найка в шапке на основе справочника
                    if (nakeInput && foundProd.Nake) nakeInput.value = foundProd.Nake;
                    if (nakeNameInput) nakeNameInput.value = foundProd.NakeName || "";

                    // Уведомляем систему о принудительном изменении для сохранения в кэш табов
                    if (nakeInput) nakeInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            // Вызываем единый валидатор строк
            validateTableNakeConsistency();
        })

        // Ловим ввод и выбор из datalist
        tBody.addEventListener('input', handleLiveChanges);
        tBody.addEventListener('change', () => {
            setTimeout(handleLiveChanges, 50);
        });
    });


// ====================================================
// 12. АВТОМАТИЧЕСКИЙ ВЫВОД NAKENAME В ПОЛЕ NAKE (ДОП.)
// ====================================================
(function() {
    // Ждем полной загрузки страницы для безопасного поиска элементов в DOM
    document.addEventListener('DOMContentLoaded', () => {
        const tBody = document.getElementById('table-body');
        const nakeNameInput = document.getElementById('sheet-nake-2');

        if (!tBody || !nakeNameInput) return;

        // Функция обработки изменений в таблице
        const syncGrdToNakeNameField = (event) => {
            const target = event.target;

            // Проверяем, что пользователь изменил именно ячейку GRD (в любой строке)
            if (target && target.name && target.name.startsWith('grd_')) {
                const grdValue = parseInt(target.value.trim());

                // Если код GRD пустой или введен некорректно — прерываем выполнение
                if (isNaN(grdValue)) return;

                // Проверяем, что глобальный справочник базы данных из database.js загружен
                if (typeof NAKE_PRODUCKT_DATABASE !== 'undefined') {
                    
                    // Ищем соответствующий продукт в базе по коду GRD
                    const foundProd = NAKE_PRODUCKT_DATABASE.find(item => item.GRD === grdValue);

                    // Если продукт найден в Excel-базе
                    if (foundProd) {
                        // Записываем текстовое название полуфабриката (NakeName) в поле шапки.
                        // Если имя пустое (как для строк 11-15), запишется пустая строка.
                        nakeNameInput.value = foundProd.NakeName || "";

                        // Принудительно уведомляем систему об изменении инпута, 
                        // чтобы логика вкладок и сохранения черновиков зафиксировала новые данные
                        nakeNameInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        };

        // Подключаем слушатели на ввод букв и на выбор мышкой из всплывающего datalist
        tBody.addEventListener('input', syncGrdToNakeNameField);
        tBody.addEventListener('change', syncGrdToNakeNameField);
    });
})();

// ====================================================
// 13. ЗАКРЕПЛЕНИЕ NAKE ПО ПЕРВОЙ СТРОКЕ И ВАЛИДАЦИЯ СТРОК
// ====================================================
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const tBody = document.getElementById('table-body');
        const nake1Input = document.getElementById('sheet-nake-1');
        const nake2Input = document.getElementById('sheet-nake-2');

        if (!tBody || !nake1Input || !nake2Input) return;

        // Главная функция проверки всей таблицы
        const validateTableNakeConsistency = () => {
            const rows = tBody.querySelectorAll('tr');
            if (rows.length === 0) return;

            if (typeof NAKE_PRODUCKT_DATABASE === 'undefined') return;

            let firstActiveNake = null;
            let firstActiveNakeName = null;

            // ШАГ 1: Сканируем таблицу и находим САМУЮ ПЕРВУЮ заполненную строку с валидным GRD
            for (let i = 0; i < rows.length; i++) {
                const grdInput = rows[i].querySelector('[name^="grd_"]');
                if (grdInput && grdInput.value.trim() !== "") {
                    const grdValue = parseInt(grdInput.value.trim());
                    const foundProd = NAKE_PRODUCKT_DATABASE.find(item => item.GRD === grdValue);
                    
                    if (foundProd && foundProd.Nake) {
                        firstActiveNake = foundProd.Nake;
                        firstActiveNakeName = foundProd.NakeName || "";
                        break; // Нашли эталон — выходим из цикла поиска
                    }
                }
            }

            // ШАГ 2: Управляем шапкой листа на основе найденного эталона
            if (firstActiveNake !== null) {
                // Записываем эталон в шапку, если он там еще не стоит
                if (nake1Input.value !== String(firstActiveNake)) nake1Input.value = firstActiveNake;
                if (nake2Input.value !== firstActiveNakeName) nake2Input.value = firstActiveNakeName;
            } else {
                // Если вообще вся таблица пустая — очищаем шапку (разблокируем лист)
                nake1Input.value = "";
                nake2Input.value = "";
            }

            // ШАГ 3: Проверяем КАЖДУЮ строку на соответствие закрепленному эталону
            rows.forEach((currentRow) => {
                const grdInput = currentRow.querySelector('[name^="grd_"]');
                const nameInput = currentRow.querySelector('[name^="name-prod_"]') || currentRow.querySelector('[name^="name_prod_"]');
                
                if (!grdInput || !nameInput) return;

                const grdValue = parseInt(grdInput.value.trim());

                // Если в ячейке ничего не введено — сбрасываем стили ошибки
                if (isNaN(grdValue) || grdInput.value.trim() === "") {
                    // Проверяем, не затерта ли ошибка, возвращаем дефолтные стили
                    if (nameInput.value === "Найк не соответствует продукту!") nameInput.value = "";
                    nameInput.style.color = "#000";
                    nameInput.style.backgroundColor = "#fff";
                    nameInput.style.fontWeight = "normal";
                    return;
                }

                // Ищем текущий продукт в базе
                const currentProd = NAKE_PRODUCKT_DATABASE.find(item => item.GRD === grdValue);

                if (currentProd) {
                    // Если это самая первая строка или продукт совпадает по Nake с эталоном
                    if (firstActiveNake === null || currentProd.Nake === firstActiveNake) {
                        nameInput.value = currentProd.GRDName || "";
                        nameInput.style.color = "#000";
                        nameInput.style.backgroundColor = "#fff";
                        nameInput.style.fontWeight = "normal";
                    } else {
                        // 🛑 КРИТИЧЕСКАЯ ОШИБКА: Продукт относится к другому Nake!
                        nameInput.value = "КОД не соответствует НАЙКУ!";
                        nameInput.style.color = "red";
                        nameInput.style.backgroundColor = "#ffebeb"; // Нежно-красный фон
                        nameInput.style.fontWeight = "bold";
                    }
                } else {
                    // Если код GRD вообще отсутствует в базе Excel
                    nameInput.value = "КОД НЕ НАЙДЕН В БАЗЕ!";
                    nameInput.style.color = "orange";
                    nameInput.style.backgroundColor = "#fffdf0";
                }
            });
        };

        // Привязываем валидатор к изменениям в таблице (клавиатура + мышь)
        tBody.addEventListener('input', validateTableNakeConsistency);
        tBody.addEventListener('change', validateTableConsistencyOnMouse);

        // Фикс для корректного пересчета при очистке/выборе мышкой из datalist
        function validateTableConsistencyOnMouse() {
            setTimeout(validateTableNakeConsistency, 50);
        }

        // Интеграция с переключением вкладок: проверяем лист при его загрузке
        const originalLoadSheetData = window.loadSheetData;
        if (typeof originalLoadSheetData === 'function') {
            window.loadSheetData = function(sheetId) {
                originalLoadSheetData(sheetId);
                validateTableNakeConsistency(); // Проверяем на лету при открытии листа
            };
        }
    });
})();

// ====================================================
// 15. СКРЫТИЕ КНОПОК УПРАВЛЕНИЯ ВКЛАДКАМИ НА ПЕЧАТИ
// ====================================================
(function() {
    window.addEventListener('load', () => {
        // Находим кнопку редактирования названия по её ID
        const btnEdit = document.getElementById('btnEditSheetName');
        
        // Находим кнопку добавления листа по тексту (так как у неё в верстке нет ID, только класс)
        const allButtons = document.querySelectorAll('.btn, button');
        let btnAddSheet = null;
        
        allButtons.forEach(btn => {
            if (btn.textContent.includes('Добавить лист')) {
                btnAddSheet = btn;
            }
        });

        // Если кнопки найдены, добавляем им специальный класс-маркер для печатных стилей
        if (btnEdit) btnEdit.classList.add('hide-on-print');
        if (btnAddSheet) btnAddSheet.classList.add('hide-on-print');

        // 🔥 Динамически внедряем печатное CSS-правило прямо в документ
        if (!document.getElementById('dynamic-print-rules')) {
            const style = document.createElement('style');
            style.id = 'dynamic-print-rules';
            style.textContent = `
                @media print {
                    /* Намертво скрываем элементы управления вкладками на превью печати */
                    .hide-on-print,
                    #btnEditSheetName,
                    #tab-list,
                    .tabs-container button,
                    #btnAddRow,
                    #btnAddRows5,
                    #btnAddRows15,
                    .actions-bar,
                    .nav-print-link,
                    .nav-home-link {
                        display: none !important;
                    }
                    
                    /* Убираем серые рамки у текстовых инпутов для эффекта печатного бланка */
                    input[type="text"] {
                        border: none !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        padding: 4px !important;
                    }
                }
            `;
            document.head.appendChild(style);
            console.log('[Принтер-Логика]: Печатные стили для кнопок вкладок успешно привязаны.');
        }
    });
})();

// ====================================================
// 16. БЕЗОПАСНАЯ ИНТЕГРАЦИЯ С АРХИВОМ БЕЗ НАРУШЕНИЯ CSP
// ====================================================

// 🔥 СТАРАЯ КОНФЛИКТНАЯ ФУНКЦИЯ handleSaveArchive УДАЛЕНА.
// Вся промышленная логика теперь выполняется централизованно в Блоке 18.

// НАЗНАЧЕНИЕ СЛУШАТЕЛЕЙ ПОСЛЕ ЗАГРУЗКИ СТРАНИЦЫ (БЕЗОПАСНЫЙ ПЕРЕХВАТ ДЛЯ CSP)
document.addEventListener('DOMContentLoaded', function() {
    // Находим альтернативную кнопку сохранения
    const saveBtnAlt = document.getElementById('saveArchiveBtn');
    if (saveBtnAlt) {
        saveBtnAlt.addEventListener('click', function(e) {
            e.preventDefault();
            // Вызываем правильную единую функцию из Блока 18
            if (typeof handleSaveArchive === 'function') {
                handleSaveArchive();
            }
        });
    }

    // Сохраняем логику сворачивания в черновик (кнопка "Свернуть")
    const collapseBtn = document.getElementById('collapseBtn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof handleCollapse === 'function') {
                handleCollapse();
            }
        });
    }
});


// =========================================================================
// 17. СИСТЕМА ПРАВ ДОСТУПА ДЛЯ БЛАНКА (RBAC - РЕЖИМ ЛАБОРАТОРИЯ)
// =========================================================================
(function() {
    function enforceBlankRoleRestrictions() {
        // Получаем должность сотрудника из общего хранилища системы
        const currentPosition = localStorage.getItem('userPosition') || 'Пользователь';
        
        // Если зашла Лаборатория — активируем жесткий режим "Только чтение"
        if (currentPosition === 'Лаборатория') {
            
            // 1. Блокируем все инпуты и селекты в шапке и внутри таблиц
            const allInputs = document.querySelectorAll('input, select, textarea');
            allInputs.forEach(field => {
                // Исключаем кнопки, блокируем только поля ввода данных
                if (field.type !== 'button' && field.type !== 'submit') {
                    field.readOnly = true;
                    field.disabled = true;
                    // Стилизуем под закрытый для редактирования документ
                    field.style.backgroundColor = '#f1f5f9';
                    field.style.color = '#475569';
                    field.style.cursor = 'not-allowed';
                }
            });

            // 2. Намертво скрываем элементы управления структурой документа
            const selectorsToHide = [
                '#btnAddRow',          // Кнопка +1 строка
                '#btnAddRows5',        // Кнопка +5 строк
                '#btnAddRows15',       // Кнопка +15 строк
                '#btnEditSheetName',   // Кнопка переименования листа
                '#btnCollapse',        // Кнопка "Свернуть в черновик"
                '#btnSaveArchive',     // Кнопка "Отправить в архив"
                '#collapseBtn',        // Альтернативный ID черновика
                '#saveArchiveBtn'      // Альтернативный ID архива
            ];

            selectorsToHide.forEach(selector => {
                const element = document.getElementById(selector) || document.querySelector(selector);
                if (element) {
                    element.style.setProperty('display', 'none', 'important');
                }
            });

            // 3. Отдельно находим и скрываем кнопку "Добавить лист" (по тексту)
            const allButtons = document.querySelectorAll('.btn, button');
            allButtons.forEach(btn => {
                if (btn.textContent.includes('Добавить лист')) {
                    btn.style.setProperty('display', 'none', 'important');
                }
            });

            // 4. Защита: отключаем вызов окон prompt при клике на вкладки
            window.editSheetName = function() {
                alert("Доступ ограничен: Лаборатория не может переименовывать листы.");
            };
        }
    }

    // Запускаем контроль доступа при первичной загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enforceBlankRoleRestrictions);
    } else {
        enforceBlankRoleRestrictions();
    }

    // Перехватываем динамическое добавление элементов при переключении табов
    const originalLoadSheetData = window.loadSheetData;
    window.loadSheetData = function(sheetId) {
        if (typeof originalLoadSheetData === 'function') {
            originalLoadSheetData(sheetId);
        }
        // Повторно накатываем блокировку ячеек на только что отрисованный лист
        enforceBlankRoleRestrictions();
    };
})();

// =========================================================================
// 18. СИСТЕМА ПРОМЫШЛЕННОЙ АРХИВАЦИИ И СКВОЗНОГО РЕДАКТИРОВАНИЯ (ЗАВОД)
// =========================================================================
(function() {
    const SHADOW_PREFIX = 'shadow_arch_';
    const FINAL_ARCHIVE_PREFIX = 'qaArchive_';
    const BLANK_VERSION = '1.2.0'; 

    // 🔥 ИСПРАВЛЕНО: Функция теперь генерирует чистый ID без привязки к батч-коду
    function generateArchiveStandardId() {
        const operatorId = localStorage.getItem('userId') || '000';
        const cleanOperator = operatorId.trim().replace(/\s+/g, ''); 

        // Итоговый ID файла будет иметь строгий вид: "1.1.0-04"
        return `${BLANK_VERSION}-${cleanOperator}`;
    }

    // Изолированная функция сохранения теневой копии
    function updateShadowArchiveCopy() {
        if (!mainForm || typeof sheetsData === 'undefined') return;

        const urlParams = new URLSearchParams(window.location.search);
        const currentDraftId = urlParams.get('draftId') || 'temp';

        const formData = new FormData(mainForm);
        const metaData = Object.fromEntries(formData.entries());

        Object.keys(metaData).forEach(key => {
            if (/^(cas|min|no_line|grd|name[-_]prod|no_car|lot_fg_prod|proba)_/i.test(key)) {
                delete metaData[key];
            }
        });

        localStorage.setItem(`${SHADOW_PREFIX}${currentDraftId}`, JSON.stringify({
            meta: metaData,
            sheets: sheetsData, 
            shadowSavedAt: new Date().toISOString(),
            status: 'shadow'
        }));
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateShadowArchiveCopy, 600);

        if (mainForm) {
            mainForm.addEventListener('input', updateShadowArchiveCopy);
            mainForm.addEventListener('change', updateShadowArchiveCopy);
        }

        const saveBtn = document.getElementById('saveArchiveBtn') || document.getElementById('btnSaveArchive');
        if (saveBtn) {
            saveBtn.removeAttribute('onclick'); 
            
            saveBtn.addEventListener('click', function(e) {
                e.preventDefault();

                if (typeof validateForm === 'function' && !validateForm()) return;

                if (typeof saveCurrentSheetData === 'function') {
                    saveCurrentSheetData();
                }

                updateShadowArchiveCopy();

                const urlParams = new URLSearchParams(window.location.search);
                const currentDraftId = urlParams.get('draftId') || 'temp';
                
                const shadowDataRaw = localStorage.getItem(`${SHADOW_PREFIX}${currentDraftId}`);
                if (!shadowDataRaw) {
                    alert('Ошибка: Данные документа пусты.');
                    return;
                }

                const shadowObj = JSON.parse(shadowDataRaw);
                const now = new Date();

                // ГЛАВНАЯ ПРОМЫШЛЕННАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ ID:
                let archiveFinalId = currentDraftId;
                const isAlreadyArchived = currentDraftId.includes('-');

                if (!isAlreadyArchived || currentDraftId === 'temp') {
                    archiveFinalId = generateArchiveStandardId();
                }

                // 1. ПУБЛИКАЦИЯ / ОБНОВЛЕНИЕ ТЕЛА ФАЙЛА
                shadowObj.status = 'published';
                shadowObj.savedAt = now.toISOString();
                localStorage.setItem(`${FINAL_ARCHIVE_PREFIX}${archiveFinalId}`, JSON.stringify(shadowObj));

                // 2. ИНТЕГРАЦИЯ В РЕЕСТР ТАБЛИЦЫ АРХИВА
                let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
                
                const titleEl = document.querySelector('.main-title');
                let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт отбора образцов';
                if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

                const savedLastName = localStorage.getItem('userLastName') || '';
                const savedFirstName = localStorage.getItem('userFirstName') || '';
                const controllerName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : "Не указан";
                
                // Вытаскиваем живое значение батча со страницы для колонки в таблице
                const targetInput = document.getElementById('batch-code-field') || document.querySelector('input[name="batchCode"]') || document.querySelector('input[name="batch_code"]');
                let finalBatchVal = 'БЕЗ БАТЧА';
                if (targetInput && targetInput.value.trim() !== '') {
                    finalBatchVal = targetInput.value.trim();
                }
                
                // Относительный путь к подпапке хранилища
                const thisBlankPath = '../архив/хранилище/index.html';

                const archiveRegistryEntry = {
                    id: archiveFinalId, // Сюда пойдет чистый короткий ID (например, 1.1.0-04)
                    date: now.toISOString().split('T')[0],
                    number: `АКТ-${now.getTime().toString().slice(-6)}`, 
                    controller: controllerName,
                    actType: cleanTitle,
                    batch: finalBatchVal, // В таблице архива батч по-прежнему будет отображаться!
                    blankPath: thisBlankPath
                };

                const existingIndex = archiveActs.findIndex(act => act.id === archiveFinalId);
                if (existingIndex !== -1) {
                    archiveActs[existingIndex] = archiveRegistryEntry; 
                } else {
                    archiveActs.unshift(archiveRegistryEntry); 
                }
                
                localStorage.setItem('archiveActs', JSON.stringify(archiveActs));

                // 3. ОЧИСТКА ВРЕМЕННОЙ ПАМЯТИ СМЕНЫ
                localStorage.removeItem(`${SHADOW_PREFIX}${currentDraftId}`);

                let registry = JSON.parse(localStorage.getItem('global_active_acts_list')) || [];
                registry = registry.filter(a => a.id !== currentDraftId);
                localStorage.setItem('global_active_acts_list', JSON.stringify(registry));

                let allDrafts = JSON.parse(localStorage.getItem('qa_all_drafts_data')) || {};
                delete allDrafts[currentDraftId];
                localStorage.setItem('qa_all_drafts_data', JSON.stringify(allDrafts));

                alert(`Документ успешно сохранен в архив!\nПаспорт ID: ${archiveFinalId}`);
                window.location.href = '/menu/index.html'; 
            });
        }
    });

    const originalSaveCurrentSheetData = window.saveCurrentSheetData;
    window.saveCurrentSheetData = function() {
        if (typeof originalSaveCurrentSheetData === 'function') {
            originalSaveCurrentSheetData();
        }
        updateShadowArchiveCopy();
    };
})();

// =========================================================================
// 19. ДИНАМИЧЕСКОЙ ВАЛИДАЦИИ МАШИНЫ НАПРЯМУЮ ИЗ БАЗЫ ДАННЫХ CAR_GRD_DATABASA
// =========================================================================
(function() {
  /**
   * Функция динамической проверки конкретной строки таблицы на основе CAR_GRD_DATABASA
   * @param {HTMLElement} rowElement - Текущая строка таблицы <tr>
   */
  function checkCarAndGrdFromDatabase(rowElement) {
    if (!rowElement) return;

    // Ищем инпуты внутри переданной строки
    const grdInput = rowElement.querySelector('input[name^="grd_"]');
    const carInput = rowElement.querySelector('input[name^="no_car_"]');
    const nameProdInput = rowElement.querySelector('input[name^="name-prod_"]') || rowElement.querySelector('input[name^="name_prod_"]');

    if (!grdInput || !carInput || !nameProdInput) return;

    const grdValue = parseInt(grdInput.value.trim(), 10);
    const carValue = parseInt(carInput.value.trim(), 10);

    // Если ячейка машины пустая — очищаем ошибку, возвращаем дефолтные стили и выходим
    if (carInput.value.trim() === "") {
      carInput.style.backgroundColor = "#fff";
      if (nameProdInput.value === "Формат не соответствует коду") {
        nameProdInput.value = "";
        nameProdInput.style.color = "#000";
        nameProdInput.style.backgroundColor = "#f1f5f9";
        nameProdInput.style.fontWeight = "normal";
      }
      return;
    }

    // Если GRD или машина заполнены не до конца (не числа) — прерываем проверку
    if (isNaN(grdValue) || isNaN(carValue)) return;

    // Проверяем, существует ли глобальная база данных в системе
    if (typeof CAR_GRD_DATABASA !== 'undefined') {
      
      // Ищем объект правила для текущего кода GRD в вашей базе данных
      const rule = CAR_GRD_DATABASA.find(item => item.GRD === grdValue);

      if (rule && rule.PacCars) {
        // Проверяем, входит ли введённый номер машины в разрешённый массив PacCars из базы
        const isCarValid = rule.PacCars.includes(carValue);

        if (!isCarValid) {
          // 🛑 ОШИБКА: Машина не подходит под формат кода
          nameProdInput.value = "Формат не соответствует коду";
          nameProdInput.style.color = "red";
          nameProdInput.style.backgroundColor = "#ffebeb"; // Нежно-красный фон для текста ошибки
          nameProdInput.style.fontWeight = "bold";

          // Подкрашиваем саму ячейку ввода машины в красный цвет
          carInput.style.backgroundColor = "#fee2e2"; 
        } else {
          // Если всё в порядке — убираем индикаторы ошибки
          carInput.style.backgroundColor = "#fff";
          if (nameProdInput.value === "Формат не соответствует коду") {
            nameProdInput.value = "";
            nameProdInput.style.color = "#000";
            nameProdInput.style.backgroundColor = "#f1f5f9";
            nameProdInput.style.fontWeight = "normal";
          }
        }
      }
    }
  }

  // Подключение валидатора к таблице после полной сборки страницы
  document.addEventListener('DOMContentLoaded', () => {
    const tBody = document.getElementById('table-body');
    if (!tBody) return;

    const handleCarLiveValidation = (event) => {
      const target = event.target;
      if (!target || !target.name) return;

      // Срабатывает в реальном времени при изменении номера машины или кода GRD
      if (target.name.startsWith('no_car_') || target.name.startsWith('grd_')) {
        const tr = target.closest('tr');
        
        // Таймаут в 80мс позволяет вашей встроенной функции "validateTableNakeConsistency" 
        // сначала корректно отработать и подставить оригинальное название из справочника
        setTimeout(() => checkCarAndGrdFromDatabase(tr), 80);
      }
    };

    // Вешаем слушатели на ввод символов и на клик выбора из выпадающего datalist
    tBody.addEventListener('input', handleCarLiveValidation);
    tBody.addEventListener('change', handleCarLiveValidation);
  });
})();
