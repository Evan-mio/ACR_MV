// acts-navigation.js — Умная навигация по таблицам клавишами (ENTER / СТРЕЛКИ)
(function() {
    function handleTableNavigation(e) {
        const validKeys = ['Enter', 'ArrowUp', 'ArrowDown'];
        if (!validKeys.includes(e.key)) return;
        if (!e.target || e.target.tagName !== 'INPUT') return;

        // 🔥 ЗАЩИТА: Если открыт datalist (база database.js), стрелки выбирают строки из меню браузера
        if (e.target.hasAttribute('list') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            return; 
        }

        const row = e.target.closest('tr');
        if (!row) return;
        const container = row.closest('tbody') || row.closest('table');
        if (!container) return;

        const rows = Array.from(container.querySelectorAll('tr'));
        const currentIndex = rows.indexOf(row);
        
        // Находим точный индекс ячейки с инпутом внутри строки
        const cellIndex = Array.from(row.cells).findIndex(cell => cell.querySelector('input') === e.target);
        if (cellIndex === -1) return;

        let targetInput = null;

        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            const nextRow = rows[currentIndex + 1];
            if (nextRow && nextRow.cells[cellIndex]) {
                targetInput = nextRow.cells[cellIndex].querySelector('input');
            }
        } else if (e.key === 'ArrowUp') {
            const prevRow = rows[currentIndex - 1];
            if (prevRow && prevRow.cells[cellIndex]) {
                targetInput = prevRow.cells[cellIndex].querySelector('input');
            }
        }

        // 🔥 ЗАЩИТА: Фокусируемся, только если ячейка не заблокирована системой RBAC или mode=view
        if (targetInput && !targetInput.hasAttribute('readonly') && !targetInput.disabled) {
            e.preventDefault(); // Блокируем отправку формы по Enter
            targetInput.focus();
            if (typeof targetInput.select === 'function') {
                targetInput.select(); // Выделяем текст для быстрой перезаписи
            }
        }
    }

    document.addEventListener('keydown', handleTableNavigation);
})();
