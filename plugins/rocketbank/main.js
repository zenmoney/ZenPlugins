/**
 * Начинаем синхронизацию
 */
function main() {
    var rocketBank = new RocketBank(ZenMoney);

    var success = rocketBank.sync();

    ZenMoney.saveData();
    ZenMoney.setResult({success: success});
}


/**
 * @param {Object} ZenMoney
 * @constructor
 */
function RocketBank(ZenMoney) {
    this._safe_accounts = {};
    this._accounts = {};
    this._deposites_init_operations = [];
    this._deposites_percent = [];

    /**
     * @returns {boolean}
     */
    this.sync = function () {
        var that = this;

        var profile = that.loadProfile();

        var deposites = that.fetchDeposites(profile);
        var safe_accounts = that.fetchSafeAccounts(profile);
        var accounts = that.fetchAccounts(profile);

        var p1 = safe_accounts.every(that.processAccount, that);
        var p2 = accounts.every(that.processAccount, that);
        var p3 = that.processDeposite();

        return p1 && p2 && p3;
    };

    /**
     * Обрабатываем карты
     *
     * @return {String[]}
     */
    this.fetchAccounts = function (profile) {
        var that = this;

        ZenMoney.trace("Загружаем список карт");

        var accounts = loadAccounts(profile);

        accounts.forEach(function (account) {
            that._accounts[account.title] = account.id
        });

        return accounts.map(function (account) {
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
     * Обрабатываем счета
     *
     * @return {String[]}
     */
    this.fetchSafeAccounts = function (profile) {
        var that = this;

        ZenMoney.trace("Загружаем список счетов");

        var accounts = loadSafeAccounts(profile);

        accounts.forEach(function (account) {
            that._safe_accounts[account.title] = account.id
        });

        return accounts.map(function (account) {
            ZenMoney.trace("Обрабатываем счет: " + JSON.stringify(account));

            ZenMoney.addAccount({
                id: account.id,
                title: account.title,
                type: 'checking',
                instrument: account.currency,
                balance: account.balance,
                syncID: [parseInt(account.pan.substr(-4))]
            });

            return account.id;
        });
    };

    /**
     * Обрабатываем вклады
     *
     * @return {String[]}
     */
    this.fetchDeposites = function (profile) {
        var that = this;

        ZenMoney.trace("Загружаем список вкладов");
        ZenMoney.trace('Найдено вкладов: ' + profile.user.deposits.length);

        var accounts = [];
        profile.user.deposits.forEach(function (account) {
            var account_id = hex_md5(account.id.toString());

            var deposite = {
                id: account_id,
                title: account.title,
                type: 'deposit',
                syncID: [parseInt(account.id.toString().substr(-4))],
                instrument: account.rocket_deposit.currency,
                balance: account.balance + account.percent,
                percent: account.rocket_deposit.rate,
                capitalization: true,
                startDate: account.start_date,
                endDateOffsetInterval: 'month',
                endDateOffset: account.rocket_deposit.period,
                payoffInterval: 'month',
                payoffStep: 1
            };
            try {
                ZenMoney.trace("Обрабатываем вклад: " + JSON.stringify(deposite));
                ZenMoney.addAccount(deposite);
            } catch (exception) {
                ZenMoney.trace('Не удалось добавить вклад: ' + JSON.stringify(deposite));
            }

            accounts.push(account.id);

            var operations = [];

            var lastSync = getLastSyncTime(account.id);

            account.statements.reverse().forEach(function (operation) {
                if (operation.date <= lastSync) {
                    var od = new Date(operation.date * 1000);

                    ZenMoney.trace("Транзакция уже была ранее обработана (" + od.toLocaleString() + ")");
                    return operations;
                }

                var sum = Math.abs(operation.amount);
                var transaction = {
                    id: hex_md5(operation.date + '|' + operation.sum),
                    date: operation.date,
                    comment: operation.description,
                    outcome: 0,
                    outcomeAccount: account_id,
                    income: 0,
                    incomeAccount: account_id
                };
                switch (operation.kind) {
                    case 'first_refill': // Первичное пополнение
                        transaction.income = sum;
                        break;
                    case 'percent': // Проценты
                        transaction.income = sum;
                        transaction.payee = 'Рокетбанк';
                        break;
                    default:
                        ZenMoney.trace('Неизвестный тип транзакции депозита: ' + JSON.stringify(operation));
                        throw new ZenMoney.Error('Неизвестный тип транзакции депозита');
                }

                switch (operation.kind) {
                    case 'first_refill':
                        that._deposites_init_operations.push(transaction);
                        break;
                    case 'percent':
                        that._deposites_percent.push(transaction);
                        break;
                }
            });
        });

        return accounts;
    };

    /**
     * @param {String} account
     * @return {boolean}
     */
    this.processAccount = function (account) {
        var that = this;

        var lastSync = getLastSyncTime(account);
        var dt = new Date(lastSync * 1000);

        ZenMoney.trace('Начинаем синхронизацию аккаунта ' + account + ' с даты ' + dt.toLocaleString());

        var device = getDevice();
        var operations = that.loadOperations(device, getToken(device, false), account, lastSync);

        return operations.reverse().every(function (transaction) {
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
     * @return {boolean}
     */
    this.processDeposite = function () {
        var that = this;

        ZenMoney.trace('Начинаем синхронизацию депозитов');

        var _init = this.processDepositeInternal(that._deposites_init_operations);
        var _perc = this.processDepositeInternal(that._deposites_percent);

        return _init && _perc;
    };

    /**
     * @param data
     * @returns {boolean}
     */
    this.processDepositeInternal = function (data) {
        return data.reverse().every(function (transaction) {
            ZenMoney.trace("Обрабатываем новую транзакцию: " + JSON.stringify(transaction));

            var account = transaction.incomeAccount;
            var lastSync = getLastSyncTime(account);

            try {
                lastSync = Math.max(lastSync, transaction.date);
                ZenMoney.addTransaction(transaction);
                ZenMoney.setData('last_sync_' + account, lastSync);
                return true;
            } catch (exception) {
                console.log(exception);
                ZenMoney.trace('Не удалось добавить транзакцию: ' + JSON.stringify(transaction));
                return false;
            }
        });
    };

    /**
     * @return {Object}
     */
    this.loadProfile = function () {
        var device = getDevice();
        var token = getToken(device, false);
        var profile = requestProfile(device, token);

        if (!profile.hasOwnProperty("user")) {
            ZenMoney.trace('Не удалось загрузить список аккаунтов:' + JSON.stringify(profile));
            throw new ZenMoney.Error('Не удалось загрузить список аккаунтов');
        }

        return profile;
    };

    /**
     * @param {String} device
     * @param {String} token
     *
     * @return {Object}
     */
    function requestProfile(device, token) {
        var profile = request("GET", "/profile", null, device, token);
        if (profile.hasOwnProperty("response")) {
            if (profile.response.status == 401) {
                return requestProfile(device, getToken(device, true));
            } else {
                ZenMoney.trace('Не удалось загрузить профиль пользователя: ' + profile.response.description);
                throw new ZenMoney.Error('Не удалось загрузить профиль пользователя');
            }
        }

        return profile;
    }

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
     * Загружаем список существующих карт
     *
     * @param {Object} profile
     *
     * @return {{id: String, pan: String, balance: Number, currency: String, title: String}[]}
     */
    function loadAccounts(profile) {
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
     * Загружаем список существующих счетов
     *
     * @param {Object} profile
     *
     * @return {{id: String, pan: String, balance: Number, currency: String, title: String}[]}
     */
    function loadSafeAccounts(profile) {
        var accountsNumber = profile.user.safe_accounts.length;
        ZenMoney.trace('Найдено аккаунтов: ' + accountsNumber);

        var accounts = [];
        for (var i = 0; i < accountsNumber; i++) {
            var account = profile.user.safe_accounts[i];
            accounts.push({
                id: account.token,
                pan: account.account_details.account,
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
    this.loadOperations = function (device, token, account, timestamp, page, limit, transactions) {
        var that = this;
        page = page || 1;
        limit = limit || 10;
        transactions = transactions || [];
        ZenMoney.trace("Запрашиваем список операций: страница " + page);
        var data = request("GET", "/accounts/" + account + "/feed?page=" + page + "&per_page=" + limit, null, device, token);
        if (data.hasOwnProperty("response")) {
            if (data.response.status == 401) {
                return that.loadOperations(device, getToken(device, true), account, timestamp, page, limit, transactions);
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
                    case 'atm_cash_in': // Пополнение наличными
                        transaction.income = sum;
                        transaction.outcome = sum;
                        transaction.outcomeAccount = 'cash#' + operation.money.currency_code;
                        transaction.payee = null;
                        transaction.comment = operation.details;
                        if (operation.comment != null) {
                            transaction.comment += ': ' + operation.comment;
                        }
                        break;
                    case 'remittance': // Перевод (исходящий)
                    case 'internal_cash_out': // Исходящий перевод внутри банка
                        transaction.outcome = sum;
                        break;
                    case 'card2card_cash_in': // Перевод с карты (входящий)
                    case 'card2card_cash_in_other':
                    case 'internal_p2p_in': // Пополнение по номеру карты
                        transaction.income = sum;
                        transaction.payee = null;
                        transaction.comment = operation.details;
                        if (operation.comment != null) {
                            transaction.comment += ': ' + operation.comment;
                        }
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
                        transaction.comment = operation.details;
                        if (operation.comment != null) {
                            transaction.comment += ': ' + operation.comment;
                        }
                        break;
                    case 'internal_cash_in': // Входящий перевод внутри банка
                        transaction.income = sum;
                        transaction.comment = operation.details;
                        if (operation.comment != null) {
                            transaction.comment += ': ' + operation.comment;
                        }

                        var _pattern = ' → ';
                        if (operation.details.indexOf(_pattern) >= 0) {
                            var _accounts = operation.details.split(_pattern);

                            if (that._accounts.hasOwnProperty(_accounts[0])) {
                                transaction.outcome = sum;
                                transaction.outcomeAccount = that._accounts[_accounts[0]];
                            }
                            if (that._safe_accounts.hasOwnProperty(_accounts[0])) {
                                transaction.outcome = sum;
                                transaction.outcomeAccount = that._safe_accounts[_accounts[0]];
                            }
                        }
                        break;
                    case 'transfer_cash_in': // Зачисление межбанка || Начисление процентов
                        transaction.income = sum;
                        transaction.comment = operation.details;
                        if (operation.comment != null) {
                            transaction.comment += ': ' + operation.comment;
                        }

                        if (operation.merchant.id == 333) { // Начисление процентов
                            transaction.payee = 'Рокетбанк';
                        } else {
                            transaction.payee = null;
                        }
                        break;
                    case 'miles_cash_back': // Возврат за рокетрубли
                        transaction.income = sum;
                        transaction.payee = 'Рокетбанк';
                        break;
                    case 'open_deposit': // Открытие вклада
                        var _operation_found = false;

                        that._deposites_init_operations.map(function (depo_transaction) {
                            if (depo_transaction.outcome == 0 && depo_transaction.income == sum) {

                                if (dateFromTimestamp(depo_transaction.date) == dateFromTimestamp(transaction.date)) {
                                    depo_transaction.outcome = sum;
                                    depo_transaction.outcomeAccount = account;
                                    if (transaction.comment != null) {
                                        depo_transaction.comment += ': ' + transaction.comment;
                                    }

                                    _operation_found = true;
                                }
                            }

                            return depo_transaction;
                        });

                        if (_operation_found) {
                            continue;
                        } else {
                            transaction.income = sum;
                            transaction.incomeAccount = 'deposit#' + operation.money.currency_code;
                            transaction.outcome = sum;
                        }
                        break;
                    default:
                        delete operation['receipt_url']; // Do not log private info
                        ZenMoney.trace('Неизвестный тип транзакции: ' + JSON.stringify(operation));
                        throw new ZenMoney.Error('Неизвестный тип транзакции');
                }

                if (operation.location.latitude != null && operation.location.longitude != null) {
                    transaction.latitude = operation.location.latitude;
                    transaction.longitude = operation.location.longitude;
                }

                transactions.push(transaction);
            }
            if (data.pagination.current_page < data.pagination.total_pages) {
                return that.loadOperations(device, token, account, timestamp, page + 1, limit, transactions);
            }
        } else {
            ZenMoney.trace("Операции не найдены (всего операций " + data.pagination.total_count + ")");
        }
        return transactions;
    };

    function dateFromTimestamp(timestamp) {
        var d = new Date(timestamp * 1000);

        var curr_date = d.getDate();
        var curr_month = d.getMonth();
        curr_month++;
        var curr_year = d.getFullYear();

        var formated_date = curr_year + "-" + curr_month + "-" + curr_date;

        return formated_date
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
            "Отправляем запрос на регистрацию устройства " + depersonalize(device_id) + " (" + depersonalize(phone) + ")"
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
