// js/core/acts-db.js — Глобальный сервис для работы с базой данных (.db)
window.QA_DB = {
    instance: null, // Переменная для хранения открытой БД в памяти

    // 🔥 Проверьте, чтобы здесь ОБЯЗАТЕЛЬНО стояло слово async!
    async init(dbFilePath = '/auth/menu/DataBaza/baza/databaza.db') {
        // Если база уже загружена в память этой вкладки, не качаем её заново
        if (this.instance) return this.instance; 

        try {
            // Конфигурируем путь к WASM-движку SQLite в интернетах
            const config = {
                locateFile: filename => `https://cloudflare.com{filename}`
            };
            
            // Если вы работаете в ОФЛАЙНЕ (без интернета), замените строку выше на локальную:
            // locateFile: filename => `/js/core/${filename}`

            const SQL = await initSqlJs(config);

            // Скачиваем физический файл .db как бинарный ArrayBuffer поток
            const response = await fetch(dbFilePath);
            if (!response.ok) throw new Error(`Не удалось загрузить файл базы: ${response.statusText}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const uInt8Array = new Uint8Array(arrayBuffer);

            // Разворачиваем базу данных SQLite в оперативной памяти браузера лаборанта
            this.instance = new SQL.Database(uInt8Array);
            console.log('✅ [QA_DB]: База данных .db успешно загружена в WebAssembly.');
            return this.instance;
        } catch (error) {
            console.error('❌ [QA_DB] Критическая ошибка инициализации SQLite:', error);
            return null;
        }
    },

    // Глобальный метод для безопасного выполнения SELECT запросов
    select(sqlQuery, params = []) {
        if (!this.instance) {
            console.warn('⚠️ [QA_DB]: База данных еще не готова.');
            return [];
        }
        try {
            const stmt = this.instance.prepare(sqlQuery);
            stmt.bind(params);
            
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject()); // Автоматически мапит имена колонок в ключи JS
            }
            stmt.free();
            return results;
        } catch (error) {
            console.error(`❌ [QA_DB] Ошибка SQL-запроса: ${sqlQuery}`, error);
            return [];
        }
    }
};
