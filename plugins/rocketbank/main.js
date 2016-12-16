/**
 * Начинаем синхронизацию
 */
function main() {
    var lastSyncTime = ZenMoney.getData('last_sync', 0);

    // первоначальная инициализация
    if (lastSyncTime == 0) {
        var preferences = ZenMoney.getPreferences();
        // по умолчанию загружаем операции за неделю
        var period = !preferences.hasOwnProperty('period') || isNaN(period = parseInt(preferences.period)) ? 7 : period;
        if (period > 100) period = 100;	// на всякий случай, ограничим лимит, а то слишком долго будет
        lastSyncTime = Math.floor(Date.now() / 1000) - period * 24 * 60 * 60;
    }

    var debug = true;
    var prompt = ZenMoney.retrieveCode;
    if (debug) {
        var responses = [];
        prompt = function (message, unused, options) {
            var response = responses.shift();
            if (typeof response == 'string') {
                return response;
            } else {
                return response(message, unused, options);
            }
        };
    }
    ZenMoney.addAccount({
        id: '1',
        title: 'Рублевая карта',
        type: 'ccard',
        instrument: 'RUB',
        syncID: [0]
    });

    var rocketBank = new RocketBank(
        ZenMoney.getData,
        ZenMoney.setData,
        ZenMoney.request,
        prompt,
        ZenMoney.addTransaction,
        ZenMoney.Error,
        ZenMoney.trace
    );
    ZenMoney.setData('last_sync', rocketBank.processTransactions(lastSyncTime));
    ZenMoney.saveData();

    ZenMoney.setResult({success: true});
}


/**
 * @param get
 * @param set
 * @param request
 * @param prompt
 * @param addTransaction
 * @param error
 * @param log
 * @constructor
 */
