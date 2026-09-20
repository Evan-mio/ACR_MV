const app = document.getElementById("content-swab-app");

if (app) {
    const header = document.createElement("div");
    header.style.backgroundColor = "#f1f5f9";
    header.style.borderBottom = "1px solid #e2e8f0";
    header.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
    header.style.position = "sticky";
    header.style.top = "0";
    header.style.zIndex = "100";
    header.style.padding = "15px";
    header.style.display = "flex";
    header.style.gap = "100px";

    const buttonGroup = document.createElement("div");
    buttonGroup.style.display = "flex";
    buttonGroup.style.gap = "10px";

    // кнопка на главную (исправлено с dutton на button)
    const homeBtn = document.createElement("button");
    homeBtn.innerText = "🏠 На главную";
    homeBtn.style.backgroundColor = "#ffffff";
    homeBtn.style.border = "1px solid #cbd5e1";
    homeBtn.style.padding = "6px 12px";
    homeBtn.style.borderRadius = "4px";
    homeBtn.style.cursor = "pointer";

    homeBtn.onclick = () => {
        window.location.href = '/menu/index.html';
    };

    // кнопка печати
    const printBtn = document.createElement("button");
    printBtn.innerText = "🖨️ Печать";
    printBtn.style.backgroundColor = "#0284c7";
    printBtn.style.color = "#ffffff";
    printBtn.style.border = "none";
    printBtn.style.padding = "6px 12px";
    printBtn.style.borderRadius = "4px";
    printBtn.style.cursor = "pointer";

    printBtn.onclick = () => {
        window.print();
    };

    buttonGroup.appendChild(homeBtn);
    buttonGroup.appendChild(printBtn);
    header.appendChild(buttonGroup);

    // СОЗДАНИЕ И ЗАПУСК ЖИВЫХ ЧАСОВ
    const clock = document.createElement("time");
    clock.style.display = "flex";
    clock.style.color = "#475569"; 
    clock.style.fontSize = "1.5rem";
    clock.style.fontWeight = "700";
    clock.style.right = "0";

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        clock.innerText = `${hours}:${minutes}:${seconds}`;
        clock.setAttribute("datetime", now.toISOString());
    }

    updateClock();
    setInterval(updateClock, 1000);

    // Добавляем часы в шапку (теперь они встанут справа от кнопок)
    header.appendChild(clock);

    // Вставляем готовую шапку в наше приложение
    app.appendChild(header);

    const navContainer = document.createElement("div");
    navContainer.style.maxWidth = "100%";
    navContainer.style.margin = "0 auto";
    navContainer.style.padding = "15px 10px";

    const mainTitle = document.createElement("span");
    mainTitle.innerText = "СМЫВЫ: Акт микробиологической верификации.";
    mainTitle.style.display = "block"; 
    mainTitle.style.fontSize = "25px";
    mainTitle.style.fontWeight = "700";
    mainTitle.style.color = "#0f172a";
    mainTitle.style.textAlign = "center";
    mainTitle.style.marginBottom = "20px";
    navContainer.appendChild(mainTitle);

    const cardGridGroup = document.createElement("div");
    cardGridGroup.style.display = "grid";
    cardGridGroup.style.gridTemplateColumns = "repeat(auto-fit, minmax(300px, 1fr))";
    cardGridGroup.style.gap = "15px";
    cardGridGroup.style.marginBottom = "15px";

    const metaGrid = document.createElement("div");
    metaGrid.style.background = "#f1f5f9";
    metaGrid.style.border = "1px solid #e2e8f0";
    metaGrid.style.borderLeft = "4px solid #10d981";
    metaGrid.style.borderRadius = "12px";
    metaGrid.style.padding = "15px";
    metaGrid.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
    metaGrid.style.display = "flex";
    metaGrid.style.flexDirection = "column";

    metaGrid.innerHTML = `
        <!-- СТРОКА 1: Фабрика и Статус фабрики -->
        <div class="form-group" style="display: flex; gap: 10px; padding-bottom: 10px; border-radius: 15px;">
            <div style="flex: 1;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 5px; font-weight: 600;">Фабрика</label>
                <select name="gorod" id="cyti" style="border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000; font-size: 0.85rem; font-weight: 600; width: 100%;  padding: 8px; box-sizing: border-box;">
                    <option value="ВЫБОР">--ВЫБЕРИТЕ--</option>
                    <option value="ЛУЖНИКИ">ЛУЖНИКИ</option>
                    <option value="НОВОСИБИРСК">НОВОСИБИРСК</option>
                </select>
            </div>
            <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.85rem;">Статус фабрики</label>
                <input type="text" name="status" value="Золотой и платиновый" required 
                    style=" font-size: 0.85rem; font-weight: 600; width: 100%; padding: 8px; box-sizing: border-box; 
                    border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
            </div>
        </div>
        <!-- СТРОКА 2: shift Сменa -->
        <div class="form-group" style="display: flex; gap: 10px; padding-bottom: 10px; border-radius: 15px;">
            <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 1rem;">Shift</label>
                <select id="shift-color" name="shiftColor" style="width: 100%; padding: 8px; box-sizing: border-box; font-size: 0.85rem; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
                    <option value="ВЫБОР">--ВЫБЕРИТЕ--</option>
                    <option value="WHITE">WHITE</option>
                    <option value="BROWN">BROWN</option>
                    <option value="GREEN">GREEN</option>
                    <option value="VIOLET">VIOLET</option>
                </select>
            </div>
            <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 1rem;">План отбора</label>
                <select id="plan" name="otbor" style=" font-size: 0.85rem; font-weight: 600;width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
                    <option value="ВЫБОР">--ВЫБЕРИТЕ--</option>
                    <option value="ДЕНЬ" style="background-color: #fff;">СТАНДАРТНЫЙ</option>
                    <option value="НОЧЬ" style="background-color: #fff;">РАСШИРЕНЫЙ</option>
                </select>
            </div>
        </div>
        <!-- СТРОКА 3: Кто проводил отбор проб (ФИО) -->
        <div class="form-group" style="display: flex; gap: 10px; padding-bottom: 10px; border-radius: 15px;">
            <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 1rem;">Смена</label>
                <select name="sutki" id="day" style=" font-size: 0.85rem; font-weight: 600;width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
                    <option value="ВЫБОР">--ВЫБЕРИТЕ--</option>
                    <option value="ДЕНЬ" style="background-color: #fff;">ДЕНЬ</option>
                    <option value="НОЧЬ" style="background-color: #fff;">НОЧЬ</option>
                </select>
            </div>
            <div style="flex: 1;">
                <label style=" font-size: 0.85rem; font-weight: 600; width: 100%; padding: 8px; box-sizing: border-box;">(ФИО) Техника</label>
                <input type="text" id="controller-name" name="controllerName" value="NAME" placeholder="Введите фамилию" style="width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
            </div>
        </div>
        <!-- СТРОКА 4: Дата отбора проб и Batch Code (LOT) -->
        <div class="form-group" style="display: flex; gap: 15px; padding-bottom: 10px; border-radius: 15px;">
            <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.85rem;">Дата отбора проб</label>
                <input type="date" id="doc-date" name="docDate" value="2026-05-29" required style=" font-size: 0.85rem; font-weight: 600; width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
            </div>
            <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.85rem;">Batch Code (LOT)</label>
                <input type="text" id="batch-code-field" name="batchCode" value="" style="font-size: 0.85rem; font-weight: 600; width: 100%; padding: 8px; box-sizing: border-box; font-family: monospace; font-weight: 700; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;" readonly>
            </div>
        </div>
    </div>
    `;

    const reglamentGrid = document.createElement("div");
    reglamentGrid.style.background = "#f1f5f9";
    reglamentGrid.style.border = "1px solid #e2e8f0";
    reglamentGrid.style.borderLeft = "4px solid #10d981";
    reglamentGrid.style.borderRadius = "12px";
    reglamentGrid.style.padding = "15px";
    reglamentGrid.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
    reglamentGrid.style.display = "flex";
    reglamentGrid.style.flexDirection = "column";

    reglamentGrid.innerHTML = `
        <div class="meta-card meta-card-gray" id="dop">
            <div style="font-weight: 700; font-size: 1.5rem;padding-bottom: 10px; color: #000;">📋 Инструкция к заполнению:</div>
            <p style="margin-bottom: 5px; font-size: 0.9rem; border: 1px solid silver;padding: 2px; border-radius: 10px; background-color: #ffffff;">1. Смывы отбираются только в дневную смену во время производства ДНЕМ.</p>
            <p style="margin-bottom: 5px; font-size: 1rem; border: 1px solid silver;padding: 2px; border-radius: 10px; background-color: #ffffff;">2. На каждый отобранный смыв приклеивается этикетка со штрихкодом.</p>
            <p style="margin-bottom: 5px; font-size: 0.9rem; border: 1px solid silver;padding: 2px; border-radius: 10px; background-color: #ffffff;">3. Если смыв не отобран, неиспользованная этикетка клеится на оборот чеклиста.</p>
            <p style="margin-bottom: 5px; font-size: 1rem; border: 1px solid silver;padding: 2px; border-radius: 10px; background-color: #ffffff;">4. Все образцы собираются в отдельную емкость или пакетик-маечку.</p>
        </div>
    `;

    const labGrid = document.createElement("div");
    labGrid.style.background = "#f1f5f9";
    labGrid.style.border = "1px solid #e2e8f0";
    labGrid.style.borderLeft = "4px solid #10d981";
    labGrid.style.borderRadius = "12px";
    labGrid.style.padding = "15px";
    labGrid.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
    labGrid.style.display = "flex";
    labGrid.style.flexDirection = "column";

    labGrid.innerHTML = `
        <div class="meta-card meta-card-gray">
            <div style="font-weight: 700; font-size: 1.5rem; margin-bottom: 4px; color: #1e293b;">🔬 Спецификация Сальмонелла / Энтеро:</div>
            <p style="margin-bottom: 2px; border: 1px solid silver;padding: 2px; border-radius: 10px; background-color: #ffffff;"><strong>Сальмонелла:</strong> Каждая дневная смена. 1. С пола губками (1м х 1м). 2. С оборудования палочками (10см х 10см).</p>
            <p style="margin-bottom: 12px; border: 1px solid silver;padding: 2px; border-radius: 10px; background-color: #ffffff;"><strong>Энтеро/Дрожжи/Плесень:</strong> Только в понедельник! 1. С пола губками (1м х 1м). 2. С оборудования палочками (10см х 10см).</p>
            <!-- Корректный Flex-контейнер для полей лаборатории -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 1rem;">Фамилия лаборанта</label>
                    <input type="text" name="lab-name" id="lab-controller-name" value="NAME" required style="width: 100%; padding: 8px; box-sizing: border-box; font-size: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
                </div>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 1rem;">Дата получения</label>
                        <input type="date" name="lab-doc-date" id="lab-doc-date" value="2026-05-29" required style="width: 100%; padding: 8px; box-sizing: border-box; font-size: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 1rem;">Время получения</label>
                        <input type="time" name="lab-time" class="table-input tm-l" required style="width: 100%; padding: 8px; box-sizing: border-box; font-size: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; color: #000;">
                    </div>
                </div>
            </div>
        </div>
    `;

    cardGridGroup.appendChild(metaGrid);
    cardGridGroup.appendChild(reglamentGrid);
    cardGridGroup.appendChild(labGrid);
    navContainer.appendChild(cardGridGroup);

    app.appendChild(navContainer);


    const table = document.createElement("table");
