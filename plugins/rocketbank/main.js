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

    ZenMoney.addAccount({
        id: '1',
        title: 'Рублевая карта',
        type: 'ccard',
        instrument: 'RUB',
        syncID: [0]
    });

    var rocketBank = new RocketBank(ZenMoney);
    ZenMoney.setData('last_sync', rocketBank.processTransactions(lastSyncTime));
    ZenMoney.saveData();

    ZenMoney.setResult({success: true});
}


/**
 * @param {Object} ZenMoney
 * @constructor
 */
function RocketBank(ZenMoney) {
    /**
     * Обрабатываем транзакции
     *
     * @param {Number} timestamp
     * @return {Number} New timestamp
     */
    this.processTransactions = function (timestamp) {
        ZenMoney.trace("Начинаем синхронизацию с даты " + new Date(timestamp * 1000).toLocaleString());
        var device = getDevice();
        var success = loadOperations(device, getToken(device, false), timestamp).reverse().every(function (transaction) {
            try {
                timestamp = Math.max(timestamp, transaction.date);
                ZenMoney.addTransaction(transaction);
                return true;
            } catch (exception) {
                ZenMoney.trace('Не удалось добавить транзакцию: ' + JSON.stringify(transaction));
                return false;
            }
        });
        if (!success) {
            ZenMoney.trace('Не все транзакции были обработаны');
        }
        return timestamp;
    };

    /**
     *
     * @param {String} device_id
     * @param {String} token_id
     * @param {Number} timestamp
     * @param {Number} [page]
     * @param {Number} [limit]
     * @param {Object[]} [transactions]
     */
    function loadOperations(device_id, token_id, timestamp, page, limit, transactions) {
        page = page || 1;
        limit = limit || 20;
        transactions = transactions || [];
        ZenMoney.trace("Запрашиваем список операций: страница " + page);
        var data = request("GET", "/operations?page=" + page + "&per_page=" + limit, null, device_id, token_id);
        if (data.hasOwnProperty("response")) {
            if (data.response.status == 401) {
                return loadOperations(device_id, getToken(device_id, true), timestamp, page, limit, transactions);
            } else {
                throw new ZenMoney.Error('Не удалось загрузить список операций: ' + data.response.description);
            }
        }
        ZenMoney.trace("Загрузили страницу " + data.pagination.current_page + " из " + data.pagination.total_pages);
        if (data.hasOwnProperty("operations")) {
            for (var i = 0; i < data.operations.length; i++) {
                var operation = data.operations[i];
                var dt = new Date(operation.happened_at * 1000);
                if (operation.happened_at <= timestamp) {
                    ZenMoney.trace("Транзакция #" + operation.id + " уже была ранее обработана (" + dt.toLocaleString() + ")");
                    return transactions;
                }
                if (operation.status != 'confirmed' && operation.status != 'hold') {
                    ZenMoney.trace('Пропускаем операцию со статусом ' + operation.status);
                    continue;
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
                    payee: operation.merchant.name
                };
                switch (operation.context_type) {
                    case 'pos_spending': // Расход
                        if (operation.money.amount < 0) {
                            transaction.outcome = sum;
                        } else {
                            transaction.income = sum;
                        }
                        break;
                    case 'atm_cash_out': // Снятие наличных
                        transaction.income = sum;
                        transaction.incomeAccount = 'cash#' + operation.money.currency_code;
                        transaction.outcome = sum;
                        transaction.payee = null;
                        if (transaction.comment == null) {
                            transaction.comment = operation.details;
                        }
                        break;
                    case 'remittance': // Перевод (исходящий)
                        transaction.outcome = sum;
                        break;
                    case 'card2card_cash_in': // Перевод с карты (входящий)
                        transaction.income = sum;
                        break;
                    case 'card2card_cash_out': // Исходящий перевод на карту
                        transaction.outcome = sum;
                        break;
                    case 'card2card_cash_out_other': // Исходящий перевод внутри банка
                        transaction.outcome = sum;
                        break;
                    case 'commission': // Комиссия за операцию
                    case 'rocket_fee': // Услуги банка
                        transaction.outcome = sum;
                        transaction.payee = 'Рокетбанк';
                        if (transaction.comment == null) {
                            transaction.comment = operation.details;
                        }
                        break;
                    case 'internal_cash_in': // Входящий перевод внутри банка
                    case 'transfer_cash_in': // Начисление процентов
                        transaction.income = sum;
                        transaction.comment = operation.details + ': ' + operation.comment;
                        break;
                    default:
                        ZenMoney.trace('Неизвестный тип транзакции: ' + JSON.stringify(operation));
                        throw new ZenMoney.Error('Неизвестный тип транзакции');
                }
                if (operation.location.latitude != null && operation.location.longitude != null) {
                    transaction.latitude = operation.location.latitude;
                    transaction.longitude = operation.location.longitude;
                }
                transactions.push(transaction);
                ZenMoney.trace("Обрабатываем новую транзакцию: " + JSON.stringify(transaction));
            }
            if (data.pagination.current_page < data.pagination.total_pages) {
                return loadOperations(device_id, token_id, timestamp, page + 1, limit, transactions);
            }
        } else {
            ZenMoney.trace("Операции не найдены (всего операций " + data.pagination.total_count + ")");
        }
        return transactions;
    }

    /**
     * Возвращает ID устройства
     *
     * @returns {string}
     */
    function getDevice() {
        var deviceId = ZenMoney.getData('device_id');
        if (!deviceId) {
            ZenMoney.trace("Необходимо привязать устройство...");
            var phone = ZenMoney.retrieveCode(
                "Введите свой номер телефона в формате +79211234567",
                null,
                {
                    inputType: "phone",
                    time: 18E4
                }
            );
            deviceId = registerDevice(phone);
            ZenMoney.trace("Устройство привязано");
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
        var token = ZenMoney.getData('token');
        if (!token || force_new) {
            ZenMoney.trace("Требуется создать новый токен");
            var password = ZenMoney.retrieveCode(
                "Введите пароль, используемый для входа в официальные приложения",
                null,
                {
                    inputType: "numberPassword",
                    time: 18E4
                }
            );
            ZenMoney.trace("Пароль получен, отправляем запрос");
            var data = request(
                "GET",
                "/login?email=" + ZenMoney.getData('email') + "&password=" + password,
                null,
                device_id,
                null
            );
            if (!data.hasOwnProperty('token')) {
                throw new ZenMoney.Error('Не удалось подтвердить телефон: ' + data.response.description);
            }
            token = data.token;
            ZenMoney.setData("token", token);
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
        ZenMoney.trace("Отправляем запрос на регистрацию утсройства " + device_id + " (" + phone + ")");
        var data = request("POST", "/devices/register", {phone: phone}, device_id, null);
        if (data.response.status == 200) {
            ZenMoney.trace(data.response.description);
        } else {
            throw new ZenMoney.Error('Не удалось отправить код подтверждения: ' + data.response.description);
        }
        var code = ZenMoney.retrieveCode(
            "Введите код подтверждения из смс для авторизации приложения в интернет-банке",
            null,
            {
                inputType: "numberDecimal",
                time: 18E4
            }
        );
        ZenMoney.trace("Получили код");
        data = request(
            "PATCH",
            "/sms_verifications/" + data.sms_verification.id + "/verify",
            {code: code},
            device_id,
            null
        );
        if (data.response.status == 200) {
            ZenMoney.trace(data.response.description);
        } else {
            throw new ZenMoney.Error('Не удалось подтвердить телефон: ' + data.response.description);
        }
        ZenMoney.setData("device_id", device_id);
        ZenMoney.setData("email", data.user.email);

        return device_id;
    }

    /**
     * Делаем запрос на сервер
     *
     * @param {String} method
     * @param {String} url
     * @param {Object} data
     * @param {String} device_id
     * @param {String} token
     * @return {Object}
     */
    function request(method, url, data, device_id, token) {
        var baseUrl = "https://rocketbank.ru/api/v5";
        var response = ZenMoney.request(method, baseUrl + url, JSON.stringify(data), getHeaders(device_id, token));
        if (!response) {
            ZenMoney.trace(
                'Пришёл пустой ответ во время ' + method + ' запроса по адресу "' + baseUrl + url + '"'
            );
            throw new ZenMoney.Error('Неверный ответ с сервера');
        }
        return getJson(response);
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
            ZenMoney.trace('Bad json (' + e.message + '): ' + data);
            throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message);
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
            "X-Time": date.toString(),
            "X-Sig": hex_md5("0Jk211uvxyyYAFcSSsBK3+etfkDPKMz6asDqrzr+f7c=_" + date + "_dossantos"),
            "Content-Type": "application/json"
        };
        if (token) {
            headers["Authorization"] = "Token token=" + token;
        }
        return headers;
    }
}