function RocketBank(get, set, request, prompt, addTransaction, error, log) {

    var baseUrl = "https://rocketbank.ru/api/v5";
    var transactions = [];
    var last_operation = 0;

    /**
     * Обрабатываем транзакции
     *
     * @param {Number} timestamp
     * @return {Number} New timestamp
     */
    this.processTransactions = function (timestamp) {
        log("Начинаем синхронизацию с даты " + new Date(timestamp * 1000).toLocaleString());
        var device = getDevice();
        transactions = [];
        last_operation = timestamp;
        loadOperations(device, getToken(device, false), timestamp, 1, 20).forEach(function (transaction) {
            addTransaction(transaction);
        });
        return last_operation;
    };

    /**
     *
     * @param {String} device_id
     * @param {String} token_id
     * @param {Number} timestamp
     * @param {Number} page
     * @param {Number} limit
     */
    function loadOperations(device_id, token_id, timestamp, page, limit) {
        log("Запрашиваем список операций: страница " + page);
        var data = getJson(
            request(
                "GET",
                baseUrl + "/operations?page=" + page + "&per_page=" + limit,
                null,
                getHeaders(device_id, token_id)
            )
        );
        if (data.hasOwnProperty("response")) {
            if (data.response.status == 401) {
                return loadOperations(device_id, getToken(device_id, true), timestamp, page, limit);
            } else {
                throw new error('Не удалось загрузить список операций: ' + data.response.description);
            }
        }
        log("Загрузили страницу " + data.pagination.current_page + " из " + data.pagination.total_pages);
        if (data.hasOwnProperty("operations")) {
            for (var i = 0; i < data.operations.length; i++) {
                var operation = data.operations[i];
                var dt = new Date(operation.happened_at * 1000);
                if (operation.happened_at <= timestamp) {
                    log("Транзакция #" + operation.id + " уже была ранее обработана (" + dt.toLocaleString() + ")");
                    return transactions;
                }
                if (operation.status != 'confirmed' && operation.status != 'hold') {
                    log('Пропускаем операцию со статусом ' + operation.status);
                    continue;
                }
                if (operation.happened_at > last_operation) {
                    log("Следующие операции будут только после " + dt.toLocaleString());
                    last_operation = operation.happened_at;
                }
                var sum = Math.abs(operation.money.amount);
                var transaction = {
                    id: operation.id,
                    date: operation.happened_at,
                    comment: operation.comment,
                    outcome: 0,
                    outcomeAccount: '1',
                    income: 0,
                    incomeAccount: '1',
                    payee: null
                };
                if (operation.location.latitude != null && operation.location.longitude != null) {
                    transaction.latitude = operation.location.latitude;
                    transaction.longitude = operation.location.longitude;
                }
                if (operation.context_type == 'pos_spending') { // Расход
                    if (operation.money.amount < 0) {
                        transaction.outcome = sum;
                    } else {
                        transaction.income = sum;
                    }
                    transaction.payee = operation.merchant.name;
                } else if (operation.context_type == 'atm_cash_out') { // Снятие наличных
                    transaction.income = sum;
                    transaction.incomeAccount = 'cash#' + operation.money.currency_code;
                    transaction.outcome = sum;
                    if (transaction.comment == null) {
                        transaction.comment = operation.details;
                    }
                } else if (operation.context_type == 'remittance') { // Перевод (исходящий)
                    transaction.outcome = sum;
                    transaction.payee = operation.merchant.name;
                } else if (operation.context_type == 'card2card_cash_in') { // Перевод с карты (входящий)
                    transaction.income = sum;
                    if (transaction.comment == null) {
                        transaction.comment = operation.details;
                    }
                } else if (operation.context_type == 'rocket_fee') { // Услуги банка
                    transaction.outcome = sum;
                    if (transaction.comment == null) {
                        transaction.comment = operation.details;
                    }
                } else if (operation.context_type == 'card2card_cash_out_other') { // Исходящий перевод внутри банка
                    transaction.outcome = sum;
                } else if (operation.context_type == 'internal_cash_in') { // Входящий перевод внутри банка
                    transaction.income = sum;
                    transaction.comment = operation.details + ': ' + operation.comment;
                } else if (operation.context_type == 'transfer_cash_in') { // Начисление процентов
                    transaction.income = sum;
                    transaction.comment = operation.details + ': ' + operation.comment;
                }
                transactions.unshift(transaction);
            }
            if (data.pagination.current_page < data.pagination.total_pages) {
                return loadOperations(device_id, token_id, timestamp, page + 1, limit);
            }
        } else {
            log("Операции не найдены (всего операций " + data.pagination.total_count + ")");
        }
        return transactions;
    }

    /**
     * Возвращает ID устройства
     *
     * @returns {string}
     */
    function getDevice() {
        var deviceId = get('device_id');
        if (!deviceId) {
            log("Необходимо привязать устройство...");
            var phone = prompt("Введите свой номер телефона в формате +79211234567", null, {
                inputType: "phone",
                time: 18E4
            });
            deviceId = registerDevice(phone);
            log("Устройство привязано");
        }
        return deviceId;
    }

    /**
     * Получить токен для запросов
     *
     * @param {String} device_id
     * @param {Boolean} force_new
     * @returns {string}
     */
    function getToken(device_id, force_new) {
        var token = get('token');
        if (!token || force_new) {
            log("Требуется создать новый токен");
            var password = prompt(
                "Введите пароль, используемый для входа в официальные приложения",
                null,
                {
                    inputType: "numberPassword",
                    time: 18E4
                }
            );
            log("Пароль получен, отправляем запрос");
            var data = getJson(
                request(
                    'GET',
                    baseUrl + "/login?email=" + get('email') + "&password=" + password,
                    null,
                    getHeaders(device_id, null)
                )
            );
            if (!data.hasOwnProperty('token')) {
                throw new error('Не удалось подтвердить телефон: ' + data.response.description);
            }
            token = data.token;
            set("token", token);
        }
        return token;
    }

    /**
     * Регистрируем новое устройтво
     *
     * @param {String} phone
     * @returns {String}
     */
    function registerDevice(phone) {
        var device_id = "zenmoney_" + hex_md5(Math.random().toString() + "_" + phone + "_" + Date.now());
        log("Отправляем запрос на регистрацию утсройства");
        var data = getJson(
            request(
                'POST',
                baseUrl + "/devices/register",
                JSON.stringify({phone: phone}),
                getHeaders(device_id, null)
            )
        );
        if (data.response.status == 200) {
            log(data.response.description);
        } else {
            throw new error('Не удалось отправить код подтверждения: ' + data.response.description);
        }
        var code = prompt("Введите код подтверждения из смс для авторизации приложения в интернет-банке", null, {
            inputType: "numberDecimal",
            time: 18E4
        });
        log("Получили код");
        data = getJson(
            request(
                'PATCH',
                baseUrl + "/sms_verifications/" + data.sms_verification.id + "/verify",
                JSON.stringify({code: code}),
                getHeaders(device_id, null)
            )
        );
        if (data.response.status == 200) {
            log(data.response.description);
        } else {
            throw new error('Не удалось подтвердить телефон: ' + data.response.description);
        }
        set("device_id", device_id);
        set("email", data.user.email);

        return device_id;
    }

    /**
     * Разбираем строку ответа
     *
     * @param {String} data
     */
    function getJson(data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            log('Bad json (' + e.message + '): ' + data);
            throw new error('Сервер вернул ошибочные данные: ' + e.message);
        }
    }

    /**
     * Формируем объект заголовков
     *
     * @param {String} device_id
     * @param {String} token
     * @returns {Object}
     */
    function getHeaders(device_id, token) {
        var date = Math.floor(Date.now() / 1000);
        var headers = {
            "X-Device-ID": device_id,
            "X-Time": date,
            "X-Sig": hex_md5("0Jk211uvxyyYAFcSSsBK3+etfkDPKMz6asDqrzr+f7c=_" + date + "_dossantos"),
            "Content-Type": "application/json"
        };
        if (token) {
            headers["Authorization"] = "Token token=" + token;
        }
        return headers;
    }
}
