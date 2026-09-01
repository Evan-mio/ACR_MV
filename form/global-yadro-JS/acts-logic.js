// ====================================================
// Универсальная навигация по таблице клавишами (ENTER / СТРЕЛКИ)
// ====================================================
function handleTableNavigation(e) {
    if (!e.target || e.target.tagName !== 'INPUT') return;

    const row = e.target.closest('tr');
    if (!row) return;

    const container = row.closest('tbody') || row.closest('table');
    if (!container) return;

    const rows = container.querySelectorAll('tr');
    if (!rows || rows.length === 0) return;

    const currentIndex = Array.from(rows).indexOf(row);
    const cellIndex = Array.from(row.cells).findIndex(c => c.querySelector('input') === e.target);

    // Клавиши Вниз или Enter
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
        const nextRow = rows[currentIndex + 1];
        if (nextRow) {
            const nextInput = nextRow.cells[cellIndex]?.querySelector('input');
            if (nextInput) {
                nextInput.focus();
                nextInput.select(); 
                e.preventDefault();
            }
        }
    } 
    // Клавиша Вверх
    else if (e.key === 'ArrowUp') {
        const prevRow = rows[currentIndex - 1];
        if (prevRow) {
            const prevInput = prevRow.cells[cellIndex]?.querySelector('input');
            if (prevInput) {
                prevInput.focus();
                prevInput.select(); 
                e.preventDefault();
            }
        }
    }
}

// Автоматически включаем навигацию по стрелочкам для всех таблиц на странице
document.addEventListener('keydown', handleTableNavigation);


// ====================================================
// Глобальный класс для управления формами/актами
// ====================================================
class FormManager {
    // Собирает все данные из полей формы на основе атрибута name
    static collectData(formId) {
        const form = document.getElementById(formId);
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Добавляем штамп времени создания
        data.createdAt = new Date().toISOString();
        return data;
    }

    // Проверяет, заполнены ли обязательные поля
    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'red';
                isValid = false;
            } else {
                field.style.borderColor = '#ccc';
            }
        });

        return isValid;
    }
}


// ====================================================
// Глобальный объект базы данных
// ====================================================
const Database = {
    async saveAct(actType, actData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const storageKey = `acts_${actType}`;
                const currentData = JSON.parse(localStorage.getItem(storageKey)) || [];
                
                currentData.push(actData);
                localStorage.setItem(storageKey, JSON.stringify(currentData));
                
                resolve({ success: true, message: 'Акт успешно сохранен локально' });
            }, 500); 
        });
    }
};
