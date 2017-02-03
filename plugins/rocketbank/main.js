/**
 * Начинаем синхронизацию
 */
function main() {
    var rocketBank = new RocketBank(ZenMoney);
    var success = rocketBank.fetchAccounts().every(rocketBank.processAccount);
    ZenMoney.saveData();
    ZenMoney.setResult({success: success});
}


/**
 * @param {Object} ZenMoney
 * @constructor
 */
function RocketBank(ZenMoney) {
    /**
     * Обрабатываем аккаунты
     *
     * @return {String[]}
     */
    this.fetchAccounts = function () {
        ZenMoney.trace("Загружаем список аккаунтов");
        var device = getDevice();
        var token = getToken(device, false);
        return loadAccounts(device, token).map(function (account) {
            ZenMoney.trace("Обрабатываем аккаунт: " + JSON.stringify(account));
            ZenMoney.addAccount({
                id: account.id,
                title: account.title,
                type: 'ccard',
                instrument: account.currency,
                balance: account.balance,
                syncID: [parseInt(account.pan.substr(-4))]
            });
            return account.id;
        });
    };

    /**
     * @param {String} account
     * @return {boolean}
     */
    this.processAccount = function (account) {
        var lastSync = getLastSyncTime(account);
        var dt = new Date(lastSync * 1000);
        ZenMoney.trace('Начинаем синхронизацию аккаунта ' + account + ' с даты ' + dt.toLocaleString());
        var device = getDevice();
        return loadOperations(device, getToken(device, false), account, lastSync).reverse().every(function (transaction) {
            ZenMoney.trace("Обрабатываем новую транзакцию: " + JSON.stringify(transaction));
            try {
                lastSync = Math.max(lastSync, transaction.date);
                ZenMoney.addTransaction(transaction);
                ZenMoney.setData('last_sync_' + account, lastSync);
                return true;
            } catch (exception) {
                ZenMoney.trace('Не удалось добавить транзакцию: ' + JSON.stringify(transaction));
                return false;
            }
        });
    };

    /**
     * @param {String} account
     * @return {Number}
     */
    function getLastSyncTime(account) {
        var lastSyncTime = parseInt(ZenMoney.getData('last_sync_' + account, 0));

        // первоначальная инициализация
        if (lastSyncTime == 0) {
            var preferences = ZenMoney.getPreferences();
            // по умолчанию загружаем операции за неделю
            var period = !preferences.hasOwnProperty('period') || isNaN(period = parseInt(preferences.period)) ? 7 : period;
            if (period > 100) period = 100;	// на всякий случай, ограничим лимит, а то слишком долго будет
            lastSyncTime = Math.floor(Date.now() / 1000) - period * 24 * 60 * 60;
        }

        return lastSyncTime;
    }

    /**
     * Загружаем список существующих аккаунтов
     *
     * @param {String} device
     * @param {String} token
     *
     * @return {{id: String, pan: String, balance: Number, currency: String, title: String}[]}
     */
    function loadAccounts(device, token) {
        var profile = request("GET", "/profile", null, device, token);
        if (profile.hasOwnProperty("response")) {
            if (profile.response.status == 401) {
                return loadAccounts(device, getToken(device, true));
            } else {
                ZenMoney.trace('Не удалось загрузить список аккаунтов: ' + profile.response.description);
                throw new ZenMoney.Error('Не удалось загрузить список аккаунтов');
            }
        }
        if (!profile.hasOwnProperty("user")) {
            ZenMoney.trace('Не удалось загрузить список аккаунтов:' + JSON.stringify(profile));
            throw new ZenMoney.Error('Не удалось загрузить список аккаунтов');
        }
        var accountsNumber = profile.user.accounts.length;
        ZenMoney.trace('Найдено аккаунтов: ' + accountsNumber);
        var accounts = [];
        for (var i = 0; i < accountsNumber; i++) {
            var account = profile.user.accounts[i];
            accounts.push({
                id: account.token,
                pan: account.pan,
                balance: account.balance,
                currency: account.currency,
                title: account.title
            });
        }
        return accounts;
    }

    /**
     * Загружаем список операций
     *
     * @param {String} device
     * @param {String} token
     * @param {String} account
     * @param {Number} timestamp
     * @param {Number} [page]
     * @param {Number} [limit]
     * @param {Object[]} [transactions]
     */
    function loadOperations(device, token, account, timestamp, page, limit, transactions) {
        page = page || 1;
        limit = limit || 10;
        transactions = transactions || [];
        ZenMoney.trace("Запрашиваем список операций: страница " + page);
        var data = request("GET", "/accounts/" + account + "/feed?page=" + page + "&per_page=" + limit, null, device, token);
        if (data.hasOwnProperty("response")) {
            if (data.response.status == 401) {
                return loadOperations(device, getToken(device, true), account, timestamp, page, limit, transactions);
            } else {
                ZenMoney.trace('Не удалось загрузить список операций: ' + data.response.description);
                throw new ZenMoney.Error('Не удалось загрузить список операций');
            }
        }
        ZenMoney.trace("Загрузили страницу " + data.pagination.current_page + " из " + data.pagination.total_pages);
        if (data.hasOwnProperty("feed")) {
            for (var i = 0; i < data.feed.length; i++) {
                var operation = data.feed[i][1];
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
                    outcomeAccount: account,
                    income: 0,
                    incomeAccount: account,
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
                        break;
                    case 'remittance': // Перевод (исходящий)
                        transaction.outcome = sum;
                        break;
                    case 'card2card_cash_in': // Перевод с карты (входящий)
                    case 'internal_p2p_in': // Пополнение по номеру карты
                        transaction.income = sum;
                        break;
                    case 'card2card_cash_out': // Исходящий перевод на карту
                        transaction.outcome = sum;
                        transaction.payee = null;
                        break;
                    case 'card2card_cash_out_other': // Исходящий перевод внутри банка
                        transaction.outcome = sum;
                        break;
                    case 'commission': // Комиссия за операцию
                    case 'rocket_fee': // Услуги банка
                        transaction.outcome = sum;
                        transaction.payee = 'Рокетбанк';
                        break;
                    case 'internal_cash_in': // Входящий перевод внутри банка
                    case 'transfer_cash_in': // Начисление процентов
                        transaction.income = sum;
                        transaction.payee = 'Рокетбанк';
                        transaction.comment = operation.details + ': ' + operation.comment;
                        break;
                    case 'miles_cash_back': // Возврат за рокетрубли
                        transaction.income = sum;
                        transaction.payee = 'Рокетбанк';
                        break;
                    case 'open_deposit': // Открытие вклада
                        transaction.income = sum;
                        transaction.incomeAccount = 'deposit#' + operation.money.currency_code;
                        transaction.outcome = sum;
                        break;
                    default:
                        delete operation['receipt_url']; // Do not log private info
                        ZenMoney.trace('Неизвестный тип транзакции: ' + JSON.stringify(operation));
                        throw new ZenMoney.Error('Неизвестный тип транзакции');
                }

                if (transaction.comment == null) {
                    transaction.comment = operation.details;
                }

                if (operation.location.latitude != null && operation.location.longitude != null) {
                    transaction.latitude = operation.location.latitude;
                    transaction.longitude = operation.location.longitude;
                }
                transactions.push(transaction);
            }
            if (data.pagination.current_page < data.pagination.total_pages) {
                return loadOperations(device, token, account, timestamp, page + 1, limit, transactions);
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
        ZenMoney.trace(
            "Отправляем запрос на регистрацию утсройства " + depersonalize(device_id) + " (" + depersonalize(phone) + ")"
        );
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
     * Depersonalize user data
     *
     * @param {String} original
     * @param {Number} [percent]
     *
     * @return {String}
     */
    function depersonalize(original, percent) {
        percent = percent || 0.25;
        var length = Math.floor(original.length * percent);
        var part = original.slice(0, length * -1);
        for (var i = 0; i < length; i++) {
            part += '*';
        }

        return part;
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
        var response;
        if (!method || method.toUpperCase() === 'GET') {
            response = ZenMoney.requestGet(baseUrl + url, getHeaders(device_id, token));
        } else {
            response = ZenMoney.request(method, baseUrl + url, data, getHeaders(device_id, token));
        }
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
     * @return {Object}
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
