// Базовые элементы шапки
    const citySelect = document.getElementById('cyti');
    const daySelect = document.getElementById('day');
    const dateInput = document.getElementById('doc-date');
    const targetInput = document.querySelector('input[name="batchCode"]');
    const shiftColorSelect = document.getElementById('shift-color');

    // --- БЛОК 1: АВТОМАТИЧЕСКИЙ РАСЧЕТ BATCH CODE (LOT) ---
    function updateLotValue() {
        if (!dateInput || !dateInput.value || !targetInput) return;

        const date = new Date(dateInput.value);
        if (isNaN(date.getTime())) return;

        // 1. Логика года и недели (ISO-8601)
        const lastYearDigit = date.getFullYear().toString().slice(-1);
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
        }
        const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
        const formattedWeek = weekNumber.toString().padStart(2, '0');

        // Буква дня недели (Пн = A ... Вс = G)
        const daysLetters = ['G', 'A', 'B', 'C', 'D', 'E', 'F']; 
        const dayLetter = daysLetters[date.getDay()];
        const datePart = lastYearDigit + formattedWeek + dayLetter;

        // 2. Логика времени суток (Смена)
        let dayPart = "";
        if (daySelect && daySelect.value === "ДЕНЬ") dayPart = "1";
        if (daySelect && daySelect.value === "НОЧЬ") dayPart = "2";

        // 3. Логика города
        let cityPart = "";
        if (citySelect && citySelect.value === "ЛУЖНИКИ") cityPart = "LUZ";
        if (citySelect && citySelect.value === "НОВОСИБИРСК") cityPart = "NOV";

        // Запись результирующей строки
        targetInput.value = datePart + dayPart + cityPart;
    }

    // Слушатели генерации LOT кода
    if (citySelect) citySelect.addEventListener('change', updateLotValue);
    if (daySelect) daySelect.addEventListener('change', updateLotValue);
    if (dateInput) dateInput.addEventListener('change', updateLotValue);
    if (shiftColorSelect) shiftColorSelect.addEventListener('change', updateLotValue);

    // Первичный запуск расчета LOT
    updateLotValue();
