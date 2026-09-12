// Точка входа: выбор активной базы данных
function selectDatabase(fileName) {
    AppState.activeFileId = fileName;
    
    // Блокируем или разблокируем кнопки управления
    AppUI.toggleControls(fileName);
    
    // Обновляем список баз в боковой панели
    AppUI.updateSidebarList(AppState.dbSessions, AppState.activeFileId, selectDatabase);
    
    // Перерисовываем инпуты, код и HTML-таблицу
    AppUI.renderInputFields(AppState.activeFileId, AppState.dbSessions);
    AppUI.renderTableData(AppState.activeFileId, AppState.dbSessions);
    AppUI.refreshCodeViewer(AppState.activeFileId, AppState.dbSessions);
}

// Загрузчик: преобразует текст вашего JS-файла в структуры данных
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const fileContent = e.target.result;
        
        try {
            // Регулярное выражение для поиска всех констант вида `const NAME = [...] или {...};`
            const constRegex = /const\s+(\w+)\s*=\s*([\[{][\s\S]*?[\]}]);/g;
            let match;
            let foundAny = false;

            while ((match = constRegex.exec(fileContent)) !== null) {
                const constName = match[1];
                let rawData = match[2];

                // Превращаем текст в реальный объект JS
                // Заменяем одинарные кавычки на двойные для корректного JSON-парсинга
                let sanitizedData = rawData.replace(/'/g, '"');
                // Удаляем висящие запятые перед закрывающими скобками, если они есть
                sanitizedData = sanitizedData.replace(/,\s*([\]}])/g, '$1');
                
                let parsedData = JSON.parse(sanitizedData);
                let columns = [];
                let rows = [];

                // СЦЕНАРИЙ А: База в виде массива объектов (как NAKE_PRODUCKT, PAC_LINES, PAC_CAR, CAR_GRD)
                if (Array.isArray(parsedData)) {
                    rows = parsedData;
                    if (rows.length > 0) {
                        columns = Object.keys(rows[0]); // Столбцы — это ключи первого объекта
                    }
                } 
                // СЦЕНАРИЙ Б: База в виде объекта-словаря (как mockUserBase)
                else {
                    // Превращаем id пользователей (ключи) в обычное поле внутри строки
                    rows = Object.keys(parsedData).map(key => {
                        return { "User_ID": key, ...parsedData[key] };
                    });
                    if (rows.length > 0) {
                        columns = Object.keys(rows[0]);
                    }
                }

                // Сохраняем каждую найденную константу как отдельную вкладку базы
                const sessionKey = `${file.name} -> ${constName}`;
                AppState.dbSessions[sessionKey] = {
                    constantName: constName,
                    columns: columns,
                    rows: rows,
                    isDictionary: !Array.isArray(parsedData) // Флаг типа исходной структуры
                };
                
                if (!foundAny) {
                    selectDatabase(sessionKey);
                    foundAny = true;
                }
            }

            if (!foundAny) {
                throw new Error("В файле не найдено поддерживаемых констант баз данных.");
            }
            
        } catch (error) {
            alert("Ошибка чтения баз данных: " + error.message);
            console.error(error);
        } finally {
            event.target.value = ''; // Сброс инпута
        }
    };
    reader.readAsText(file);
}