table.style.width = "98%";
table.style.margin = "15px";
table.style.fontSize = "13px";
table.style.fontFamily = "sans-serif";
table.style.color = "#334155";
table.style.borderCollapse = "separate";  // Меняем collapse на separate
table.style.borderSpacing = "0";          // Убираем зазоры, ячейки плотно прижмутся
table.style.border = "1px solid #cbd5e1"; // Внешняя рамка самой таблицы
table.style.borderRadius = "8px";        // Задаем радиус скругления
table.style.overflow = "hidden";   

    table.innerHTML = `
        <colgroup>
            <col style="width: 1%">  <!--чекбокс -->
            <col style="width: 4%">  <!--атла чтота -->
            <col style="width: 7%">  <!--атлас какта -->
            <col style="width: 4%">  <!--Указать номер с которого взяли смыв -->
            <col style="width: 20%">  <!--Место отбора (русское название) -->
            <col style="width: 4%">  <!--Время смыва -->
            <col style="width: 3%">  <!--№ смыва -->
            <col style="width: 8%">  <!--Лаб. № -->
            <col style="width: 8%">  <!--IL -->
            <col style="width: 3%">  <!--№ смыва -->
            <col style="width: 8%">  <!--Лаб. № -->
            <col style="width: 8%">  <!--IL -->
        </colgroup>
        <thead>
            <tr><th class="section-row-header" colspan="12"></th></tr>
            <tr>
                <th colspan="2">атла чтота</th>
                <th>атлас какта</th>
                <th>Указать номер с которого взяли смыв</th>
                <th>Место отбора (русское название)</th>
                <th>Время смыва</th>
                <th>№ смыва</th>
                <th>Лаб. №</th>
                <th>IL</th>
                <th>№ смыва</th>
                <th>Лаб. №</th>
                <th>IL</th>
            </tr>
        </thead>
        <tbody id="wash-table-body">
            <!-- СЕКЦИЯ: ЭКСТРУДЕР -->
            <tr><td class="section-row-header" colspan="11">Экструдер</td></tr>
            <tr data-row-group="1" name="row-1">
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-1">атла чтота</td>
                <td class="text-static" name="atlass-name-1">атлас какта</td>
                <td class="text-static" style="background-color: silver;"></td>
                <td class="text-static" name="name-rus-1">Полы санпропускник на мельницу</td>
                <td><input type="time" name="time-proba-1" class="table-input tm-l"></td>
                <td class="text-center-bold" name="no-otbora-1">1</td>
                <td><input type="text" name="no-lab-1" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-1" class="table-input lb-2"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
            </tr>
            <tr>
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-27">атла чтота</td>
                <td class="text-static" name="atlass-name-27">атлас какта</td>
                <td class="text-static" style="background-color: silver;"></td>
                <td class="text-static" name="name-rus-27">Полы санпропускник на мельницу</td>
                <td><input type="time" name="time-proba-27" class="table-input tm-l"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-center-bold" name="no-otbora-27">27</td>
                <td><input type="text" name="no-lab-27" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-27" class="table-input lb-2"></td>
            </tr>
            <tr data-row-group="9" name="row-9">
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-9">атла чтота</td>
                <td class="text-static" name="atlass-name-9">атлас какта</td>
                <td class="text-static"><input type="text" name="number-9" class="table-input lb-l"></td>
                <td class="text-static" name="name-rus-9">ревочный бин</td>
                <td><input type="time" name="time-proba-9" class="table-input tm-l"></td>
                <td class="text-center-bold" name="no-otbora-9">9</td>
                <td><input type="text" name="no-lab-9" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-9" class="table-input lb-2"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
            </tr>
            <tr>
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-35">атла чтота</td>
                <td class="text-static" name="atlass-name-35">атлас какта</td>
                <td class="text-static"><input type="text" name="number-35" class="table-input lb-l"></td>
                <td class="text-static" name="name-rus-35">ревочный бин</td>
                <td><input type="time" name="time-proba-35" class="table-input tm-l"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-center-bold" name="no-otbora-35">35</td>
                <td><input type="text" name="no-lab-35" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-35" class="table-input lb-2"></td>
            </tr>
            <!-- СЕКЦИЯ: Моечная комната -->
            <tr><td class="section-row-header" colspan="11">Моечная комната</td></tr>
            <tr data-row-group="12" name="row-12">
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-12">атла чтота</td>
                <td class="text-static" name="atlass-name-12">атлас какта</td>
                <td class="text-static" style="background-color: silver;"></td>
                <td class="text-static" name="name-rus-12">Полы перед входом в моечную комнату</td>
                <td><input type="time"  name="time-proba-12"class="table-input tm-l"></td>
                <td class="text-center-bold" name="no-otbora-12">12</td>
                <td><input type="text" name="no-lab-12" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-12" class="table-input lb-2"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
            </tr>
            <tr>
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-38">атла чтота</td>
                <td class="text-static" name="atlass-name-38">атлас какта</td>
                <td class="text-static" style="background-color: silver;"></td>
                <td class="text-static" name="name-rus-38">Полы перед входом в моечную комнату</td>
                <td><input type="time"  name="time-proba-38"class="table-input tm-l"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-center-bold" name="no-otbora-38">38</td>
                <td><input type="text" name="no-lab-38" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-38" class="table-input lb-2"></td>
            </tr>
            <!-- СЕКЦИЯ: Сушилка -->
            <tr><td class="section-row-header" colspan="11">Сушилка</td></tr>
            <tr data-row-group="13" name="row-13">
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-13">атла чтота</td>
                <td class="text-static" name="atlass-name-13">атлас какта</td>
                <td class="text-static" style="background-color: silver;"></td>
                <td class="text-static" name="name-rus-13">Пол перед входом в санпропускник на экструдер</td>
                <td><input type="time"  name="time-proba-13"class="table-input tm-l"></td>
                <td class="text-center-bold" name="no-otbora-13">13</td>
                <td><input type="text" name="no-lab-13" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-13" class="table-input lb-2"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
            </tr>
            <tr>
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-39">атла чтота</td>
                <td class="text-static" name="atlass-name-39">атлас какта</td>
                <td class="text-static" style="background-color: silver;"></td>
                <td class="text-static" name="name-rus-39">Пол перед входом в санпропускник на экструдер</td>
                <td><input type="time" name="time-proba-39" class="table-input tm-l"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-center-bold" name="no-otbora-39">39</td>
                <td><input type="text" name="no-lab-39" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-39" class="table-input lb-2"></td>
            </tr>
            <!-- СЕКЦИЯ: Упаковка, вентиляционная комната -->
            <tr><td class="section-row-header" colspan="11">Упаковка, вентиляционная комната</td></tr>
            <tr data-row-group="19" name="row-19">
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-19">атла чтота</td>
                <td class="text-static" name="atlass-name-19">атлас какта</td>
                <td class="text-static" style="background-color: silver;"></td>
                <td class="text-static" name="name-rus-19">Лестница с упаковки в офис</td>
                <td><input type="time" name="time-proba-19" class="table-input tm-l"></td>
                <td class="text-center-bold" name="no-otbora-19">19</td>
                <td><input type="text" name="no-lab-19" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-19" class="table-input lb-2"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
            </tr>
            <tr>
                <td><input type="checkbox"></td>
                <td class="text-static" name="atlass-45">атла чтота</td>
                <td class="text-static" name="atlass-name-45">атлас какта</td>
                <td class="text-static" style="background-color: silver;"></td>
                <td class="text-static" name="name-rus-45">Лестница с упаковки в офис</td>
                <td><input type="time" name="time-proba-45" class="table-input tm-l"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-static"></td>
                <td class="text-center-bold" name="no-otbora-45">45</td>
                <td><input type="text" name="no-lab-45" class="table-input lb-l"></td>
                <td><input type="text" name="no-il-45" class="table-input lb-2"></td>
            </tr>
            <tr><td class="section-row-header" colspan="11"></td></tr>
        </tbody>
    `;

    const styleTeg = document.createElement("style");
    styleTeg.innerHTML = `
.table-container,
.act-table-wrapper {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 15px;
}

.table-scroll {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid silver;
}

table,
.act-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

th {
    background-color: #f1f5f9;
    color: #475569;
    font-weight: 700;
    border: 1px solid #cbd5e1;
    text-align: center;
    font-size: 11px;
    padding: 6px 4px;
}

td {
    padding: 4px !important;
    border: 1px solid #cbd5e1;
    font-size: 12px;
    vertical-align: middle;
    box-sizing: border-box;
}

/* Поля ввода внутри таблицы */
.table-input,
.act-table input {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid transparent;
    text-align: center;
    background: transparent;
    padding: 4px 2px;
    border-radius: 4px;
    font-size: 12px;
    color: #000;
}

.table-input:focus,
.act-table input:focus {
    background-color: #eff6ff;
    border-color: #3b82f6;
    outline: none;
}

/* Заголовки технологических участков производства */
.section-row-header {
    background-color: #e2e8f0;
    font-weight: 800;
    text-align: center;
    color: #1e293b;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.text-static {
    color: #475569;
    font-weight: 500;
}

.text-center-bold {
    text-align: center;
    font-weight: 700;
    color: #1e293b;
    background-color: #f8fafc;
}

input[type="text"],
input[type="date"],
input[type="time"],
input[type="number"],
select {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 13px;
    color: #000;
    background-color: #ffffff;
}

input[readonly] {
    background-color: #f1f5f9;
    color: #475569;
    font-weight: 600;
}

    `;

    document.head.appendChild(styleTeg);

    app.appendChild(table);

        // СОЗДАЕМ БЛОК КНОПОК ДЕЙСТВИЙ
    const actionsBar = document.createElement("div");
    actionsBar.className = "actions-bar";
    actionsBar.style.display = "flex";
    actionsBar.style.gap = "12px";
    actionsBar.style.marginTop = "24px";
    actionsBar.style.flexDirection = "row-reverse";
    actionsBar.style.flexWrap = "wrap";
    actionsBar.style.padding = "8px 16px";
    actionsBar.style.borderRadius = "8px";
    actionsBar.style.fontSize = "13px";
    actionsBar.style.fontWeight = "600";
    actionsBar.style.cursor = "pointer";
    actionsBar.style.border = "1px solid transparent";
    actionsBar.style.transform = "all 0.2s ease-in-out";


    actionsBar.innerHTML = `
        <button type="button" class="btn btn-secondary" id="btnCancel" 
            style="background-color: #64748b; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
            ❌ Отмена (без сохранения)
        </button>
        
        <button type="submit" class="btn btn-primary" id="btnSaveArchive" 
            style="background-color: #10b981; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
            💾 Сохранить в архив
        </button>
        
        <button type="button" class="btn btn-warning" id="btnCollapse" 
            style="background-color: #f59e0b; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
            📦 Свернуть акт (сохранить как черновик)
        </button>
    `;

    const btnCancel = actionsBar.querySelector("#btnCancel");
    const btnSaveArchive = actionsBar.querySelector("#btnSaveArchive");
    const btnCollapse = actionsBar.querySelector("#btnCollapse");

    btnCancel.onclick = () => {
        if (confirm("Вы уверены, что хотите выйти без сохранения? Все данные будут потеряны.")) {
            window.location.reload(); // Сброс страницы
        }
    };

    btnSaveArchive.onclick = (e) => {
        e.preventDefault(); // Защита от перезагрузки страницы формой
        alert("🎉 Акт успешно валидирован и отправлен в архив микробиологии!");
        // Здесь в будущем будет логика сбора данных из таблицы
    };

    btnCollapse.onclick = () => {
        alert("📦 Акт свернут и сохранен в локальные черновики.");
    };

    const styleBtn = document.createElement("style");
    styleBtn.innerHTML = `
    .btn-secondary {
    background-color: #e5e7eb;
    border-color: #cbd5e1;
    color: #374151;
}

.btn-primary {
    background-color: #2563eb;
    color: white;
}

.btn-warning {
    background-color: #f59e0b;
    color: white;
}

.btn-success {
    background-color: #10b981;
    color: white;
}

/* Общий аккуратный ховер для кнопок подвала */
.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
    opacity: 0.95;
}
    `;

    document.head.appendChild(styleBtn);

    app.appendChild(actionsBar);


    // СОЗДАЕМ ПОДВАЛ ДЛЯ ПЕЧАТИ (PRINT FOOTER)
    const printFooter = document.createElement("div");
    printFooter.className = "print-footer";
    
    // Задаем стили из вашего примера
    printFooter.style.padding = "10px";
    printFooter.style.margin = "10px 15px";
    printFooter.style.display = "flex";
    printFooter.style.justifyContent = "space-between";
    printFooter.style.fontSize = "0.65rem";
    printFooter.style.color = "#94a3b8"; // Мягкий серый цвет для служебной информации
    printFooter.style.borderTop = "1px dashed #cbd5e1"; // Пунктирная линия отделения подвала

    printFooter.innerHTML = `
        <span>W: 01 от 22.08.2024</span>
        <span>Страница 1 из 1</span>
    `;

    // Вставляем подвал в самый низ приложения
    app.appendChild(printFooter);

    const print = document.createElement("style");
    print.innerHTML = `
    @media print {
    /* 1. Намертво прячем инструкции, шапки сайтов, панели черновиков и кнопки */
    #dop,
    #tab-list,
    .header,
    .header-container,
    .back-btn,
    .nav-print-link,
    .nav-home-link,
    .actions-bar,
    .tabs-container,
    button,
    .btn,
    h3, 
    ul,
    ol,
    .container > p,
    div[style*="font-weight: bold"] {
        display: none !important;
    }
    
    /* 2. Сброс серого фона и отступов под формат листа бумаги А4 */
    body {
        background-color: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    
    .container {
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 auto !important;
    }
    
    /* 3. Растягиваем таблицы на всю ширину листа */
    .table-container,
    .act-table-wrapper {
        border: 1px solid #000000 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
    }

    table,
    .act-table {
        width: 100% !important;
        min-width: 100% !important;
        table-layout: auto !important;
    }

    th, td {
        border: 1px solid #000000 !important;
        color: #000000 !important;
    }

    /* 4. Превращаем поля ввода в чистый печатный текст без серых рамок */
    input[type="text"],
    input[type="date"],
    input[type="time"],
    input[type="number"],
    select,
    .table-input,
    .act-table input {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 4px !important;
        color: #000000 !important;
    }
}
    `;

    document.head.appendChild(print);

} else {
    console.error("❌ Ошибка: Элемент с ID 'content-swab-app' не найден на странице!");
};

