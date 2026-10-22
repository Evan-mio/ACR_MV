// Константы хранилища (единые для всех страниц проекта ACR)
const ACTIVE_ACTS_KEY = 'global_active_acts_list'; 
const DRAFT_DATA_KEY = 'qa_all_drafts_data';
const ARCHIVE_PREFIX = 'qaArchive_';

document.addEventListener('DOMContentLoaded', () => {
    // Находим форму по её ID
    const form = document.getElementById('wash-sd-form');
    if (!form) {
        console.error("Форма с id='wash-sd-form' не найдена в HTML!");
        return;
    }

    const btnCancel = document.getElementById('btnCancel');
    const btnSaveArchive = document.getElementById('btnSaveArchive');
    const btnCollapse = document.getElementById('btnCollapse');

    // 1. Извлекаем draftId из адреса строки
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId');

    // 2. АВТОПОДСТАНОВКА ДАННЫХ ИЗ ЧЕРНОВИКА ПРИ ЗАГРУЗКЕ
    if (currentDraftId && window.QA_Core) {
        window.QA_Core.restoreData(form, currentDraftId);
        console.log(`✅ Черновик ${currentDraftId} успешно восстановлен в форме через QA_Core`);
    }

    // 3. КНОПКА «СВЕРНУТЬ АКТ» (Сохранение копии + Сброс оригинала)
    if (btnCollapse) {
        btnCollapse.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.QA_Core) return;

            const formData = window.QA_Core.collectData(form);
            const now = Date.now();

            if (!currentDraftId) {
                currentDraftId = 'draft_' + now;
            }

            // Вытаскиваем параметры для красивого имени в боковом меню
            const shiftColor = formData['shiftColor'] || formData['shift-color'] || 'ВЫБОР';
            const shiftTime = formData['sutki'] || formData['day'] || 'ВЫБОР';
            const batchVal = formData['batchCode'] || formData['batch-code-field'] || ''; 
            
            const titleEl = document.querySelector('.main-title');
            let cleanTitle = titleEl ? titleEl.innerText.trim() : 'Акт верификации';
            
            if (cleanTitle.includes('.')) cleanTitle = cleanTitle.split('.')[0].trim();
            if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split('.')[0].trim();

            // Сборка красивого имени карточки черновика
            let displayTitle = `💼 ${cleanTitle}`;
            if (shiftColor !== 'ВЫБОР' || shiftTime !== 'ВЫБОР') {
                displayTitle += ` [${shiftColor}/${shiftTime}]`;
            }
            if (batchVal.trim() !== '') {
                displayTitle += ` [Лот: ${batchVal}]`;
            }

            // Сохраняем состояние через универсальное ядро
            window.QA_Core.saveDraftState(currentDraftId, window.location.pathname, displayTitle, formData);

            form.reset();
            currentDraftId = null;

            // Безопасный переход без вылета в 404 на Live Server
            window.location.href = '../menu/index.html';
        });
    }

    // 4. КНОПКА «СОХРАНИТЬ В АРХИВ» (Финал)
    if (btnSaveArchive) {
        btnSaveArchive.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.QA_Core) return;

            const formData = window.QA_Core.collectData(form);
            const archiveId = 'arch_' + Date.now();

            // Сохраняем финальные данные в архив
            localStorage.setItem(`${ARCHIVE_PREFIX}${archiveId}`, JSON.stringify({
                data: formData,
                savedAt: new Date().toISOString()
            }));

            // Удаляем этот документ из черновиков, так как работа успешно завершена
            if (currentDraftId) {
                window.QA_Core.clearDraft(currentDraftId);
            }

            alert('Акт успешно отправлен в архив!');
            form.reset();
            window.location.href = '../menu/index.html'; 
        });
    }

    // 5. КНОПКА «ОТМЕНА»
    if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Выйти на главную страницу? Несохраненные изменения будут безвозвратно потеряны.')) {
                window.location.href = '../menu/index.html';
            }
        });
    }

    // Привязываем клавиатурную навигацию на ввод внутри формы
    form.addEventListener('keydown', handleTableNavigation);
});

// ====================================================
// Единое автономное ядро для всех типов актов
// ====================================================
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
            const name = field.getAttribute('name') || `field_auto_${index}`;
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
            const name = field.getAttribute('name') || `field_auto_${index}`;
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

// ====================================================
// ИСПРАВЛЕННАЯ АВТОНОМНАЯ НАВИГАЦИЯ КЛАВИШАМИ
// ====================================================
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

    // ИСПРАВЛЕНО: Динамически находим tbody текущей таблицы, функция больше не падает!
    const tableBody = currentTr.closest('tbody');
    if (!tableBody) return;

    const colIndex = Array.from(currentTr.children).indexOf(currentTd);
    const allRows = Array.from(tableBody.querySelectorAll('tr'));
    const rowIndex = allRows.indexOf(currentTr);

    let targetInput = null;

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault(); 
        if (rowIndex < allRows.length - 1) {
            targetInput = allRows[rowIndex + 1].children[colIndex].querySelector('input, select');
        }
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIndex > 0) {
            targetInput = allRows[rowIndex - 1].children[colIndex].querySelector('input, select');
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
        
        if (typeof targetInput.select === 'function') {targetInput.select();

        }
    }
}