const AppState = {
    dbSessions: {},     // Хранилище всех сессий баз данных
    activeFileId: null, // Текущий выбранный ключ сессии

    // Добавление новой строки в таблицу
    addRow: function(rowData) {
        if (!this.activeFileId) return false;
        const currentDb = this.dbSessions[this.activeFileId];

        // Создаем новый объект на основе колонок
        const newRow = {};
        currentDb.columns.forEach(col => {
            // Если в CAR_GRD_DATABASA добавляется массив PacCars, парсим его из строки ввода [71, 72]
            if (col === 'PacCars') {
                try {
                    newRow[col] = rowData[col] ? JSON.parse(rowData[col]) : [];
                } catch {
                    newRow[col] = rowData[col].split(',').map(num => parseInt(num.trim())).filter(n => !isNaN(n));
                }
            } else {
                // Пытаемся сохранить числа как числа, null как null, остальное как текст
                let val = rowData[col] !== undefined ? rowData[col].trim() : "";
                if (val.toLowerCase() === 'null') newRow[col] = null;
                else if (val !== '' && !isNaN(val)) newRow[col] = Number(val);
                else newRow[col] = val;
            }
        });

        currentDb.rows.push(newRow);
        return true;
    },

    // Удаление последней строки
    deleteLastRow: function() {
        if (!this.activeFileId) return false;
        const currentDb = this.dbSessions[this.activeFileId];
        if (currentDb.rows.length === 0) {
            alert('В таблице больше нет строк!');
            return false;
        }
        currentDb.rows.pop();
        return true;
    },

    // Динамическое добавление нового столбца в структуру
    addColumn: function(colName) {
        if (!this.activeFileId) return false;
        const cleanColName = colName.trim().replace(/[^a-zA-Z0-9_]/g, '');
        if (!cleanColName) return false;

        const currentDb = this.dbSessions[this.activeFileId];
        if (currentDb.columns.includes(cleanColName)) {
            alert('Столбец уже существует!');
            return false;
        }

        currentDb.columns.push(cleanColName);
        currentDb.rows.forEach(row => row[cleanColName] = "");
        return true;
    },

    // Удаление столбца из структуры
    deleteColumn: function(colToDelete) {
        if (!this.activeFileId) return false;
        const currentDb = this.dbSessions[this.activeFileId];

        if (!currentDb.columns.includes(colToDelete)) {
            alert('Столбец не найден.');
            return false;
        }

        currentDb.columns = currentDb.columns.filter(c => c !== colToDelete);
        currentDb.rows.forEach(row => delete row[colToDelete]);
        return true;
    }
};

