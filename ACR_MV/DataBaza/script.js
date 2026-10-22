const DB_MAP = {
    'NAKE_PRODUCT': 'NAKE_PRODUCT_DATABASE',
    'FG_PRODUCKT': 'FG_PRODUCKT_DATABASE',
    'CAR_GRD': 'CAR_GRD_DATABASA',
    'BB_PRODUCKT': 'BB_PRODUCKT_DATABASE',
    'FG_LINES': 'FG_LINES_DATABASE',
    'FG_PAC_CAR': 'FG_PAC_CAR_DATABASE',
    'BB_LINE': 'BB_LINE_DATABASE',
    'BB_PAC_CAR': 'BB_PAC_CAR_DATABASE',
    'USERS': 'mockUserBase'
};

const TABLE_SCHEMAS = {
    'NAKE_PRODUCT': ['Nake', 'NakeName'],
    'FG_PRODUCKT': ['Nake', 'NakeName', 'GRD', 'GRDName', 'Type'],
    'CAR_GRD': ['GRD', 'PacCars'],
    'BB_PRODUCKT': ['Nake', 'NakeName', 'GRD', 'GRDName', 'Type'],
    'FG_LINES': ['PacLine'],
    'FG_PAC_CAR': ['PacCar'],
    'BB_LINE': ['PacLine'],
    'BB_PAC_CAR': ['PacCar'],
    'USERS': ['id', 'password', 'firstName', 'lastName', 'position', 'branch', 'company', 'shift']
};

let currentTable = 'NAKE_PRODUCT';
let currentEditingIndex = null;
let searchQuery = "";
let db = {};

// Инициализация стартует только когда ВСЕ скрипты гарантированно сидят в памяти
document.addEventListener('DOMContentLoaded', () => {
    initDatabases();
    setupEventListeners();
    renderTable();
});

function initDatabases() {
    // Чистим старый кэш, если он мешает разработке
    const cachedData = localStorage.getItem('v_database_store');
    let localStore = cachedData ? JSON.parse(cachedData) : {};

    Object.keys(DB_MAP).forEach(key => {
        const globalVarName = DB_MAP[key];
        
        // Поиск переменной в глобальном контексте window
        const sourceData = window[globalVarName];

        if (sourceData && Array.isArray(sourceData)) {
            // Если в локальном хранилище уже есть сохраненные сессии изменений — используем их, 
            // но если хранилище пустое — берем полный массив из файла
            db[key] = localStore[key] && localStore[key].length > 0 ? localStore[key] : JSON.parse(JSON.stringify(sourceData));
        } else {
            // Если window не видит переменную, пробуем достучаться напрямую по имени
            try {
                const directData = eval(globalVarName);
                if (Array.isArray(directData)) {
                    db[key] = localStore[key] && localStore[key].length > 0 ? localStore[key] : JSON.parse(JSON.stringify(directData));
                } else {
                    db[key] = localStore[key] ? localStore[key] : [];
                }
            } catch(e) {
                db[key] = localStore[key] ? localStore[key] : [];
                console.error(`Ошибка: Не удалось найти массив данных "${globalVarName}". Проверьте правильность пути к файлу в index.html.`);
            }
        }
    });

    saveToStorage();
}

function setupEventListeners() {
    document.querySelectorAll('.db-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.db-menu-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentTable = e.currentTarget.getAttribute('data-table');
            searchQuery = "";
            document.getElementById('search-input').value = "";
            renderTable();
        });
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTable();
    });

    document.getElementById('add-record-btn').addEventListener('click', openAddModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('modal-form').addEventListener('submit', saveForm);
    document.getElementById('export-btn').addEventListener('click', exportToConsole);
}

