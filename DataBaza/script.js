// Конфигурация соответствия кнопок меню и глобальных переменных баз данных
const DB_MAP = {
    'NAKE_PRODUCT': 'NAKE_PRODUCT_DATABASE',
    'FG_PRODUCKT': 'FG_PRODUCKT_DATABASE',
    'BB_PRODUCKT': 'BB_PRODUCKT_DATABASE',
    'CAR_GRD': 'CAR_GRD_DATABASA',
    'FG_LINES': 'FG_LINES_DATABASE',
    'FG_PAC_CAR': 'FG_PAC_CAR_DATABASE',
    'BB_LINE': 'BB_LINE_DATABASE',
    'BB_PAC_CAR': 'BB_PAC_CAR_DATABASE',
    'USERS': 'mockUserBase' // Имя переменной из второго файла
};

// Схемы полей для генерации таблиц и форм редактирования
const TABLE_SCHEMAS = {
    'NAKE_PRODUCT': ['Nake', 'NakeName'],
    'FG_PRODUCKT': ['Nake', 'NakeName', 'GRD', 'GRDName', 'Type'],
    'BB_PRODUCKT': ['Nake', 'NakeName', 'GRD', 'GRDName', 'Type'],
    'CAR_GRD': ['GRD', 'PacCars'],
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

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initDatabases();
    setupEventListeners();
    renderTable();
});

// Безопасное чтение оригинальных баз данных из глобальной области видимости window
function initDatabases() {
    const cachedData = localStorage.getItem('v_database_store');
    
    if (cachedData) {
        db = JSON.parse(cachedData);
    } else {
        // Если кэша нет, берем массивы «как есть» прямо из ваших JS-файлов
        Object.keys(DB_MAP).forEach(key => {
            const globalVarName = DB_MAP[key];
            db[key] = window[globalVarName] ? JSON.parse(JSON.stringify(window[globalVarName])) : [];
        });
        saveToStorage();
    }
}

// Настройка обработчиков событий (кнопки, инпуты)
function setupEventListeners() {
    // Переключение таблиц по клику на сайдбар
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

    // Живой поиск
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTable();
    });

    // Модальные окна
    document.getElementById('add-record-btn').addEventListener('click', openAddModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('modal-form').addEventListener('submit', saveForm);
    document.getElementById('export-btn').addEventListener('click', exportToConsole);
}

// Отрисовка таблицы на странице
function renderTable() {
    const schema = TABLE_SCHEMAS[currentTable];
    const data = db[currentTable] || [];
    
    // Рендер шапки таблицы
    const thead = document.getElementById('table-head');
    let headHtml = '<tr>';
    schema.forEach(field => headHtml += `<th>${field}</th>`);
    headHtml += `<th style="text-align: right;">Действия</th></tr>`;
    thead.innerHTML = headHtml;

    // Фильтрация данных по поисковому запросу
    const filteredData = data.filter(item => {
        if (!searchQuery) return true;
        return schema.some(field => {
            const val = Array.isArray(item[field]) ? item[field].join(', ') : String(item[field] || '');
            return val.toLowerCase().includes(searchQuery.toLowerCase());
        });
    });

    // Рендер строк таблицы
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

// Удаление записи
window.deleteRecord = function(index) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        db[currentTable].splice(index, 1);
        saveToStorage();
        renderTable();
    }
};

// Модалка добавления
function openAddModal() {
    currentEditingIndex = null;
    document.getElementById('modal-title').innerText = 'Добавить новую запись';
    generateFormFields({});
    document.getElementById('modal-overlay').classList.add('active');
}

// Модалка редактирования
window.openEditModal = function(index) {
    currentEditingIndex = index;
    document.getElementById('modal-title').innerText = 'Редактировать запись';
    const record = db[currentTable][index];
    generateFormFields(record);
    document.getElementById('modal-overlay').classList.add('active');
};

// Генерация формы на основе схемы открытой таблицы
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

// Обработка отправки формы
function saveForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newRecord = {};

    TABLE_SCHEMAS[currentTable].forEach(field => {
        let value = formData.get(field).trim();
        
        // Обработка числовых полей
        if (value && !isNaN(value) && ['Nake', 'GRD', 'id', 'PacCar'].includes(field)) {
            value = Number(value);
        }
        // Специальная обработка для массива вагонов PacCars
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

// Генерация готового JS-кода
function exportToConsole() {
    console.log("%c=== ВАШ ОБНОВЛЕННЫЙ JS КОД ДЛЯ ПОДСТАНОВКИ В ФАЙЛ ===", "color: #3b82f6; font-weight: bold; font-size: 14px;");
    Object.keys(db).forEach(key => {
        const globalVarName = DB_MAP[key];
        console.log(`const ${globalVarName} = ${JSON.stringify(db[key], null, 2)};\n`);
    });
    alert('Готово! Обновленный код для ваших файлов сгенерирован в исходном формате. Откройте консоль (F12), чтобы скопировать массивы.');
}
