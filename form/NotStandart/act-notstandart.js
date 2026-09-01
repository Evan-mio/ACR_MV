// Константы хранилища (должны быть одинаковыми на всех страницах и главной)
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

    // 1. Извлекаем draftId из адреса строки (если зашли из черновика на главной)
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId');

    // 2. АВТОПОДСТАНОВКА ДАННЫХ ИЗ ЧЕРНОВИКА
    if (currentDraftId) {
        try {
            const allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
            const savedData = allDrafts[currentDraftId]?.fields;

            if (savedData) {
                // Ищем поля на странице по атрибуту name и возвращаем им значения
                Object.keys(savedData).forEach(name => {
                    const field = form.querySelector(`[name="${name}"]`);
                    if (field) {
                        if (field.type === 'checkbox') field.checked = savedData[name];
                        else field.value = savedData[name];
                    }
                });
                console.log(`✅ Черновик ${currentDraftId} успешно восстановлен в форме`);
            }
        } catch (e) {
            console.error("Ошибка при чтении данных черновика:", e);
        }
    }

    // 3. УНИВЕРСАЛЬНЫЙ АВТОСБОР ВСЕХ ПОЛЕЙ (Шапка + строки таблицы 1-7)
    function collectFormData() {
        const data = {};
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach((field, index) => {
            const name = field.getAttribute('name') || `field_auto_${index}`;
            data[name] = field.type === 'checkbox' ? field.checked : field.value;
        });
        return data;
    }

    // 4. КНОПКА «СВЕРНУТЬ АКТ» (Сохранение копии + Сброс оригинала)
    if (btnCollapse) {
        btnCollapse.addEventListener('click', () => {
            const formData = collectFormData();
            const now = Date.now();

            // Если это новое сворачивание — делаем уникальный ID, если старый черновик — обновляем его
            if (!currentDraftId) {
                currentDraftId = 'draft_' + now;
            }

            // Вытаскиваем параметры для красивого имени в боковом меню
            const shiftColor = formData['shiftColor'] || 'ВЫБОР';
            const shiftTime = formData['sutki'] || 'ВЫБОР';
            const batchVal = formData['batchCode'] || ''; // Поле Batch Code (LOT)
            
            const titleEl = document.querySelector('.main-title');
            let cleanTitle = titleEl ? titleEl.innerText.trim() : 'Акт смывов с кремпера';
            
            // Если название слишком длинное, убираем точку или двоеточие
            if (cleanTitle.includes('.')) cleanTitle = cleanTitle.split('.')[0].trim();
            if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

            // Собираем название карточки: Тип акта [Смена/Время] [Батч]
            let displayTitle = `💼 ${cleanTitle}`;
            if (shiftColor !== 'ВЫБОР' || shiftTime !== 'ВЫБОР') {
                displayTitle += ` [${shiftColor}/${shiftTime}]`;
            }
            if (batchVal.trim() !== '') {
                displayTitle += ` [Лот: ${batchVal}]`;
            }

            try {
                // А) Сохраняем начинку полей в единую базу данных черновиков
                let allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
                allDrafts[currentDraftId] = {
                    timestamp: now,
                    fields: formData
                };
                localStorage.setItem(DRAFT_DATA_KEY, JSON.stringify(allDrafts));

                // Б) Регистрируем карточку в реестре для бокового меню главной страницы
                let registry = JSON.parse(localStorage.getItem(ACTIVE_ACTS_KEY)) || [];
                const existsIndex = registry.findIndex(a => a.id === currentDraftId);
                
                const meta = {
                    id: currentDraftId,
                    url: window.location.pathname, // Запоминает путь к файлу кремпера
                    title: displayTitle,
                    updated: now
                };

                if (existsIndex !== -1) registry[existsIndex] = meta;
                else registry.push(meta);
                localStorage.setItem(ACTIVE_ACTS_KEY, JSON.stringify(registry));

                // В) ПОЛНАЯ ОЧИСТКА ФОРМЫ (Оригинал обнуляется)
                form.reset();
                currentDraftId = null;

                // Уходим на главную
                window.location.href = '/menu/index.html';
            } catch (err) {
                alert('Не удалось свернуть акт. Проверьте свободное место в браузере.');
                console.error(err);
            }
        });
    }

    // 5. КНОПКА «СОХРАНИТЬ В АРХИВ» (Финал)
    if (btnSaveArchive) {
        btnSaveArchive.addEventListener('click', () => {
            const formData = collectFormData();
            const archiveId = 'arch_' + Date.now();

            // Сохраняем финальные данные в архив
            localStorage.setItem(`${ARCHIVE_PREFIX}${archiveId}`, JSON.stringify({
                data: formData,
                savedAt: new Date().toISOString()
            }));

            // Удаляем этот документ из черновиков, так как работа завершена
            if (currentDraftId) {
                let registry = JSON.parse(localStorage.getItem(ACTIVE_ACTS_KEY)) || [];
                registry = registry.filter(a => a.id !== currentDraftId);
                localStorage.setItem(ACTIVE_ACTS_KEY, JSON.stringify(registry));

                let allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
                delete allDrafts[currentDraftId];
                localStorage.setItem(DRAFT_DATA_KEY, JSON.stringify(allDrafts));
            }

            alert('Акт успешно отправлен в архив!');
            form.reset();
            window.location.href = 'menu/index.html';
        });
    }

    // 6. КНОПКА «ОТМЕНА»
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            if (confirm('Выйти на главную страницу? Несохраненные изменения будут безвозвратно потеряны.')) {
                window.location.href = 'menu/index.html';
            }
        });
    }
});
// acts-core.js — Единое автономное ядро для всех 10 типов актов
window.QA_Core = {
    KEYS: {
        ACTIVE_ACTS: 'global_active_acts_list',
        ARCHIVE_PREFIX: 'qaArchive_',
        DRAFT_DATA: 'qa_all_drafts_data'
    },
    // 1. УНИВЕРСАЛЬНЫЙ СБОР ДАННЫХ (Подходит для ЛЮБОЙ формы и таблицы)
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
    // 2. УНИВЕРСАЛЬНАЯ АВТОПОДСТАНОВКА (Заполнит любые инпуты по совпадению name)
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
    // 3. УНИВЕРСАЛЬНАЯ РЕГИСТРАЦИЯ КАРТОЧКИ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ
    saveDraftState(draftId, fileUrl, title, fieldsData) {
        const now = Date.now();
        // Сохраняем внутренности формы
        let allDrafts = JSON.parse(localStorage.getItem(this.KEYS.DRAFT_DATA)) || {};
        allDrafts[draftId] = { timestamp: now, fields: fieldsData };
        localStorage.setItem(this.KEYS.DRAFT_DATA, JSON.stringify(allDrafts));
        // Регистрируем мета-данные в боковое меню
        let acts = JSON.parse(localStorage.getItem(this.KEYS.ACTIVE_ACTS)) || [];
        const existingIndex = acts.findIndex(act => act.id === draftId);
        const actMeta = { id: draftId, url: fileUrl, title: title, updated: now };
        if (existingIndex !== -1) acts[existingIndex] = actMeta;
        else acts.push(actMeta);
        
        localStorage.setItem(this.KEYS.ACTIVE_ACTS, JSON.stringify(acts));
    },
    // 4. УНИВЕРСАЛЬНОЕ УДАЛЕНИЕ ЧЕРНОВИКА ИЗ ПАМЯТИ
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
                    #dop,
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