// =========================================================================
// 1. БЕЗОПАСНЫЕ ПРЕФИКСЫ (ФИКС ОШИБКИ RE-DECLARATION CONST)
// =========================================================================
if (typeof ARCHIVE_PREFIX === 'undefined') { var ARCHIVE_PREFIX = 'qaArchive_'; }
if (typeof ACTIVE_ACTS_KEY === 'undefined') { var ACTIVE_ACTS_KEY = 'global_active_acts_list'; }
if (typeof DRAFT_DATA_KEY === 'undefined') { var DRAFT_DATA_KEY = 'qa_all_drafts_data'; }
if (typeof SHADOW_PREFIX === 'undefined') { var SHADOW_PREFIX = 'shadow_arch_'; }
if (typeof FINAL_ARCHIVE_PREFIX === 'undefined') { var FINAL_ARCHIVE_PREFIX = 'qaArchive_'; }

var BLANK_VERSION = '2.1.0'; 
var mainForm = null;

// =========================================================================
// 2. ОБРАБОТЧИК ЗАГРУЗКИ СТРАНИЦЫ И РАЗВОРАЧИВАНИЕ ИЗ ХРАНИЛИЩА
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    mainForm = document.getElementById('wash-sd-form') || document.querySelector('form');
    if (!mainForm) {
        console.error("Критическая ошибка: Форма wash-sd-form не найдена в HTML!");
        return;
    }

    // Привязываем авторасчет Батча к реальным элементам чеклиста смывов
    const citySelect = document.getElementById('cyti') || mainForm.querySelector('[name*="fabrika" i]');
    const daySelect = mainForm.querySelector('[name*="smena" i]') || document.getElementById('day');
    const dateInput = mainForm.querySelector('input[type="date"]');

    if (citySelect) citySelect.addEventListener('change', updateLotValue);
    if (daySelect) daySelect.addEventListener('change', updateLotValue);
    if (dateInput) dateInput.addEventListener('change', updateLotValue);

    updateLotValue(); // Запуск первичного расчета кода

    // Автоматическая подстановка ФИО сотрудника в оба поля разметки смывов
    const savedFirstName = localStorage.getItem('userFirstName') || '';
    const savedLastName = localStorage.getItem('userLastName') || '';
    const fullUserName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : '';

    // Ищем верхнее поле Техника и нижнее поле Лаборанта
    const techFieldUpper = mainForm.querySelector('[name*="tech" i]') || mainForm.querySelector('[id*="tech" i]');
    const nameFieldLower = mainForm.querySelector('[name*="lab" i]') || mainForm.querySelector('[name="name" i]');
    
    if (techFieldUpper && !techFieldUpper.value) techFieldUpper.value = fullUserName;
    if (nameFieldLower && !nameFieldLower.value) nameFieldLower.value = fullUserName;

    // Кнопки управления чеклистом микробиологии
    const btnCancel = document.getElementById('btnCancel');
    const btnSaveArchive = document.getElementById('btnSaveArchive') || document.getElementById('saveArchiveBtn');
    const btnCollapse = document.getElementById('btnCollapse') || document.getElementById('collapseBtn');

    if (btnCancel) {
        btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти? Все несохраненные изменения в чеклисте смывов будут потеряны.')) {
                window.location.href = '/menu/index.html';
            }
        });
    }

    if (btnCollapse) {
        btnCollapse.addEventListener('click', (e) => {
            e.preventDefault();
            handleCollapse(); // Запуск логики черновика
        });
    }

    if (btnSaveArchive) {
        btnSaveArchive.removeAttribute('onclick'); // Зачистка инлайн-атрибутов
        btnSaveArchive.addEventListener('click', (e) => {
            e.preventDefault();
            handleSaveArchive(); // Запуск логики публикации в архив
        });
    }

    // Чтение параметров URL для разворачивания документа из памяти
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId'); 
    let currentMode = urlParams.get('mode'); 

    if (currentDraftId) {
        try {
            const allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
            let foundData = allDrafts[currentDraftId]?.fields;

            if (!foundData) {
                const archivedDocRaw = localStorage.getItem(`${ARCHIVE_PREFIX}${currentDraftId}`);
                if (archivedDocRaw) {
                    const parsedObj = JSON.parse(archivedDocRaw);
                    foundData = parsedObj.data ? parsedObj.data : parsedObj;
                }
            }

            // Пошагово заполняем чеклист сохраненными значениями
            if (foundData) {
                const targetData = foundData.meta ? foundData.meta : foundData;
                
                mainForm.querySelectorAll('input, select, textarea').forEach((field, index) => {
                    const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
                    const savedValue = targetData[name];
                    
                    if (savedValue !== undefined) {
                        if (field.type === 'checkbox') {
                            field.checked = savedValue;
                        } else {
                            field.value = savedValue;
                        }
                    }

                    // 🔥 АВТОМАТИЧЕСКАЯ ЗАЩИТА РЕЖИМА "ПРОСМОТР" (MODE = VIEW)
                    if (currentMode === 'view') {
                        field.readOnly = true;
                        field.disabled = true;
                        field.style.backgroundColor = '#f1f5f9'; 
                        field.style.color = '#475569';
                        field.style.cursor = 'not-allowed';
                    }
                });
                updateLotValue();
            }
        } catch (error) {
            console.error('Ошибка восстановления чеклиста смывов из JSON:', error);
        }
    }

    // Полное скрытие кнопок управления при режиме просмотра view
    if (currentMode === 'view') {
        const elementsToHide = ['#btnCollapse', '#collapseBtn', '#btnSaveArchive', '#saveArchiveBtn'];
        elementsToHide.forEach(selector => {
            const el = document.getElementById(selector) || document.querySelector(selector);
            if (el) el.style.setProperty('display', 'none', 'important');
        });
    }

    // Запуск фонового резервного копирования
    setTimeout(updateShadowArchiveCopy, 600);
    mainForm.addEventListener('input', updateShadowArchiveCopy);
    mainForm.addEventListener('change', updateShadowArchiveCopy);
});