function renderTable() {
    const schema = TABLE_SCHEMAS[currentTable];
    const data = db[currentTable] || [];
    
    const thead = document.getElementById('table-head');
    let headHtml = '<tr>';
    schema.forEach(field => headHtml += `<th>${field}</th>`);
    headHtml += `<th style="text-align: right;">Действия</th></tr>`;
    thead.innerHTML = headHtml;

    const filteredData = data.filter(item => {
        if (!searchQuery) return true;
        return schema.some(field => {
            const val = Array.isArray(item[field]) ? item[field].join(', ') : String(item[field] || '');
            return val.toLowerCase().includes(searchQuery.toLowerCase());
        });
    });

    const tbody = document.getElementById('table-body');
    let bodyHtml = '';
    
    if (filteredData.length === 0) {
        bodyHtml = `<tr><td colspan="${schema.length + 1}" style="text-align: center; color: var(--text-muted); padding: 30px;">Нет данных для отображения</td></tr>`;
    } else {
        filteredData.forEach(item => {
            const originalIndex = data.indexOf(item);
            bodyHtml += '<tr>';
            schema.forEach(field => {
                let cellValue = item[field] !== undefined ? item[field] : '';
                if (Array.isArray(cellValue)) {
                    cellValue = cellValue.join(', ');
                }
                bodyHtml += `<td>${cellValue}</td>`;
            });
            bodyHtml += `
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${originalIndex})">Ред.</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord(${originalIndex})">Уд.</button>
                </td>
            </tr>`;
        });
    }
    tbody.innerHTML = bodyHtml;
}

window.deleteRecord = function(index) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        db[currentTable].splice(index, 1);
        saveToStorage();
        renderTable();
    }
};

function openAddModal() {
    currentEditingIndex = null;
    document.getElementById('modal-title').innerText = 'Добавить новую запись';
    generateFormFields({});
    document.getElementById('modal-overlay').classList.add('active');
}

window.openEditModal = function(index) {
    currentEditingIndex = index;
    document.getElementById('modal-title').innerText = 'Редактировать запись';
    const record = db[currentTable][index];
    generateFormFields(record);
    document.getElementById('modal-overlay').classList.add('active');
};

function generateFormFields(data) {
    const schema = TABLE_SCHEMAS[currentTable];
    const container = document.getElementById('form-fields');
    container.innerHTML = '';

    schema.forEach(field => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.innerText = field === 'PacCars' ? `${field} (через запятую)` : field;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.name = field;
        
        let val = data[field] !== undefined ? data[field] : '';
        if (Array.isArray(val)) val = val.join(', ');
        input.value = val;
        
        group.appendChild(label);
        group.appendChild(input);
        container.appendChild(group);
    });
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function saveForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newRecord = {};

    TABLE_SCHEMAS[currentTable].forEach(field => {
        let value = formData.get(field).trim();
        
        if (value && !isNaN(value) && ['Nake', 'GRD', 'id', 'PacCar'].includes(field)) {
            value = Number(value);
        }
        if (field === 'PacCars') {
            value = value ? value.split(',').map(item => isNaN(item.trim()) ? item.trim() : Number(item.trim())) : [];
        }
        
        newRecord[field] = value;
    });

    if (currentEditingIndex !== null) {
        db[currentTable][currentEditingIndex] = newRecord;
    } else {
        db[currentTable].unshift(newRecord);
    }

    saveToStorage();
    closeModal();
    renderTable();
}

function saveToStorage() {
    localStorage.setItem('v_database_store', JSON.stringify(db));
}

function exportToConsole() {
    console.log("%c=== ВАШ ОБНОВЛЕННЫЙ JS КОД ДЛЯ ПОДСТАНОВКИ В ФАЙЛ ===", "color: #3b82f6; font-weight: bold; font-size: 14px;");
    Object.keys(db).forEach(key => {
        const globalVarName = DB_MAP[key];
        console.log(`const ${globalVarName} = ${JSON.stringify(db[key], null, 2)};\n`);
    });
    alert('Массивы данных сгенерированы! Откройте консоль браузера (F12), чтобы скопировать обновленный код в файлы.');
}