const AppUI = {
    // Рендерит список найденных констант в левое боковое меню
    updateSidebarList: function(sessions, activeId, selectCallback) {
        const list = document.getElementById('sidebarDbList');
        list.innerHTML = '';
        
        Object.keys(sessions).forEach(sessionKey => {
            const li = document.createElement('li');
            li.className = `db-item ${sessionKey === activeId ? 'active' : ''}`;
            li.innerText = `📊 ${sessions[sessionKey].constantName}`;
            li.onclick = () => selectCallback(sessionKey);
            list.appendChild(li);
        });
    },

    toggleControls: function(activeFileId) {
        const elements = ['btnCol', 'btnDelCol', 'btnRow', 'btnDelRow'];
        const btnDownload = document.getElementById('btnDownload');
        const currentFileName = document.getElementById('currentFileName');

        elements.forEach(id => {
            const el = document.getElementById(id);
            if (activeFileId) el.removeAttribute('disabled');
            else el.setAttribute('disabled', 'true');
        });

        btnDownload.style.display = activeFileId ? 'block' : 'none';
        currentFileName.innerText = activeFileId ? activeFileId.split(' -> ')[0] : "База не выбрана";
    },

    // Генерирует поля ввода НА ОСНОВЕ СТОЛБЦОВ вашей базы данных
    renderInputFields: function(activeFileId, sessions) {
        const container = document.getElementById('dynamicInputsForm');
        container.innerHTML = '';

        if (!activeFileId || !sessions[activeFileId]) {
            container.innerHTML = `<p class="placeholder-text">Откройте файл с базами, чтобы начать ввод данных.</p>`;
            return;
        }

        const currentDb = sessions[activeFileId];

        currentDb.columns.forEach(col => {
            const group = document.createElement('div');
            group.className = 'input-field-group';

            const label = document.createElement('label');
            label.innerText = `${col}:`;

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `input_${col}`;
            
            // Подсказка для сложных полей типа массивов
            if (col === 'PacCars') input.placeholder = 'Например: [71, 72, 81]';
            else input.placeholder = 'Значение...';

            group.appendChild(label);
            group.appendChild(input);
            container.appendChild(group);
        });
    },

    // ОТРИСОВКА ВАШИХ ДАННЫХ В КРАСИВУЮ HTML-ТАБЛИЦУ
    renderTableData: function(activeFileId, sessions) {
        const container = document.getElementById('htmlTableContainer');
        container.innerHTML = '';

        if (!activeFileId || !sessions[activeFileId]) {
            container.innerHTML = `<p class="placeholder-text">Выберите базу для просмотра таблицы.</p>`;
            return;
        }

        const currentDb = sessions[activeFileId];
        const table = document.createElement('table');
        table.className = 'data-table';

        // 1. Строим заголовки th на основе ключей вашей базы
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        currentDb.columns.forEach(col => {
            const th = document.createElement('th');
            th.innerText = col;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 2. Строим строки td из значений объектов
        const tbody = document.createElement('tbody');
        if (currentDb.rows.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.setAttribute('colspan', currentDb.columns.length);
            td.className = 'placeholder-text';
            td.style.textAlign = 'center';
            td.innerText = 'База данных пуста';
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            currentDb.rows.forEach(row => {
                const tr = document.createElement('tr');
                currentDb.columns.forEach(col => {
                    const td = document.createElement('td');
                    let value = row[col];
                    
                    // Если значение — это массив (как PacCars в вашей базе)
                    if (Array.isArray(value)) {
                        td.innerText = `[ ${value.join(', ')} ]`;
                    } else {
                        td.innerText = value !== null && value !== undefined ? value : 'null';
                    }
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }
        table.appendChild(tbody);
        container.appendChild(table);
    },

    // Конвертирует измененные данные обратно в исходный текстовый формат .js файлов
    refreshCodeViewer: function(activeFileId, sessions) {
        const display = document.getElementById('codeOutput');
        if (!activeFileId || !sessions[activeFileId]) {
            display.innerText = '// Здесь отобразится итоговый код...';
            return;
        }

        const currentDb = sessions[activeFileId];
        let outputCode = "";

        // Если база изначально была словарем (как пользователи)
        if (currentDb.isDictionary) {
            const originalFormatObj = {};
            currentDb.rows.forEach(row => {
                const { User_ID, ...rest } = row;
                if (User_ID) originalFormatObj[User_ID] = rest;
            });
            outputCode = `const ${currentDb.constantName} = ${JSON.stringify(originalFormatObj, null, 4)};`;
        } 
        // Если база была обычным массивом (как продукты, линии, машины)
        else {
            outputCode = `const ${currentDb.constantName} = ${JSON.stringify(currentDb.rows, null, 2)};`;
        }

        display.innerText = outputCode;
    }
};

function mockAddColumn() {
    const colName = prompt("Введите имя нового столбца (на английском):");
    if (!colName) return;
    if (AppState.addColumn(colName)) selectDatabase(AppState.activeFileId);
}

function mockDeleteColumn() {
    if (!AppState.activeFileId) return;
    const colToDelete = prompt(`Какой столбец удалить? Доступные: ${AppState.dbSessions[AppState.activeFileId].columns.join(', ')}`);
    if (!colToDelete) return;
    if (AppState.deleteColumn(colToDelete)) selectDatabase(AppState.activeFileId);
}

function mockSubmitRowData() {
    if (!AppState.activeFileId) return;
    const currentDb = AppState.dbSessions[AppState.activeFileId];
    
    const rowData = {};
    currentDb.columns.forEach(col => {
        const inputEl = document.getElementById(`input_${col}`);
        rowData[col] = inputEl ? inputEl.value : "";
    });

    if (AppState.addRow(rowData)) {
        selectDatabase(AppState.activeFileId);
    }
}

function mockDeleteRow() {
    if (AppState.deleteLastRow()) selectDatabase(AppState.activeFileId);
}

function downloadRealJsFile() {
    if (!AppState.activeFileId) return;
    const codeText = document.getElementById('codeOutput').innerText;
    const blob = new Blob([codeText], { type: 'application/javascript;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = AppState.activeFileId.split(' -> ')[0] || "database.js";
    link.click();
}