// ====================================================
// 3. СБОР И СВЕРТЫВАНИЕ В ЧЕРНОВИК (ПОД СТРУКТУРУ QA_CORE)
// ====================================================
function collectFormData() {
    if (!mainForm) return {};
    const data = {};
    mainForm.querySelectorAll('input, select, textarea').forEach((field, index) => {
        const name = field.getAttribute('name') || field.getAttribute('id') || `field_auto_${index}`;
        data[name] = field.type === 'checkbox' ? field.checked : field.value;
    });
    return data;
}

function handleCollapse() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentDraftId = urlParams.get('draftId') || 'draft_' + Date.now();
    
    const formData = collectFormData();
    const now = Date.now();

    // Съем живого значения Батча с экрана для карточки черновика в главном меню
    const targetInput = document.getElementById('batch-code-field') || mainForm.querySelector('input[name*="batch" i]');
    const batchVal = targetInput && targetInput.value.trim() ? targetInput.value.trim() : '';

    const titleEl = document.querySelector('.main-title');
    let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации смывов';
    if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

    const displayTitle = `💼 ${cleanTitle} ${batchVal ? '['+batchVal+']' : ''}`;

    let allDrafts = JSON.parse(localStorage.getItem(DRAFT_DATA_KEY)) || {};
    allDrafts[currentDraftId] = { timestamp: now, fields: formData };
    localStorage.setItem(DRAFT_DATA_KEY, JSON.stringify(allDrafts));

    let registry = JSON.parse(localStorage.getItem(ACTIVE_ACTS_KEY)) || [];
    const existsIndex = registry.findIndex(a => a.id === currentDraftId);
    
    const meta = { id: currentDraftId, url: window.location.pathname, title: displayTitle, updated: now };

    if (existsIndex !== -1) registry[existsIndex] = meta;
    else registry.push(meta);
    localStorage.setItem(ACTIVE_ACTS_KEY, JSON.stringify(registry));

    if (mainForm) mainForm.reset();
    alert('Акт успешно свернут в черновик. Оригинал обнулен!');
    window.location.href = '/menu/index.html'; 
}

