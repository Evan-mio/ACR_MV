// Точка входа и привязка событий к кнопкам
function selectDatabase(fileName) {
    AppState.activeFileId = fileName;
    AppUI.toggleControls(fileName);
    AppUI.updateSidebarList(AppState.dbSessions, AppState.activeFileId, selectDatabase);
    AppUI.refreshCodeViewer(AppState.activeFileId, AppState.dbSessions);
    AppUI.renderInputFields(AppState.activeFileId, AppState.dbSessions);
}

// 1. Событие: Создание базы
function mockCreateDatabaseFile() {
    const dbName = prompt("Введите название новой базы (английскими буквами, например: main_logik):");
    if (!dbName) return;

    const fileName = AppState.createDatabase(dbName);
    if (fileName) {
        selectDatabase(fileName);
    }
}

// 2. Событие: Удаление файла базы
function mockDeleteDatabaseFile() {
    if (!AppState.activeFileId) return;
    if (confirm(`Вы действительно хотите безвозвратно удалить файл ${AppState.activeFileId}?`)) {
        AppState.deleteCurrentDatabase();
        AppUI.toggleControls(null);
        AppUI.updateSidebarList(AppState.dbSessions, null, selectDatabase);
        AppUI.refreshCodeViewer(null, null);
        AppUI.renderInputFields(null, null);
    }
}

// 3. Событие: Добавление столбца сверху
function mockAddColumn() {
    const colName = prompt("Введите имя нового столбца (английскими буквами, например: PacLine):");
    if (!colName) return;

    if (AppState.addColumn(colName)) {
        AppUI.refreshCodeViewer(AppState.activeFileId, AppState.dbSessions);
        AppUI.renderInputFields(AppState.activeFileId, AppState.dbSessions);
    }
}

// 4. Событие: Удаление столбца
function mockDeleteColumn() {
    if (!AppState.activeFileId) return;
    const currentDb = AppState.dbSessions[AppState.activeFileId];
    const removableCols = currentDb.columns.filter(col => col !== 'id');

    if (removableCols.length === 0) {
        alert('Нет пользовательских столбцов для удаления!');
        return;
    }

    const colToDelete = prompt(`Какой столбец удалить? Доступные: ${removableCols.join(', ')}`);
    if (!colToDelete) return;

    if (AppState.deleteColumn(colToDelete)) {
        AppUI.refreshCodeViewer(AppState.activeFileId, AppState.dbSessions);
        AppUI.renderInputFields(AppState.activeFileId, AppState.dbSessions);
    }
}

// 5. Событие: Добавление строки
function mockSubmitRowData() {
    if (!AppState.activeFileId) return;
    const currentDb = AppState.dbSessions[AppState.activeFileId];
    const userColumns = currentDb.columns.filter(col => col !== 'id');

    const rowData = {};
    userColumns.forEach(col => {
        const inputEl = document.getElementById(`input_${col}`);
        rowData[col] = inputEl ? inputEl.value : "";
    });

    if (AppState.addRow(rowData)) {
        userColumns.forEach(col => {
            const inputEl = document.getElementById(`input_${col}`);
            if (inputEl) inputEl.value = '';
        });
        AppUI.refreshCodeViewer(AppState.activeFileId, AppState.dbSessions);
    }
}

// 6. Событие: Удаление строки
function mockDeleteRow() {
    if (AppState.deleteLastRow()) {
        AppUI.refreshCodeViewer(AppState.activeFileId, AppState.dbSessions);
    }
}

