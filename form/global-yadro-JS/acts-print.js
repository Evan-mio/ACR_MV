// acts-print.js — Безопасная подготовка документа к печати (Замена inline-стилей под CSP)
(function() {
    window.addEventListener('load', () => {
        // Список селекторов кнопок и панелей, которые не должны попасть на бумагу
        const hiddenSelectors = [
            '#btnEditSheetName', '#tab-list', '.tabs-container button',
            '#btnAddRow', '#btnAddRows5', '#btnAddRows15', '#btnAddSupply',
            '.actions-bar', '.nav-print-link', '.nav-home-link',
            '#btnCollapse', '#btnSaveArchive', '#btnCancel',
            '#collapseBtn', '#saveArchiveBtn'
        ];

        hiddenSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.classList.add('hide-on-print');
            });
        });
        
        console.log('✅ [QA_Print]: Классы hide-on-print успешно распределены по кнопкам.');
    });
})();