// ====================================================
// 4. СИСТЕМА ПРОМЫШЛЕННОЙ АРХИВАЦИИ И ТЕНЕВОГО КОПИРОВАНИЯ
// ====================================================
function generateArchiveStandardId() {
    const operatorId = localStorage.getItem('userId') || '000';
    const cleanOperator = operatorId.trim().replace(/\s+/g, ''); 
    return `${BLANK_VERSION}-${cleanOperator}`;
}

function updateShadowArchiveCopy() {
    if (!mainForm) return;
    const urlParams = new URLSearchParams(window.location.search);
    const currentDraftId = urlParams.get('draftId') || 'temp';
    const formData = collectFormData();

    localStorage.setItem(`${SHADOW_PREFIX}${currentDraftId}`, JSON.stringify({
        meta: formData, shadowSavedAt: new Date().toISOString(), status: 'shadow'
    }));
}

function handleSaveArchive() {
    if (typeof validateForm === 'function' && !validateForm()) return;
    updateShadowArchiveCopy();

    const urlParams = new URLSearchParams(window.location.search);
    const currentDraftId = urlParams.get('draftId') || 'temp';
    
    const shadowDataRaw = localStorage.getItem(`${SHADOW_PREFIX}${currentDraftId}`);
    if (!shadowDataRaw) { alert('Ошибка: Данные документа пусты.'); return; }

    const shadowObj = JSON.parse(shadowDataRaw);
    const now = new Date();

    let archiveFinalId = (currentDraftId && currentDraftId.includes('-')) ? currentDraftId : generateArchiveStandardId();

    // 1. ПУБЛИКАЦИЯ / ОБНОВЛЕНИЕ ТЕЛА ФАЙЛА ДАННЫХ
    shadowObj.status = 'published';
    shadowObj.savedAt = now.toISOString();
    localStorage.setItem(`${FINAL_ARCHIVE_PREFIX}${archiveFinalId}`, JSON.stringify(shadowObj));

    // 2. ИНТЕГРАЦИЯ В ОБЩУЮ ТАБЛИЦУ ЖУРНАЛА АРХИВА (archive.html)
    let archiveActs = JSON.parse(localStorage.getItem('archiveActs')) || [];
    
    const titleEl = document.querySelector('.main-title');
    let cleanTitle = titleEl ? titleEl.textContent.trim() : 'Акт верификации смывов';
    if (cleanTitle.includes(':')) cleanTitle = cleanTitle.split(':')[0].trim();

    const savedLastName = localStorage.getItem('userLastName') || '';
    const savedFirstName = localStorage.getItem('userFirstName') || '';
    const controllerName = savedLastName && savedFirstName ? `${savedLastName} ${savedFirstName.charAt(0)}.` : "Не указан";
    
    // ЖЕСТКИЙ СЪЕМ БАТЧ-КОДА С ЭКРАНА СИЛОЙ (ОБХОД ОЧИСТКИ FORM-DATA)
    const targetInput = document.getElementById('batch-code-field') || mainForm.querySelector('input[name*="batch" i]');
    let finalBatchVal = 'БЕЗ БАТЧА';
    if (targetInput && targetInput.value.trim() !== '') {
        finalBatchVal = targetInput.value.trim();
    }
    
    const thisBlankPath = '../архив/хранилище/index.html';

    const archiveRegistryEntry = {
        id: archiveFinalId, 
        date: now.toISOString().split('T')[0], // Чистый текстовый формат ГГГГ-ММ-ДД
        number: `АКТ-${now.getTime().toString().slice(-6)}`, 
        controller: controllerName,
        actType: cleanTitle,
        batch: finalBatchVal, // В таблице архива будет точный лот (например, 622E)
        blankPath: thisBlankPath
    };

    const existingIndex = archiveActs.findIndex(act => act.id === archiveFinalId);
    if (existingIndex !== -1) archiveActs[existingIndex] = archiveRegistryEntry; 
    else archiveActs.unshift(archiveRegistryEntry); 
    
    localStorage.setItem('archiveActs', JSON.stringify(archiveActs));

    // 3. ПОЛНАЯ ОЧИСТКА ПАМЯТИ ЧЕРНОВИКОВ СМЕНЫ
    localStorage.removeItem(`${SHADOW_PREFIX}${currentDraftId}`);

    let registry = JSON.parse(localStorage.getItem('global_active_acts_list')) || [];
    registry = registry.filter(a => a.id !== currentDraftId);
    localStorage.setItem('global_active_acts_list', JSON.stringify(registry));

    let allDrafts = JSON.parse(localStorage.getItem('qa_all_drafts_data')) || {};
    delete allDrafts[currentDraftId];
    localStorage.setItem('qa_all_drafts_data', JSON.stringify(allDrafts));

    alert(`Документ смывов успешно сохранен в архив!\nПаспорт ID: ${archiveFinalId}`);
    window.location.href = '/menu/index.html'; 
}