// 7. Событие: Физическое скачивание JS файла через браузер
function downloadRealJsFile() {
    if (!AppState.activeFileId) return;
    const codeText = document.getElementById('codeOutput').innerText;
    
    const blob = new Blob([codeText], { type: 'application/javascript;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = AppState.activeFileId;
    link.click();
}

// 8. НОВОЕ СОБЫТИЕ: Имитация быстрого сохранения файла на презентации
function saveDatabaseDemo() {
    if (!AppState.activeFileId) return;
    
    const btn = document.getElementById('btnSaveDemo');
    const originalText = btn.innerText;
    const originalBg = btn.style.backgroundColor;

    // Визуальный эффект для зрителей презентации
    btn.innerText = "⏳ Сохранение...";
    btn.style.backgroundColor = "#eab308"; // Жёлтый цвет загрузки
    btn.style.pointerEvents = "none";

    setTimeout(() => {
        btn.innerText = "✅ Успешно сохранено!";
        btn.style.backgroundColor = "#10b981"; // Зелёный цвет успеха
        
        // Показываем красивое системное уведомление на экране
        alert(`🎉 [ПРОТОТИП]: Изменения успешно перезаписаны в файл проекта по пути:\n/ACR 1/DataBaza/${AppState.activeFileId}`);
        
        // Возвращаем кнопку в исходное состояние
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = originalBg;
            btn.style.pointerEvents = "auto";
        }, 1500);

    }, 800); // Небольшая задержка "обработки" для реалистичности
}

// Модуль управления состоянием данных (Бизнес-логика)
const AppState = {
    dbSessions: {}, // Хранилище всех виртуальных баз
    activeFileId: null, // Имя текущей выбранной базы

    // Генерация случайного имени константы (например, CONST_a8f2)
    generateRandomConstantName: function() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'CONST_';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Создание новой виртуальной базы
    createDatabase: function(dbName) {
        const cleanName = dbName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const fileName = `${cleanName}_database.js`;

        if (this.dbSessions[fileName]) {
            alert('База с таким именем уже открыта!');
            return null;
        }

        this.dbSessions[fileName] = {
            constantName: this.generateRandomConstantName(),
            columns: ["id"],
            rows: []
        };

        this.activeFileId = fileName;
        return fileName;
    },

    // Удаление текущей базы
    deleteCurrentDatabase: function() {
        if (!this.activeFileId) return false;
        delete this.dbSessions[this.activeFileId];
        this.activeFileId = null;
        return true;
    },

    // Добавление столбца
    addColumn: function(colName) {
        if (!this.activeFileId) return false;
        const cleanColName = colName.trim().replace(/[^a-zA-Z0-9_]/g, '');
        if (!cleanColName) return false;

        const currentDb = this.dbSessions[this.activeFileId];
        if (currentDb.columns.includes(cleanColName)) {
            alert('Такой столбец уже существует!');
            return false;
        }

        currentDb.columns.push(cleanColName);
        currentDb.rows.forEach(row => row[cleanColName] = "");
        return true;
    },

    // Удаление столбца
    deleteColumn: function(colToDelete) {
        if (!this.activeFileId) return false;
        const currentDb = this.dbSessions[this.activeFileId];

        if (!currentDb.columns.includes(colToDelete) || colToDelete === 'id') {
            alert('Столбец не найден или защищен от удаления.');
            return false;
        }

        currentDb.columns = currentDb.columns.filter(c => c !== colToDelete);
        currentDb.rows.forEach(row => delete row[colToDelete]);
        return true;
    },

    // Добавление строки
    addRow: function(rowData) {
        if (!this.activeFileId) return false;
        const currentDb = this.dbSessions[this.activeFileId];

        const newRow = { id: currentDb.rows.length + 1 };
        const userColumns = currentDb.columns.filter(col => col !== 'id');

        userColumns.forEach(col => {
            newRow[col] = rowData[col] || "";
        });

        currentDb.rows.push(newRow);
        return true;
    },

    // Удаление последней строки
    deleteLastRow: function() {
        if (!this.activeFileId) return false;
        const currentDb = this.dbSessions[this.activeFileId];

        if (currentDb.rows.length === 0) {
            alert('В таблице еще нет строк для удаления!');
            return false;
        }

        currentDb.rows.pop();
        return true;
    }
};

