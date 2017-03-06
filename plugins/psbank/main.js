// Главная функция в которой и будет происходить вся магия =)
function main() {
    
    // Выводим в трейс информацию о запуске плагина
    ZenMoney.trace("Запуск синхронизации с интернет-банком Промсвязьбанк", "INFO");
    // Получаем настройки плагина
    var options = ZenMoney.getPreferences();
    // Проверяем, что настройки успешно получены
    if (!options) {
        // Если настройки не получены
        
        // Вываливаемся с ошибкой
        throw new ZenMoney.Error("Не удалось получить настройки плагина", null, true);
    } else {
        // Если настройки получены
        
        // Проверяем заполнение поля "Логин"
        if(!options.login) {
            throw new ZenMoney.Error("Вы не заполнили обязательное поле \"Логин\"!", null, true);
        };
        
        // Проверяем заполнение поля "Пароль"
        if(!options.password) {
            throw new ZenMoney.Error("Вы не заполнили обязательное поле \"Пароль\"!", null, true);
        };
        
        // Прописываем в настройки адрес для запросов к api
        options.url = "https://ib.psbank.ru/";
        // Добавляем переменную для заголовков
        options.headers = {};
        
        // Только активные счета
        options.onlyActive = "true";
    };
    
    // Получаем значение переменной timesync, в ней хранится время последней синхронизации в формате TIMESTAMP
    var timesync = ZenMoney.getData("timesync", 0);
    // Получаем текущее вермя
    var timenow = new Date();
    // Проверяем значение переменной timesync
    if (timesync === 0) {
        // Если значение переменной не установлено
        // Получаем время в формате TIMESTAMP с которой будет начата синхронизация
        // Для этого получаем текущее время в формате TIMESTAMP
        // Затем мы делим полученное значение на 86400, чтобы определить количество полных дней
        // Теперь умножаем количество полных дней за вычетом периода на 86400 и на 1000, получаем время в милисекундах с которого начнется синхронизация
        //timesync = Date.getTime() - (options.period * 86400);
        //timesync = (Math.floor(Date.now() / 86400000) - options.period) * 86400 * 1000;
        timesync = timenow.getTime() - (options.period * 86400000) - (timenow.getHours() * 3600000) - (timenow.getMinutes() * 60000) - (timenow.getSeconds() * 1000);
    };
    // Переводим полученное значение в Date
    timesync = new Date(timesync);
    // Выводим в трейс информацию о начальном времени синхронизации
    ZenMoney.trace("Синхронизация со следующей даты: " + timesync.toLocaleString(), "INFO");
    // Записываем время синхронизации на будущее
    ZenMoney.setData("timesync", timenow.getTime());
    ZenMoney.saveData();
    //return;
    
    //
    //  Экшен!
    //
    
    // Авторизация
    login();
    
    // Синхронизация карточных счетов
    var ccards = syncCcards();
    // Синхронизация счетов
    var checkings = syncCheckings();
    // Синхронизация кредитов
    var loans = syncLoans();
    // Синхронизация вкладов
    var deposits = syncDeposits();
    
    // Теперь, по каждому счету получаем информацию по транзакциям
    // Начинаем с карт
    if (ccards.length > 0) {
        // Разбираем карты
        for (var i1 = 0; i1 < ccards.length; ++i1) {
            // Получаем id карточного счета и заносим в переменную
            var id = ccards[i1].substr(2);
            // Выведем в трейс инфу
            ZenMoney.trace("Получение транзакций по карточному счету: " + id, "INFO");
            // Запускаем процесс синхронизации транзакций
            syncTransactions(id,"ccard");
        };
    } else {
        // Выведем в трейс инфу, о том что нету карточных счетов
        ZenMoney.trace("Невозможно провести синхронизацию по карточным счетам, т.к. нет ниодного карточного счета.", "INFO");
    };
    
    // Следующие идут счета
    if (checkings.length > 0) {
        // Разбираем счета
        for (var i1 = 0; i1 < checkings.length; ++i1) {
            // Получаем id счета и заносим в переменную
            var id = checkings[i1].substr(2);
            // Выведем в трейс инфу
            ZenMoney.trace("Получение транзакций по счету: " + id, "INFO");
            // Запускаем процесс синхронизации транзакций
            syncTransactions(id,"checking");
        };
    } else {
        // Выведем в трейс инфу, о том что нету счетов
        ZenMoney.trace("Невозможно провести синхронизацию по счетам, т.к. нет ниодного счета.", "INFO");
    };
    
    // Теперь по кредитам
    if (loans.length > 0) {
        // Разбираем кредиты
        for (var i1 = 0; i1 < loans.length; ++i1) {
            // Получаем id счета и заносим в переменную
            var id = loans[i1].substr(2);
            // Выведем в трейс инфу
            ZenMoney.trace("Получение транзакций по кредиту: " + id, "INFO");
            // Запускаем процесс синхронизации транзакций
            syncTransactions(id,"loan");
        };
    } else {
        // Выведем в трейс инфу, о том что нету кредитов
        ZenMoney.trace("Невозможно провести синхронизацию по кредитам, т.к. нет ниодного кредита. Вы молодец =)", "INFO");
    };
    
    // И закончим вкладами
    if (deposits.length > 0) {
        // Разбираем вклады
        for (var i1 = 0; i1 < deposits.length; ++i1) {
            // Получаем id счета и заносим в переменную
            var id = deposits[i1].substr(2);
            // Выведем в трейс инфу
            ZenMoney.trace("Получение транзакций по вкладу: " + id, "INFO");
            // Запускаем процесс синхронизации транзакций
            syncTransactions(id, "deposit");
        };
    } else {
        // Выведем в трейс инфу, о том что нету вкладов
        ZenMoney.trace("Невозможно провести синхронизацию по вкладам, т.к. нет ниодного вклада.", "INFO");
    };
    
    //
    // Если выполнение дошло до сюда
    // Значит, синхронизация прошла успешно и работа плагина завершается.
    //
    
    ZenMoney.setResult({success: true});

    // Ниже, основные функции
    
    // Функция для запросов к api
    function query(type, url, data, headers, out) {
        // Проверяем тип запроса
        if (type === "GET" || type === "POST") {
            // Тип запроса GET или POST
            
            // Выполняем запрос по url и передаем полученные данные в переменную result
            var result = ZenMoney.request(type, url, data, headers);

            // Проверяем наличие полученных данных 
            if (!result) {
                // Если данных нет
                
                // Завершаем выполнение функции
                return false;
            };
            
            // Если данные нужно вернуть в формате OBJECT
            if (out === "OBJECT") {
                // Пытаемся перевести данные из JSON
                try {
                    // Переводим данные из JSON
                    result = JSON.parse(result);
                } catch (e) {
                    // Если словили ошибку, завершаем выполнение функции и возвращаем false
                    return false;
                }
            };

            // Возвращаем результат
            return result;

        } else {
            // Если тип запроса указан не GET или POST
            // Завершаем выполнение функции
            return false;
        };
    };
    
    // Функция для прохождения авторизации и получения токена
    function login() {
        // Шаг 1: Получение Токена для заголовка X-XSRF-Token
        // 
        // Присваиваем переменной result результат запроса к главной странице
        var result = query("POST", options.url + "/", null, null, "PLAIN");
        // Если запрос не выполнился
        if (!result) {
            // Вываливаемся с ошибкой
            throw new ZenMoney.Error("Ошибка авторизации: Не получены данные.", null, true);
        };
        // Проверяем, что в полученных данных присутствует текст: <input name="__RequestVerificationToken"
        if (result.indexOf("<input name=\"__RequestVerificationToken\"") === -1) {
            // Значение в тексте не найдено, вываливаемся с ошибкой
            throw new ZenMoney.Error("Ошибка авторизации: Не найдено поле с токеном.", null, true);
        };
        // Обрезаем текст с подстоки "<input name="__RequestVerificationToken"" до конца
        var XSRFToken = result.substr(result.indexOf("<input name=\"__RequestVerificationToken\""));
        // Обрезаем текст с начала до подстроки "" />", таким образом получаем все поле input с параметрами
        XSRFToken = XSRFToken.substr(0,XSRFToken.indexOf("\" />"));
        // Обрезаем текст с последнего символа " до конца, и получаем значение поля
        XSRFToken = XSRFToken.substr(XSRFToken.lastIndexOf("\"") + 1);
        
        
        // Шаг 2: Отправляем авторизационные данные
        // 
        // Формируем массив значений
        var data = {
            grant_type: "password",
            username: options.login,
            password: options.password
        };
        // Проверяем метод авторизации в интернет-банке
        if (options.loginType === 1) {
            // Метод авторизации по номеру телефона
            // Добавляем параметр в массив значений
            data.loginType = "Phone";
        } else {
            // Для остальных методов, авторизация по логину
            // Добавляем параметр в массив значений
            data.loginType ="Login";
        };
        
        // Присваиваем переменной result результат запроса к api авторизации
        var result = query("POST", options.url + "/api/authentication/token", data, null, "OBJECT");
        // Если запрос не выполнился
        if (!result) {
            // Вываливаемся с ошибкой 
            throw new ZenMoney.Error("Ошибка авторизации: Не получены данные при получении токена.", null, true);
        };
        // Проверяем значение переменной error в полученных данных
        if (result.error) {
            // Если значение переменной error не пустое
            // Вываливаемся с ошибкой и описанием
            throw new ZenMoney.Error("Ошибка авторизации: " + result.error_description, null, true);
        };
        // Формируем заголовки
        options.headers = {
            "Authorization": result.token_type + " " + result.access_token,
            "X-XSRF-Token": XSRFToken
        };
        // Проверяем включение двухэтапной авторизации
        if(result.isSecondStepAuthRequired === "true") {
            // выводим в трейс информацию по поводу включенной двухэтапной авторизации
            ZenMoney.trace("Включена двухэтапная авторизация", "INFO");
            // Получаем информацию по возможным подтверждением авторизации (SMS, PUSH)
            var auth = query("GET", options.url + "/api/authentication/secondStepAuthRequest", null, options.headers, "OBJECT");
            // Если запрос не выполнился
            if (!auth) {
                // Вываливаемся с ошибкой 
                throw new ZenMoney.Error("Ошибка авторизации: Не получены данные для двухэтапной авторизации.", null, true);
            };
            // Формируем сообщение для показа пользователю
            var message = "Введите";
            // Отправляем запрос, для получения SMS с кодом если есть такая возможность
            if (auth.smsStatus === 4) {
                var sms = query("GET", options.url + "/api/authentication/secondStepAuthSms", null, options.headers, "OBJECT");
                // Если запрос не выполнился
                if (!sms) {
                    // Вываливаемся с ошибкой 
                    throw new ZenMoney.Error("Ошибка авторизации: Не получены данные для двухэтапной авторизации по SMS.", null, true);
                };
                message = message + " SMS" + sms.smsNumber;
            };
            if (auth.pushStatus === 4) {
                message = message + " PUSH" + auth.pushData.pushNumber;
            };
            
            message = message + " код для авторизации";
            // Запрашиваем у пользователя ввод кода автоирзации изи SMS или PUSH
            // Если код из SMS, перед кодом указываем букву S (регистр не важен)
            // Если код из PUSH, перед кодом указываем букву P (регистр не важен)
            var code = ZenMoney.retrieveCode(message + "\nПеред кодом, укажите букву \"S\" для SMS кода или букву \"P\" для PUSH кода.", null, {inputType: "text", time: 300000 });
            // Если пользоватеь ничего не ввел
            if (code.length === 0) {
                // Вываливаемся с ошибкой 
                throw new ZenMoney.Error("Ошибка авторизации: Вы не ввели код авторизации.", null, true);
            };
            // В зависимости от буквы в коде подготавливаем данные

            switch(code.substr(0,1)) {
                case "P":
                    // Код из PUSH
                    var data = {
                        "authorizerType": 11,
                        "value": code.substr(1)
                    };
                    break;
                case "S":
                    // Код из SMS
                    var data = {
                        "authorizerType": 2,
                        "value": code.substr(1)
                    };
                    break;
                default:
                    // Не определена буква в коде
                    // Вываливаемся с ошибкой 
                    throw new ZenMoney.Error("Ошибка авторизации: Не удалось определить первую букву в коде.", null, true);
                    break;
            };
            // Отправляем запрос с кодом в интернет-банк
            code = query("POST", options.url + "/api/authentication/doSecondStepAuth", data, options.headers, "OBJECT");
            // Проверяем наличие данных
            if (code) {
                // Если данные имеются, значит ошибка при отправке кода авторизации
                // Вываливаемся с ошибкой
                throw new ZenMoney.Error("Ошибка авторизации: " + code.exceptionMessage, null, true);
            };
        };
        
        // Шаг 3: Проверяем статус авторизации
        // 
        // Присваиваем переменной result результат запроса к api проверке авторизации
        var result = query("GET", options.url + "/api/authentication/loginResult", null, options.headers, "OBJECT");
        // Если запрос не выполнился
        if (!result) {
            // Вываливаемся с ошибкой 
            throw new ZenMoney.Error("Ошибка авторизации: Не получены данные при проверке авторизации.", null, true);
        };
        
        // Возвращаемся
        return;
    };
    
    // Функция для синхронизации карточных счетов
    function syncCcards() {
        // Создаем переменную, в которую будем заносить карточные счета
        var cards = [];
        // Передаем результат обращения к api в переменную result
        var result = query("GET", options.url + "/api/cards/data?activeOnly=" + options.onlyActive, null, options.headers, "OBJECT");
        // Если запрос не выполнился
        if (!result) {
            // Вываливаемся с ошибкой 
            throw new ZenMoney.Error("Ошибка синхронизации: Не получены данные по карточным счетам.", null, true);
        };
        // Выводим в трейс информацию по количеству карточных счетов
        ZenMoney.trace("Количество карточных счетов: " + result.cardAccounts.length, "INFO");
        // Проверяем количество полученных карточных счетов
        if (result.cardAccounts.length === 0) {
            // Если их количество равно 0, завершаем работу функции без ошибки
            return cards;
        };
        // Перебираем массив с информацией о карточных счетах
        for (var i1 = 0; i1 < result.cardAccounts.length; ++i1) {
            // Передаем переменной account значение из массива по индексу
            var account = result.cardAccounts[i1];
            // Проверяем на игнорируемость
            if (isAccountSkipped("id" + account.cardAccountId)) {
                ZenMoney.trace("Пропускаем: id" + account.cardAccountId, "INFO");
            }
            // Создаем массив с данными
            // В номера карт, добавляем еще номер счета
            var account_info = {
                "id": "id" + account.cardAccountId,
                "title": account.name,
                "syncID": [ account.name.substring(account.name.length - 4) ],
                "instrument": account.currency.nameIso,
                "type": "ccard",
                "balance": account.availableBalance,
                "creditLimit": account.mainCreditLimit,
                "savings": "false",
                "bank": 5132,
                "archive": false
            };
            // Если пользователь переименовал карточный счет в банке, используем название которое он указал
            if (account.clientLabel) {
                // Заменяем значение в массиве
                account_info.title = account.clientLabel;
            };
            // Проверяем, является ли счет закрытым
            if (account.closeDate) {
                // Указываем его архивным
                account_info.archive = true;
            };
            // Проверяем количество карт привязанных к карточному счету
            if (account.cards.length !== 0) {
                // Если их количество не равно 0
                // Перебираем массив с информацией о картах
                for (var i2 = 0; i2 < account.cards.length; ++i2) {
                    // Передаем переменной card значение из массива по индексу
                    var card = account.cards[i2];
                    // Обрезаем номер карты до последних 4 цифр и добавляем в массив со значениями
                    account_info.syncID.push(card.cardNumber.substring(card.cardNumber.length - 4))
                    //ZenMoney.trace("Карта " + card.cardNumber.length - 4 + " добавлена");
                };
                
            };
             // Выводим в трейс id обрабатываемого карточного счета
            ZenMoney.trace("Обработка карточного счета: " + account_info.title + " (#" + account_info.id + ")", "INFO");
            // Добавляем аккаунт
            ZenMoney.addAccount(account_info);
            cards.push(account_info.id);
        };
        // Возвращаем результат
        return cards;
    };
    
    // Функция для синхронизации счетов
    function syncCheckings() {
        // Создаем переменную, в которую будем заносить счета
        var checkings = [];
        // Передаем результат обращения к api в переменную result, результатом должны быть данные в JSON
        var result = query("GET", options.url + "/api/accounts/?activeOnly=" + options.onlyActive, null, options.headers, "OBJECT");
        // Если запрос не выполнился
        if (!result) {
            // Вываливаемся с ошибкой
            throw new ZenMoney.Error("Ошибка синхронизации счетов: Не получены данные.", null, true);
        };
        // Выводим в трейс информацию по количеству счетов
        ZenMoney.trace("Количество счетов: " + result.length, "INFO");
        // Проверяем количество полученных счетов
        if (result.length === 0) {
            // Если их количество равно 0, завершаем работу функции без ошибки
            return checkings;
        };
        // Перебираем массив с информацией о счетах
        for (var i1 = 0; i1 < result.length; ++i1) {
            // Передаем переменной account значение из массива по индексу
            var account = result[i1];
                        // Проверяем на игнорируемость
            if (isAccountSkipped("id" + account.AccountId)) {
                ZenMoney.trace("Пропускаем: id" + account.AccountId, "INFO");
            }
            // Создаем массив с данными
            // В номера карт, добавляем еще номер счета
            var account_info = {
                "id": "id" + account.accountId,
                "title": account.name,
                "syncID": [ account.number.substring(account.number.length - 4) ],
                "instrument": account.currency.nameIso,
                "type": "checking",
                "balance": account.availableBalance,
                "savings": account.isSaving,
                "bank": 5132,
                "archive": false
            };
            // Если пользователь переименовал счет в банке, используем название которое он указал
            if (account.clientLabel) {
                // Заменяем значение в массиве
                account_info.title = account.clientLabel;
            };
            // Проверяем, является ли  счет закрытым
            if (account.closeDate) {
                // Указываем его архивным
                account_info.archive = true;
            };
            // Выводим в трейс название и id обрабатываемого счета
            ZenMoney.trace("Обработка счета: " + account_info.title + " (#" + account_info.id + ")", "INFO");
            // Добавляем аккаунт
            ZenMoney.addAccount(account_info);
            checkings.push(account_info.id);
        };
        // Возвращаем результат
        return checkings;
    };
    
    // Функция для синхронизации кредитов
    function syncLoans() {
        // Создаем переменную, в которую будем заносить кредиты
        var loans = [];
        // Передаем результат обращения к api в переменную result
        var result = query("GET", options.url + "/api/loans/?activeOnly=" + options.onlyActive, null, options.headers, "OBJECT");
        // Если запрос не выполнился
        if (!result) {
            // Вываливаемся с ошибкой 
            throw new ZenMoney.Error("Ошибка синхронизации: Не получены данные по кредитам.", null, true);
        };
        // Выводим в трейс информацию по количеству кредитов
        ZenMoney.trace("Количество кредитов: " + result.loans.length, "INFO");
        // Проверяем количество полученных кредитов
        if (result.loans.length === 0) {
            // Если их количество равно 0, завершаем работу функции без ошибки
            return loans;
        };
        // Перебираем массив с информацией о кредитах
        for (var i1 = 0; i1 < result.loans.length; ++i1) {
            // Из-за недостаточных данных, получаемых в общем запросе
            // Запрашиваем информацию по каждому кредиту отдельно
            // Передаем переменной account значение из массива по индексу
            var account = query("GET", options.url + "/api/loans/" + result.loans[i1].contractId, null, options.headers, "OBJECT");
            // Если запрос не выполнился
            if (!result) {
                // Пропускаем обработку этого кредита
                continue;
            };
            // Создаем массив с данными
            var account_info = {
                "id": "id" + account.contractId,
                "title": account.name,
                "syncID": [ account.number.substring(account.number.length - 4) ],
                "instrument": account.currency.nameIso,
                "type": "loan",
                "sum": account.issueSum,
                "capitalization": false,
                "percent": account.interestRate * 100,
                "startDate": account.beginDate.substr(0,10),
                "endDateOffset": account.lengthMonths,
                "endDateOffsetInterval": "month",
                "payoffStep": 1,
                "payoffInterval": "month",
                "bank": 5132,
                "archive": false
            };
            // Если пользователь переименовал кредит в банке, используем название которое он указал
            if (account.clientLabel) {
                // Заменяем значение в массиве
                account_info.title = account.clientLabel;
            };
            // Проверяем, является ли кредит закрытым
            if (account.closeDate) {
                // Указываем его архивным
                account_info.archive = true;
            };
            // Выводим в трейс название и id обрабатываемого кредита
            ZenMoney.trace("Обработка кредита: " + account_info.title + " (#" + account_info.id + ")", "INFO");
            // Добавляем аккаунт
            ZenMoney.addAccount(account_info);
            loans.push(account_info.id);
        };
        // Возвращаем результат
        return loans;
    };
    
    // Функция для синхронизации вкладов
    function syncDeposits() {
        // Создаем переменную, в которую будем заносить вклады
        var deposits = [];
        // Передаем результат обращения к api в переменную result
        var result = query("GET", options.url + "/api/deposits/?activeOnly=" + options.onlyActive, null, options.headers, "OBJECT");
        // Если запрос не выполнился
        if (!result) {
            // Вываливаемся с ошибкой 
            throw new ZenMoney.Error("Ошибка синхронизации: Не получены данные по вкладам.", null, true);
        };
        // Выводим в трейс информацию по количеству вкладов
        ZenMoney.trace("Количество вкладов: " + result.length, "INFO");
        // Проверяем количество полученных вкладов
        if (result.length === 0) {
            // Если их количество равно 0, завершаем работу функции без ошибки
            return deposits;
        };
        // Перебираем массив с информацией о кредитах
        for (var i1 = 0; i1 < result.length; ++i1) {
            // Из-за недостаточных данных, получаемых в общем запросе
            // Запрашиваем информацию по каждому вкладу отдельно
            // Передаем переменной account значение из массива по индексу
            var account = query("GET", options.url + "/api/deposits/" + result[i1].contractId, null, options.headers, "OBJECT");
            // Если запрос не выполнился
            if (!result) {
                // Пропускаем обработку этого вклада
                continue;
            };
            // Создаем массив с данными
            var account_info = {
                "id": "id" + account.contractId,
                "title": account.name,
                "syncID": [ account.number.substring(account.number.length - 4) ],
                "instrument": account.incarnations[0].contractDetails[0].currency.nameIso,
                "type": "deposit",
                "sum": account.incarnations[0].contractDetails[0].initialInstalmentSum,
                "capitalization": false,
                "startDate": account.beginDate.substr(0,10),
                "endDateOffset": account.lengthDays,
                "endDateOffsetInterval": "day",
                "bank": 5132,
                "archive": false,
                "percent": 0,
                "payoffStep": account.capitalPeriodMonths,
                "payoffInterval": "month"
            };
            // Если пользователь переименовал вклад в банке, используем название которое он указал
            if (account.clientLabel) {
                // Заменяем значение в массиве
                account_info.title = account.clientLabel;
            };
            // Проверяем, является ли вклад закрытым
            if (account.closeDate) {
                // Указываем его архивным
                account_info.archive = true;
            };
            // Проверяем, является ли вклад капитализированным
            if (account.incarnations[0].contractDetails[0].interestPaymentType === 3) {
                // Указываем его как с капитализацией
                account_info.capitalization = true;
            };
            // Определяем процент по вкладу, если процент зависит от суммы вклада
            // Придуманы блин, не могу сразу предоставить... =(
            // Если процент не зависит, он будет храниться в переменной
            if (!account.incarnations[0].contractDetails[0].interestRate) {
                // Проверяем что массив имеет ключи
                if (account.incarnations[0].contractDetails[0].conditionalInterestRates.length > 0) {
                    // Отлично, массив имеет значение
                    // Теперь его нужно разобрать
                    for (var i2 = 0; i2 < account.incarnations[0].contractDetails[0].conditionalInterestRates.length; ++i2) {
                        // Проверяем, чтобы сумма первого взноса была в промежутке
                        if (account_info.sum >= account.incarnations[0].contractDetails[0].conditionalInterestRates[i2].valueMin && account_info.sum <= account.incarnations[0].contractDetails[0].conditionalInterestRates[i2].valueMax) {
                            // Отлично, сумма в промежутке, выставляем процент
                            account_info.percent = account.incarnations[0].contractDetails[0].conditionalInterestRates[i2].interestRate * 100;
                            // Завершаем разбор массива
                            break;
                        };
                    };
                };
                
                // Проверяем установлено ли значение
                if (account_info.percent === 0) {
                    // Значение не установлено, предполагается что не удалось определить.
                    // Выведем информация в трейс, о том что не определили процент для вклада
                    ZenMoney.trace("Не удалось определить процент для вклада: " + account_info.title + " (#" + account_info.id + ")", "WARN");
                };
            } else {
                // Добавляем значение в массив
                account_info.percent = account.incarnations[0].contractDetails[0].interestRate * 100;
            };
            // Выводим в трейс название и id обрабатываемого вклада
            ZenMoney.trace("Обработка вклада: " + account_info.title + " (#" + account_info.id + ")", "INFO");
            // Добавляем аккаунт
            ZenMoney.addAccount(account_info);
            deposits.push(account_info.id);
        };
        // Возвращаем результат
        return deposits;
    };

    // Функция для синхронизации транзакций
    function syncTransactions(id, type) {
        if (id == "" || type == "") {
            throw new ZenMoney.Error("Ошибка синхронизации: Не переданы данные.", null, true);
        }
        
        switch (type) {
            case "ccard":
                // Получение транзакций по карточным счетам
                var result = query("GET", options.url + "/api/cards/accounts/" + id + "/statement?StartDate=" + timesync.toISOString() + "&EndDate=" + timenow.toISOString() + "&Income=true&Outcome=true&ProcessedOnly=false&SortDirection=2&PageSize=10000&PageNumber=1", null, options.headers, "OBJECT");
                break;
            case "checking":
                // Получение транзакций по счетам
                var result = query("GET", options.url + "/api/accounts/" + id + "/statement?StartDate=" + timesync.toISOString() + "&EndDate=" + timenow.toISOString() + "&Income=true&Outcome=true&ProcessedOnly=false&SortDirection=2&PageSize=10000&PageNumber=1", null, options.headers, "OBJECT");
                break;
            case "loan":
                // Планируется в скором будущем
                return;
                break;
            case "deposit":
                // Планируется в скором будущем
                return;
                break;
            default:
                throw new ZenMoney.Error("Ошибка синхронизации: Не верный параметр.", null, false);
                return false;
                break;
        }
        
        // Если запрос не выполнился
        if (!result) {
            // Вываливаемся с ошибкой 
            throw new ZenMoney.Error("Ошибка синхронизации: Не получены данные по транзакциям счета " + id + ".", null, false);
            return false;
        };
        // Проверяем количество полученных транзакций
        if (result.transactions.length !== 0) {
            // Если их количество не равно 0
            for (var i1 = 0; i1 < result.transactions.length; ++i1) {
                // Передаем переменной transaction значение из массива по индексу
                var transaction = result.transactions[i1];
                // Создаем массив с данными
                var transaction_info = {
                    "date": transaction.transactionDate,
                    "comment": transaction.ground
                };
                // Проверяем тип операции
                if (transaction.transactionSum >= 0) {
                    // Расцениваем как доход
                    transaction_info.incomeAccount =  "id" + id;
                    transaction_info.income = transaction.transactionSum;
                    transaction_info.opIncomeInstrument = transaction.transactionCurrency.nameIso;
                    
                    transaction_info.outcomeAccount =  "id" + id;
                    transaction_info.outcome = 0;
                } else {
                    // Иначе, считаем как расход
                    transaction_info.outcomeAccount =  "id" + id;
                    transaction_info.outcome = transaction.transactionSum * -1;
                    transaction_info.opOutcomeInstrument = transaction.transactionCurrency.nameIso;
                    
                    transaction_info.incomeAccount =  "id" + id;
                    transaction_info.income = 0;
                }
                // Присваиваем MCC код если он имеется
                if (transaction.mcc) {
                    transaction_info.mcc = parseInt(transaction.mcc);
                }
                
                ZenMoney.addTransaction(transaction_info);
            }
            ZenMoney.trace("Добавлено транзакций: " + i1 + " из " + result.transactions.length, "INFO");
        } else {
            // Напишем о том, что нет транзакций
            ZenMoney.trace("Транзакций по счету не найдено.", "INFO");
        }
        
        return true;
    };
    
    // Функция для проверки игнорирования
    function isAccountSkipped(id) {
        return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
    }
};