// ====================================================
// 5. АВТОМАТИЧЕСКИЙ РАСЧЕТ BATCH CODE (LOT) ДЛЯ СМЫВОВ
// ====================================================
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


// ====================================================
// 6. НАВИГАЦИЯ ПО ТАБЛИЦЕ КЛАВИШАМИ (ENTER / СТРЕЛКИ)
// ====================================================
function handleTableNavigation(e) {
    const validKeys = ['Enter', 'ArrowUp', 'ArrowDown'];
    if (!validKeys.includes(e.key)) return;

    const currentInput = e.target;
    if (currentInput.tagName !== 'INPUT' && currentInput.tagName !== 'SELECT') return;

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
            targetInput = allRows[rowIndex + 1].children[colIndex].querySelector('input, select');
        }
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIndex > 0) {
            targetInput = allRows[rowIndex - 1].children[colIndex].querySelector('input, select');
        }
    }

    if (targetInput) {
        targetInput.focus();
        if (typeof targetInput.select === 'function') {
            targetInput.select();
        }
    }
}

// ====================================================
// 7. АВТОМАТИЧЕСКАЯ ФИКСАЦИЯ ВРЕМЕНИ ПРИ КЛИКЕ НА ЧЕКБОКС
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('wash-table-body');

    if (tableBody) {
        tableBody.addEventListener('change', (e) => {
            // Проверяем, что кликнули именно по чекбоксу
            if (e.target && e.target.type === 'checkbox') {
                const checkbox = e.target;
                const currentRow = checkbox.closest('tr');
                
                if (!currentRow) return;

                // Ищем инпут времени именно внутри текущей строки (tr)
                const timeInput = currentRow.querySelector('input[type="time"]');

                if (timeInput) {
                    if (checkbox.checked) {
                        // Получаем текущее время
                        const now = new Date();
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        
                        // Форматируем в ЧЧ:ММ и записываем в инпут
                        timeInput.value = `${hours}:${minutes}`;
                    } else {
                        // Если галочку сняли — можно очистить поле (опционально)
                        timeInput.value = '';
                    }

                    // Триггерим событие change, чтобы сработал ваш автосохраняющий скрипт (updateShadowArchiveCopy)
                    timeInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    }
});

// =========================================================================
// 22. ПОДСВЕТКА СТРОК ПРИ НАВЕДЕНИИ И АКТИВНОЙ ЯЧЕЙКЕ
// =========================================================================
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('dynamic-hover-rules')) {
            const style = document.createElement('style');
            style.id = 'dynamic-hover-rules';
            style.textContent = `
                /* Эффект при наведении курсора на строку */
                #table-body tr:hover {
                    background-color: #f1f5f9 !important; /* Легкий серо-голубой оттенок */
                }
                #table-body tr:hover input:not([readonly]) {
                    background-color: #f1f5f9 !important; /* Синхронизируем фон полей ввода */
                }

                /* Эффект, когда строка становится активной (внутри есть фокус) */
                #table-body tr:focus-within {
                    background-color: #e2e8f0 !important; /* Более насыщенный цвет для активной строки */
                    border-left: 3px solid #2563eb !important; /* Синий маркер слева */
                }
                #table-body tr:focus-within input {
                    background-color: transparent !important; /* Убираем внутренний фон инпутов для плавной заливки */
                }
                #table-body tr:focus-within input:focus {
                    background-color: #ffffff !important; /* Белый фон только для ячейки в фокусе */
                    box-shadow: inset 0 0 0 2px #2563eb !important; /* Синяя рамка вокруг активного инпута */
                }
            `;
            document.head.appendChild(style);
            console.log('[Подсветка]: Стили для hover и focus-within успешно привязаны.');
        }
    });
})();