// Модуль управления внешним видом (Отрисовка UI)
const AppUI = {
    // Обновление списка баз на боковой панели
    updateSidebarList: function(sessions, activeId, selectCallback) {
        const list = document.getElementById('sidebarDbList');
        list.innerHTML = '';
        
        Object.keys(sessions).forEach(fileName => {
            const li = document.createElement('li');
            li.className = `db-item ${fileName === activeId ? 'active' : ''}`;
            li.innerText = `📦 ${fileName}`;
            li.onclick = () => selectCallback(fileName);
            list.appendChild(li);
        });
    },

    // Активация или блокировка кнопок управления
    toggleControls: function(activeFileId) {
        const elements = ['btnCol', 'btnDelCol', 'btnRow', 'btnDelRow', 'btnDeleteDb'];
        const btnDownload = document.getElementById('btnDownload');
        const btnSaveDemo = document.getElementById('btnSaveDemo'); // Ссылка на новую кнопку
        const currentFileName = document.getElementById('currentFileName');

        if (activeFileId) {
            elements.forEach(id => document.getElementById(id).removeAttribute('disabled'));
            btnDownload.style.display = 'block';
            if (btnSaveDemo) btnSaveDemo.style.display = 'block'; // Показываем кнопку сохранения
            currentFileName.innerText = activeFileId;
        } else {
            elements.forEach(id => document.getElementById(id).setAttribute('disabled', 'true'));
            btnDownload.style.display = 'none';
            if (btnSaveDemo) btnSaveDemo.style.display = 'none'; // Скрываем
            currentFileName.innerText = "База не выбрана";
        }
    },

    // Динамическая генерация окошек ввода под структуру столбцов
    renderInputFields: function(activeFileId, sessions) {
        const container = document.getElementById('dynamicInputsForm');
        container.innerHTML = '';

        if (!activeFileId || !sessions[activeFileId]) {
            container.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; font-size: 14px; margin-top: 15px;">Создайте базу данных и добавьте столбцы, чтобы начать ввод.</p>`;
            return;
        }

        const currentDb = sessions[activeFileId];
        const userColumns = currentDb.columns.filter(col => col !== 'id');

        if (userColumns.length === 0) {
            container.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; font-size: 14px; margin-top: 15px;">Столбцов пока нет. Нажмите «Добавить столбец» сверху.</p>`;
            return;
        }

        userColumns.forEach(col => {
            const group = document.createElement('div');
            group.className = 'input-field-group';
            group.innerHTML = `
                <label for="input_${col}">${col}:</label>
                <input type="text" id="input_${col}" placeholder="Значение...">
            `;
            container.appendChild(group);
        });
    },

    // Форматирование и вывод JS-кода в нижний монитор
    refreshCodeViewer: function(activeFileId, sessions) {
        const display = document.getElementById('codeOutput');
        if (!activeFileId || !sessions[activeFileId]) {
            display.innerText = '// Здесь будет отображаться сгенерированный JS-код вашего скрипта...';
            return;
        }

        const currentDb = sessions[activeFileId];
        const generatedJsCode = `// Сгенерированный файл скрипта: /ACR 1/DataBaza/${activeFileId}\n` +
`// Динамическая константа со случайным именем:\n` +
`const ${currentDb.constantName} = {\n` +
`    columns: ${JSON.stringify(currentDb.columns)},\n` +
`    rows: ${JSON.stringify(currentDb.rows, null, 8)}\n` +
`};\n\n` +
`if (typeof module !== 'undefined') {\n` +
`    module.exports = ${currentDb.constantName};\n` +
`}`;

        display.innerText = generatedJsCode;
    }
};

// Имитация работы с БД (сейчас через LocalStorage, в будущем — fetch к бэкенду)
const Database = {
    // Имитируем асинхронное сохранение акта
    async saveAct(actType, actData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Пока бэкенда нет, пишем в LocalStorage браузера
                const storageKey = `acts_${actType}`;
                const currentData = JSON.parse(localStorage.getItem(storageKey)) || [];
                
                currentData.push(actData);
                localStorage.setItem(storageKey, JSON.stringify(currentData));
                
                resolve({ success: true, message: 'Акт успешно сохранен локально' });
            }, 500); // Имитация задержки сети 500мс
        });
    }
};

// 🔮 БЛОК 3. Интерактивный неоновый трекер мыши
function initCardMouseTracker() {
    const cards = document.querySelectorAll('.card, .act-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}