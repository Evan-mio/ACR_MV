// =========================================================================
// 1. ИНИЦИАЛИЗАЦИЯ ФОРМЫ СМЫВОВ КРЕМПЕРА И АВТОПОДСТАНОВКА СЕССИИ
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Находим форму по её ID или тегу
    const form = document.getElementById('wash-sd-form') || document.querySelector('form');
    if (!form) {
        console.error("Критическая ошибка: Форма не найдена в HTML-разметке!");
        return;
    }

    const btnCancel = document.getElementById('btnCancel');
    const btnSaveArchive = document.getElementById('btnSaveArchive');
    const btnCollapse = document.getElementById('btnCollapse');

    // Автоматический сбор данных авторизованного сотрудника из текущей сессии
    const savedFirstName = localStorage.getItem('userFirstName') || '';
    const savedLastName = localStorage.getItem('userLastName') || '';
    const fullUserName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : '';

    // Подставляем ФИО в поля лаборанта/техника, если они еще не заполнены
    const techField = form.querySelector('[name*="tech" i]') || form.querySelector('[name*="name" i]');
    if (techField && !techField.value) {
        techField.value = fullUserName;
    }

    // Извлекаем ID черновика из параметров URL (если зашли через боковую панель)
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId');

    // Восстанавливаем данные черновика, если открыли сохраненный бланк кремпера
    if (currentDraftId && window.QA_Core) {
        window.QA_Core.restoreData(form, currentDraftId);
        console.log(`✅ Черновик кремпера ${currentDraftId} успешно восстановлен в форме`);
    }

    // Навешиваем клавиатурную навигацию на ввод внутри всей формы
    form.addEventListener('keydown', handleTableNavigation);

        // =========================================================================
    // 2. КНОПКА «СВЕРНУТЬ АКТ» (СОХРАНЕНИЕ КОПИИ В ЧЕРНОВИКИ)
    // =========================================================================
    if (btnCollapse) {
        btnCollapse.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.QA_Core) return;

            // Собираем все заполненные инпуты формы
            const formData = window.QA_Core.collectData(form);
            const now = Date.now();

            if (!currentDraftId) {
                currentDraftId = 'draft_' + now;
            }

            // Извлекаем маркеры смены и батча для красивого названия карточки
            const shiftColor = formData['shiftColor'] || formData['shift'] || 'ВЫБОР';
            const shiftTime = formData['sutki'] || formData['smena'] || 'ВЫБОР';
            const batchVal = formData['batchCode'] || formData['batch'] || ''; 
            
            const titleEl = document.querySelector('.main-title');
            let cleanTitle = titleEl ? titleEl.innerText.trim() : 'Акт смывов с кремпера';
            if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

            // Формируем заголовок карточки
            let displayTitle = `💼 ${cleanTitle}`;
            if (shiftColor !== 'ВЫБОР' || shiftTime !== 'ВЫБОР') {
                displayTitle += ` [${shiftColor}/${shiftTime}]`;
            }
            if (batchVal.trim() !== '') {
                displayTitle += ` [Лот: ${batchVal}]`;
            }

            // Сохраняем состояние в оперативную память черновиков через ядро
            window.QA_Core.saveDraftState(currentDraftId, window.location.pathname, displayTitle, formData);

            form.reset();
            currentDraftId = null;

            // Безопасный переход назад в меню (3 уровня вверх из папки form/Swab/Swab_Cremper)
            window.location.href = '../../../menu/index.html';
        });
    }

    // =========================================================================
    // 3. КНОПКА «СОХРАНИТЬ В АРХИВ» (ПРОМЫШЛЕННАЯ ВАЛИДАЦИЯ И ОТПРАВКА)
    // =========================================================================
    if (btnSaveArchive) {
        btnSaveArchive.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.QA_Core) return;

            // 🔥 ЗАЩИТА ФАБРИКИ: Проверяем, заполнены ли все поля с атрибутом required в HTML
            if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
                form.reportValidity(); // Подсвечивает первое незаполненное обязательное поле лаборанту
                return;
            }

            const formData = window.QA_Core.collectData(form);
            const archiveId = 'arch_' + Date.now();

            // Безопасное обращение к ключу префикса
            localStorage.setItem(`${window.QA_Core.KEYS.ARCHIVE_PREFIX}${archiveId}`, JSON.stringify({
                data: formData,
                savedAt: new Date().toISOString(),
                status: 'published'
            }));

            // Интегрируем паспорт записи в общую таблицу архива (archive.html)
            let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
            const titleEl = document.querySelector('.main-title');
            let cleanTitle = titleEl ? titleEl.innerText.trim() : 'Акт смывов с кремпера';
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

            // Очищаем черновик, если документ был открыт из папки временных файлов смены
            if (currentDraftId) {
                window.QA_Core.clearDraft(currentDraftId);
            }

            alert('Акт смывов с кремпера успешно заархивирован и внесен в журнал!');
            form.reset();
            window.location.href = '../../../menu/index.html'; 
        });
    }

    // =========================================================================
    // 4. КНОПКА «ОТМЕНА» И ВЫХОД ИЗ СЛУШАТЕЛЯ DOM
    // =========================================================================
    if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Выйти в меню? Все несохраненные изменения в таблице кремпера будут потеряны.')) {
                window.location.href = '../../../menu/index.html';
            }
        });
    }
});

// =========================================================================
// 5. АВТОНОМНОЕ ГЛОБАЛЬНОЕ ЯДРО СБОРА ДАННЫХ БЛАНКОВ (QA_CORE)
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
// 6. НАВИГАЦИЯ ПО ТАБЛИЦЕ КЛАВИШАМИ (ЗАЩИЩЕННАЯ ВЕРСИЯ)
// =========================================================================
function handleTableNavigation(e) {
    const validKeys = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!validKeys.includes(e.key)) return;

    const currentInput = e.target;
    if (currentInput.tagName !== 'INPUT' && currentInput.tagName !== 'SELECT') return;

    if (currentInput.hasAttribute('list') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        return; 
    }

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
