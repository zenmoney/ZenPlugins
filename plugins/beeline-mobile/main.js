/**
 * Точка входа
 */
function main() {
    /* Инициализация плагина для загрузки данных из Интернет-банка */
    var beelineBank = new BeelineBank(ZenMoney);

    /* Загрузка данных об аккаунте и совершенных транзакциях */
    var success = beelineBank.syncAccountAndTransactions();

    /* Сохранение данных */
    ZenMoney.saveData();

    /* Передача статуса выгрузки данных приложению (успех или провал) */
    ZenMoney.setResult({success: success});
}


/**
 * @param {Object} ZenMoney
 * @constructor
 */
function BeelineBank(ZenMoney) {

    var BANK_TITLE = "Билайн";
    var BASE_URL = "https://paycard.beeline.ru/api/v04/";
    var DEFAULT_CURRENCY = "RUR";
    var INTERNAL_VERSION = "1.15.4";

    var HEADERS = {
        API_KEY : "qhRdyHTMAVsd4KU60Ntn8ohSq2ofmMSBEJvZO0YDq/k=",
        CONTENT_TYPE : "application/json",
        USER_AGENT : "PlatinumCloyster-iOS-FakeAgent/1.0"
    }

    var REQUESTS = {
        AUTHORIZE      : {method: "PUT", url: BASE_URL + "auth/login",
            body: {ean: getLogin(), password: getPassword(), versionName: INTERNAL_VERSION}},
        GET_ACCOUNT    : {method: "GET", url: BASE_URL + "card/info;", body: null},
        GET_OPERATIONS : {method: "GET", url: BASE_URL + "unitedOperationHistory;?maxEntries=", body: null}
    };

    /**
     * Загружает данные из Интернет-банка
     *
     * @param {String} account
     */
    this.syncAccountAndTransactions = function() {
        // authorize();
        // return true;

        /* Сброс количества транзакций для загрузки, чтобы оно пересчитывалось для каждой синхронизации */
        ZenMoney.setData('transactions_sync_limit', null);

        /* Загрузка и импорт данных об аккаунте */
        var account = syncAccount();

        /* Загрузка и импорт данных о транзакциях */
        return syncTransactions(account);
    }

    /**
     * Загружает список транзакций
     *
     * @param {String} account
     */
    function syncTransactions(account) {
        /* Дата, до которой нужно загрузить данные о транзакциях */
        var dateOfLastProcessedTransaction = getDateOfLastProcessedTransaction(account);

        /* Вычисление примерного количества транзакций, которое необходимо загрузить */
        var transactionsPerDayCount = 10;
        var daysToSyncCount = parseInt((getCurrentDate() - dateOfLastProcessedTransaction) / 24 / 60 / 60 / 1000);
        var transactionsToSyncCount = ZenMoney.getData('transactions_sync_limit') || transactionsPerDayCount * daysToSyncCount;

        /* Отправка данных на сервер, получение от него ответа */
        ZenMoney.trace("Загрузка данных о транзакциях...");
        var data = doRequest(REQUESTS.GET_OPERATIONS, transactionsToSyncCount);

        /* Проверка, что ответ от сервера не содержит ошибки */
        if (data.hasOwnProperty("response")) {
            ZenMoney.trace('Произошла ошибка при получении данных о транзакциях: ' + data.error.message);
            throw new ZenMoney.Error('Не удалось загрузить данные о транзакциях.');
        }

        /* Проверка, что ответ от сервера содержит данные о транзакциях */
        if (data.hasOwnProperty("operationList")) {

            /* Проверка, что все транзакции до нужной даты были загружены.
             * Если нет, увеличение количества загружаемых транзакций и повторение загрузки. */
            var dateOfLastTransactionFromServer = getDateOfLastTransactionFromServer(data.operationList);
            if (dateOfLastProcessedTransaction <= dateOfLastTransactionFromServer) {
                ZenMoney.trace("Увеличение лимита загружаемых данных.");
                ZenMoney.setData('transactions_sync_limit', parseInt(transactionsToSyncCount * 3 / 2));
                syncTransactions(account);

            } else {
                /* Обработка каждой загруженной транзакции */
                for (var i = 0; i < data.operationList.length; i++) {
                    var operation = data.operationList[i];
                    var dt = Date.parse(operation.dateTime);

                    /* Завершение обработки, если транзакция уже была обработана в предыдущей синхронизации
                     * или не попадает в заданный период загрузки данных */
                    if (dt < dateOfLastProcessedTransaction) {
                        ZenMoney.trace("Транзакция #" + operation.id +
                            " уже обработана ранее или не попадает в период загрузки данных.");
                        break;
                    }

                    /* Подготовка транзакции к импорту в базу ZenMoney. */
                    var transaction = {
                        id: operation.id,
                        date: operation.dateTime.split(' ')[0],
                        comment: operation.userComment,
                        outcome: 0,
                        outcomeAccount: account,
                        income: 0,
                        incomeAccount: account,
                        payee: operation.descriptionText,
                        mcc: operation.mcc
                    };

                    /* Заполнение данных о сумме транзакции */
                    var sum = Math.abs(operation.amount.value / 100);

                    /* Случай, когда валюта транзакции совпадает с валютой карты */
                    if (operation.amount.currency == DEFAULT_CURRENCY) {
                        if (operation.amount.value < 0) {
                            transaction.outcome = sum;
                        } else {
                            transaction.income = sum;
                        }
                    /* Случай, когда валюта транзакции НЕ совпадает с валютой карты */
                    } else {
                        if (operation.amount.value < 0) {
                            transaction.opOutcome = sum;
                            transaction.opOutcomeInstrument = operation.amount.currency;
                            transaction.outcome = operation.turnover > 0 ? operation.turnover / 100 : sum;
                        } else {
                            transaction.opIncome = Math.abs(operation.amount.value / 100);
                            transaction.opIncomeInstrument = operation.amount.currency;
                            transaction.outcome = operation.turnover > 0 ? operation.turnover / 100 : sum;
                        }
                    }

                    /* Если комментарий транзакции пустой, внесение в него данных о категории и MCC-коде */
                    if (!transaction.comment && operation.cathegoryName && operation.mcc) {
                        transaction.comment = operation.cathegoryName + "; MCC:" + operation.mcc;
                    }

                    /* Импорт транзакции в базу ZenMoney */
                    try {
                        ZenMoney.addTransaction(transaction);
                        if (operation.moneyOperationType != 'Операция выполняется') {
                            ZenMoney.setData('latest_processed_date_' + account, parseInt(dt))
                        }
                    /* Обработка ошибок при импорте транзакции */
                    } catch (exception) {
                        ZenMoney.trace("Произошла ошибка " + exception +
                            " при добавлении следующей транзакции: " + JSON.stringify(transaction));
                        /* Возврат кода об ошибке */
                        return false;
                    }
                    ZenMoney.trace("Транзакция #" + transaction.id + " добавлена: " +
                        transaction.date + ": " + transaction.payee + " | " + sum);
                }
            }

        /* Обработка случая, если список транзакций пустой */
        } else {
            ZenMoney.trace("Данные о транзакциях не были загружены.");
        }

        /* Возврат кода об успешной загрузке данных транзакций */
        return true;
    }

    /**
     * Возвращает дату последней завершенной транзакции, сохраненной в базе ZenMoney; в миллисекундах
     * Если синхронизация ранее не проводилась, возвращает дату первого дня начального периода загрузки данных
     *
     * @returns {number}
     */
    function getDateOfLastProcessedTransaction(account) {
        var lastProcessedDate = ZenMoney.getData('latest_processed_date_' + account, 0);
        var prefs = ZenMoney.getPreferences();
        var period = !prefs.hasOwnProperty('period') || isNaN(period = parseInt(prefs.period)) ? 7 : period;
        var syncedPeriod = ZenMoney.getData('period_to_sync_' + account, 0);
        if (lastProcessedDate == 0 || period != syncedPeriod) {
            lastProcessedDate = getCurrentDate() - period * 24 * 60 * 60 * 1000;
            ZenMoney.setData('period_to_sync_' + account, period);
        }
        return lastProcessedDate;
    }

    /**
     * Возвращает текущую дату; в миллисекундах
     *
     * @returns {number}
     */
    function getCurrentDate() {
        return Date.now();
    }

    /**
     * Возвращает дату последней транзакции, загруженной в текущем сеансе связи с банком; в миллисекундах
     *
     * @returns {number}
     */
    function getDateOfLastTransactionFromServer(operationList) {
        var lastOperation = operationList[operationList.length-1];
        return Date.parse(lastOperation.dateTime);
    }

    /**
     * Возвращает идентификатор устройства
     *
     * @returns {string}
     */
    function getDeviceId() {
        var id = ZenMoney.getData('device_id');
        if (!id) {
            /* Генерация буквенно-числовой строки длиной в 32 символа */
            id = hex_md5(Math.random().toString()).toUpperCase();
            /* Преобразование строки в формат XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX */
            id = id.slice(0, 8) + "-" + id.slice(9, 12) + "-" + id.slice(12, 16) + "-" + id.slice(17, 22) + "-" + id.slice(23);
            /* Сохранение строки в плагине */
            ZenMoney.setData('device_id', id)
        }
        return id;
    }


    /**
     * Авторизует пользователя в Интернет-банке и сохраняет номер сессии в данных плагина
     */
    function authorize() {
        var data = doRequest(REQUESTS.AUTHORIZE, null);
        if (!data.hasOwnProperty('jsessionid')) {
            throw new ZenMoney.Error('Ошибка авторизации: ' + data.error.message);
        }
        ZenMoney.setData('jsessionid', data.jsessionid);
    };

    /**
     * Возвращает логин для подключения к Интернет-банку
     *
     * @return {string}
     */
    function getLogin() {
        var prefs = ZenMoney.getPreferences();
        if (!prefs.login) {
            throw new ZenMoney.Error("Укажите логин в параметрах подключения к банку.", null, true);
        }
        return prefs.login;
    }

    /**
     * Возвращает пароль для подключения к Интернет-банку
     *
     * @return {string}
     */
    function getPassword() {
        var prefs = ZenMoney.getPreferences();
        if (!prefs.password) {
            throw new ZenMoney.Error("Укажите пароль в параметрах подключения к банку.", null, true);
        }
        return prefs.password;
    }

    /**
     * Возвращает номер сессии
     *
     * @param {Boolean} renew_session
     * @return {string}
     */
    function getSessionId(renew_session) {
        if (!ZenMoney.getData('jsessionid') || renew_session) {
            ZenMoney.trace("Получение нового номера сессии...");
            authorize();
        }
        ZenMoney.trace("Номер сессии получен: " + ZenMoney.getData('jsessionid'));
        return ZenMoney.getData('jsessionid');
    }

    /**
     * Загружает данные об аккаунте
     *
     * @return {{id: String, pan: String, balance: Number, currency: String, title: String}[]}
     */
    function syncAccount() {
        var profile = doRequest(REQUESTS.GET_ACCOUNT, null);
        if (profile.hasOwnProperty("response") || !profile.hasOwnProperty("auxInfo")) {
            ZenMoney.trace('Ошибка при получении списка аккаунтов: ' + JSON.stringify(profile));
            throw new ZenMoney.Error('Не удалось загрузить список аккаунтов');
        }
        var beelineAccount = {
            title: BANK_TITLE + ": " + profile.auxInfo.panTail,
            id: profile.auxInfo.panTail,
            type: 'ccard',
            instrument: DEFAULT_CURRENCY,
            balance: profile.money.availableBalance / 100,
            syncID: [parseInt(profile.auxInfo.panTail)]
        }
        ZenMoney.addAccount(beelineAccount);
        return beelineAccount.id;
    }

    /**
     * Отправляет запрос на сервер
     *
     * @param {Object} data
     * @param {String} param
     * @return {Object}
     */
    function doRequest(data, param) {
        var response;
        var finalUrl = data.url;
        if (data.url.match("\;")) {
            finalUrl = data.url.replace(";", ";jsessionid=" + getSessionId(false));
        }
        if (param) {
            finalUrl += param;
        }if (!data.method || data.method.toUpperCase() === 'GET') {
            response = ZenMoney.requestGet(finalUrl, getHeaders());
        } else {
            response = ZenMoney.request(data.method, finalUrl, data.body, getHeaders());
        }
        if (!response) {
            ZenMoney.trace('Получен пустой ответ при совершении ' + data.method + '-запроса по адресу "' + finalUrl + '".');
            throw new ZenMoney.Error('Неверный ответ с сервера');
        }
        if (response.status == 401) {
            getSessionId(true);
            return doRequest(data, param);
        }
        return getJson(response);
    }

    /**
     * Преобразует JSON-данные в объект
     *
     * @param {String} data
     * @return {Object}
     */
    function getJson(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            ZenMoney.trace('Некорректный JSON-ответ (' + e.message + '): ' + data);
            throw new ZenMoney.Error('От сервера получены некорректные данные: ' + e.message);
        }
    }

    /**
     * Подготавливает заголовки HTTP-запросов
     *
     * @param {String} device_id
     * @returns {Object}
     */
    function getHeaders() {
        var headers = {
            "instId": getDeviceId(),
            "apiKey": HEADERS.API_KEY,
            "Content-Type": HEADERS.CONTENT_TYPE,
            "User-Agent": HEADERS.USER_AGENT,
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate"
    };
        return headers;
    }
}
