/**
 * Начинаем синхронизацию
 *
 * @typedef {Object} ZenMoney
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
 *
 * @author Andrey Kolchenko <andrey@kolchenko.me>
 */
function RocketBank(ZenMoney) {
    /**
     * @type {Object.<String, String>}
     */
    this.accounts = {};
    /**
     * @type {Object.<String, String>}
     */
    this.cards = {};
    /**
     * @type {DepositTransaction[]}
     */
    this.deposits_operations = [];
    /**
     * @type {DepositTransaction[]}
     */
    this.deposits_percent = [];

    /**
     * Синхронизировать данные из Рокетбанка
     *
     * @returns {boolean}
     */
    this.sync = function () {
        var profile = this.loadProfile();

        this.fetchDeposits(profile.user.deposits);

        var accountsProcessed = this.fetchAccounts(profile.user.safe_accounts).every(this.processAccount, this);
        var cardsProcessed = this.fetchCards(profile.user.accounts).every(this.processAccount, this);
        var depositsProcessed = this.processDeposit();

        return accountsProcessed && cardsProcessed && depositsProcessed;
    };

    /**
     * Обрабатываем карты
     *
     * @param {Card[]} cards
     *
     * @return {String[]}
     */
    this.fetchCards = function (cards) {
        ZenMoney.trace("Загружаем список карт. Найдено карт: " + cards.length);

        return cards.map(function (card) {
            var record = {
                id: card.token,
                title: card.title,
                type: "ccard",
                instrument: card.currency,
                balance: card.balance,
                syncID: [card.pan.substr(-4)]
            };
            ZenMoney.trace("Обрабатываем карту: " + JSON.stringify(record));
            this.cards[card.title] = card.token;

            ZenMoney.addAccount(record);

            return card.token;
        }, this);
    };

    /**
     * Обрабатываем счета
     *
     * @param {Account[]} accounts
     *
     * @return {String[]}
     */
    this.fetchAccounts = function (accounts) {
        ZenMoney.trace("Обрабатываем список счетов. Найдено счетов: " + accounts.length);

        return accounts.map(function (account) {
            var record = {
                id: account.token,
                title: account.title,
                type: "checking",
                instrument: account.currency,
                balance: account.balance,
                syncID: [account.account_details.account.substr(-4)]
            };
            ZenMoney.trace("Обрабатываем счет: " + JSON.stringify(record));
            this.accounts[account.title] = account.token;

            ZenMoney.addAccount(record);

            return account.token;
        }, this);
    };

    /**
     * Обрабатываем вклады
     *
     * @param {Deposit[]} deposits
     *
     * @return {String[]}
     */
    this.fetchDeposits = function (deposits) {
        var that = this;

        ZenMoney.trace("Найдено вкладов: " + deposits.length);

        var accounts = [];
        deposits.forEach(function (account) {
            var account_id = hex_md5(account.id.toString());

            var deposit = {
                id: account_id,
                title: account.title,
                type: "deposit",
                syncID: [account.id.toString().substr(-4)],
                instrument: account.rocket_deposit.currency,
                balance: account.balance + account.percent,
                percent: account.rocket_deposit.rate,
                capitalization: true,
                startDate: account.start_date,
                endDateOffsetInterval: "month",
                endDateOffset: account.rocket_deposit.period,
                payoffInterval: "month",
                payoffStep: 1
            };
            try {
                ZenMoney.trace("Обрабатываем вклад: " + JSON.stringify(deposit));
                ZenMoney.addAccount(deposit);
            } catch (exception) {
                ZenMoney.trace("Не удалось добавить вклад: " + JSON.stringify(deposit));
            }

            accounts.push(account.id);

            var operations = [];

            var lastSync = getLastSyncTime(account.id.toString());

            account.statements.reverse().forEach(function (operation) {
                if (operation.date <= lastSync) {
                    var od = new Date(operation.date * 1000);

                    ZenMoney.trace("Транзакция уже была ранее обработана (" + od.toLocaleString() + ")");
                    return operations;
                }

                var sum = Math.abs(operation.amount);
                /**
                 * @class DepositTransaction
                 */
                var transaction = {
                    id: hex_md5(operation.date + "|" + operation.sum),
                    date: operation.date,
                    comment: operation.description,
                    outcome: 0,
                    outcomeAccount: account_id,
                    income: 0,
                    incomeAccount: account_id
                };
                switch (operation.kind) {
                    case "first_refill": // Первичное пополнение
                        transaction.income = sum;
                        that.deposits_operations.push(transaction);
                        break;
                    case "percent": // Проценты
                        transaction.income = sum;
                        transaction.payee = "Рокетбанк";
                        that.deposits_percent.push(transaction);
                        break;
                    default:
                        error("Неизвестный тип транзакции депозита", JSON.stringify(operation));
                }
            }, this);
        });

        return accounts;
    };

    /**
     * @param {String} account
     * @return {boolean}
     */
    this.processAccount = function (account) {
        var lastSync = getLastSyncTime(account);
        var dt = new Date(lastSync * 1000);

        ZenMoney.trace("Начинаем синхронизацию аккаунта " + account + " с даты " + dt.toLocaleString());

        var device = getDevice();
        var operations = this.loadOperations(device, getToken(device), account, lastSync);

        return operations.reverse().every(function (transaction) {
            ZenMoney.trace("Обрабатываем новую транзакцию: " + JSON.stringify(transaction));

            try {
                lastSync = Math.max(lastSync, transaction.date);
                ZenMoney.addTransaction(transaction);
                ZenMoney.setData("last_sync_" + account, lastSync);
                return true;
            } catch (exception) {
                ZenMoney.trace("Не удалось добавить транзакцию: " + JSON.stringify(transaction));
                return false;
            }
        });
    };

    /**
     * @return {boolean}
     */
    this.processDeposit = function () {
        ZenMoney.trace("Начинаем синхронизацию депозитов");

        var init = this.processDepositInternal(this.deposits_operations);
        var percent = this.processDepositInternal(this.deposits_percent);

        return init && percent;
    };

    /**
     * @param {DepositTransaction[]} transactions
     * @returns {boolean}
     */
    this.processDepositInternal = function (transactions) {
        return transactions.reverse().every(function (transaction) {
            ZenMoney.trace("Обрабатываем новую транзакцию: " + JSON.stringify(transaction));

            var account = transaction.incomeAccount;
            var lastSync = getLastSyncTime(account);

            try {
                lastSync = Math.max(lastSync, transaction.date);
                ZenMoney.addTransaction(transaction);
                ZenMoney.setData("last_sync_" + account, lastSync);
                return true;
            } catch (exception) {
                console.log(exception);
                ZenMoney.trace("Не удалось добавить транзакцию: " + JSON.stringify(transaction));
                return false;
            }
        });
    };

    /**
     * Загружаем профиль пользователя
     *
     * return {{user: {deposits: Object[], safe_accounts: Object[], accounts: Object[]}}}
     * @return {Profile}
     */
    this.loadProfile = function () {
        var device = getDevice();
        ZenMoney.trace("Загружаем профиль пользователя");
        var profile = requestProfile(device, getToken(device));

        if (!profile.hasOwnProperty("user")) {
            error("Не удалось загрузить список аккаунтов", JSON.stringify(profile));
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
        /**
         * @type {Profile}
         */
        var profile = request("GET", "/profile", null, device, token);
        if (profile.hasOwnProperty("response")) {
            if (profile.response.status == 401) {
                return requestProfile(device, getToken(device, true));
            } else {
                error("Не удалось загрузить профиль пользователя", profile.response.description);
            }
        }

        return profile;
    }

    /**
     * Получаем время последней синхронизации аккаунта
     *
     * @param {String} account
     *
     * @return {Number}
     */
    function getLastSyncTime(account) {
        var lastSyncTime = parseInt(ZenMoney.getData("last_sync_" + account, 0));

        // первоначальная инициализация
        if (lastSyncTime == 0) {
            var preferences = ZenMoney.getPreferences();
            var period = 7;
            // по умолчанию загружаем операции за неделю
            if (preferences.hasOwnProperty("period")) {
                period = parseInt(preferences.period) || period;
                // на всякий случай, ограничим лимит, а то слишком долго будет
                if (period > 100) {
                    period = 100;
                }
            }
            lastSyncTime = Math.floor(Date.now() / 1000) - period * 24 * 60 * 60;
        }

        return lastSyncTime;
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
        page = page || 1;
        limit = limit || 10;
        transactions = transactions || [];
        ZenMoney.trace("Запрашиваем список операций: страница " + page);
        /**
         * @type {Feed}
         */
        var data = request("GET", "/accounts/" + account + "/feed?page=" + page + "&per_page=" + limit, null, device, token);
        if (data.hasOwnProperty("response")) {
            if (data.response.status == 401) {
                return this.loadOperations(device, getToken(device, true), account, timestamp, page, limit, transactions);
            } else {
                error("Не удалось загрузить список операций", data.response.description);
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
                if (operation.status != "confirmed" && operation.status != "hold") {
                    ZenMoney.trace("Пропускаем операцию со статусом " + operation.status);
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
                    case "pos_spending": // Расход
                        if (operation.money.amount < 0) {
                            transaction.outcome = sum;
                        } else {
                            transaction.income = sum;
                        }
                        break;
                    case "atm_cash_out": // Снятие наличных
                        transaction.income = sum;
                        transaction.incomeAccount = "cash#" + operation.money.currency_code;
                        transaction.outcome = sum;
                        transaction.payee = null;
                        break;
                    case "atm_cash_in": // Пополнение наличными
                    case "office_cash_in":
                        transaction.income = sum;
                        transaction.outcome = sum;
                        transaction.outcomeAccount = "cash#" + operation.money.currency_code;
                        transaction.payee = null;
                        transaction.comment = getComment(operation);
                        break;
                    case "remittance": // Перевод (исходящий)
                    case "internal_cash_out": // Исходящий перевод внутри банка
                    case "internal_cash_out_request":
                        transaction.outcome = sum;
                        fillPayee(transaction, operation);
                        break;
                    case "card2card_cash_in": // Перевод с карты (входящий)
                    case "card2card_cash_in_other":
                    case "internal_p2p_in": // Пополнение по номеру карты
                        transaction.income = sum;
                        transaction.payee = null;
                        transaction.comment = getComment(operation);
                        break;
                    case "card2card_cash_out": // Исходящий перевод на карту
                        transaction.outcome = sum;
                        transaction.payee = null;
                        break;
                    case "card2card_cash_out_other": // Исходящий перевод внутри банка
                        transaction.outcome = sum;
                        break;
                    case "atm_commission":
                    case "commission": // Комиссия за операцию
                    case "rocket_fee": // Услуги банка
                    case "card_commission":
                        transaction.outcome = sum;
                        transaction.payee = "Рокетбанк";
                        transaction.comment = getComment(operation);
                        break;
                    case "internal_cash_in_request":
                        transaction.income = sum;
                        fillPayee(transaction, operation);
                        break;
                    case "internal_cash_in": // Входящий перевод внутри банка
                        transaction.income = sum;
                        transaction.comment = getComment(operation);

                        var pattern = " → ";
                        if (operation.details.indexOf(pattern) >= 0) {
                            var accounts = operation.details.split(pattern);

                            if (this.cards.hasOwnProperty(accounts[0])) {
                                transaction.outcome = sum;
                                transaction.outcomeAccount = this.cards[accounts[0]];
                            }
                            if (this.accounts.hasOwnProperty(accounts[0])) {
                                transaction.outcome = sum;
                                transaction.outcomeAccount = this.accounts[accounts[0]];
                            }
                        }
                        break;
                    case "transfer_cash_in": // Зачисление межбанка || Начисление процентов
                        transaction.income = sum;
                        transaction.comment = getComment(operation);

                        if (operation.merchant.id == 333) { // Начисление процентов
                            transaction.payee = "Рокетбанк";
                        } else {
                            transaction.payee = null;
                        }
                        break;
                    case "miles_cash_back": // Возврат за рокетрубли
                        transaction.income = sum;
                        transaction.payee = "Рокетбанк";
                        break;
                    case "emoney_payment":
                        transaction.outcome = sum;
                        break;
                    case "open_deposit": // Открытие вклада
                        var operation_found = false;

                        this.deposits_operations.map(function (transaction) {
                            if (transaction.outcome == 0 && transaction.income == sum) {

                                if (dateFromTimestamp(transaction.date) == dateFromTimestamp(transaction.date)) {
                                    transaction.outcome = sum;
                                    transaction.outcomeAccount = account;
                                    if (transaction.comment != null) {
                                        transaction.comment += ": " + transaction.comment;
                                    }

                                    operation_found = true;
                                }
                            }

                            return transaction;
                        });

                        if (operation_found) {
                            continue;
                        } else {
                            transaction.income = sum;
                            transaction.incomeAccount = "deposit#" + operation.money.currency_code;
                            transaction.outcome = sum;
                        }
                        break;
                    default:
                        delete operation["receipt_url"]; // Do not log private info
                        error("Неизвестный тип транзакции", JSON.stringify(operation));
                }

                if (operation.location.latitude != null && operation.location.longitude != null) {
                    transaction.latitude = operation.location.latitude;
                    transaction.longitude = operation.location.longitude;
                }

                transactions.push(transaction);
            }
            if (data.pagination.current_page < data.pagination.total_pages) {
                return this.loadOperations(device, token, account, timestamp, page + 1, limit, transactions);
            }
        } else {
            ZenMoney.trace("Операции не найдены (всего операций " + data.pagination.total_count + ")");
        }
        return transactions;
    };

    /**
     * Преобразуем timestamp в дату
     *
     * @param {Number} timestamp
     * @return {string}
     */
    function dateFromTimestamp(timestamp) {
        var date = new Date(timestamp * 1000);

        var curr_month = date.getMonth();
        // WTF??
        curr_month++;

        return date.getFullYear() + "-" + curr_month + "-" + date.getDate();
    }

    /**
     * Возвращает ID устройства
     *
     * @returns {string}
     */
    function getDevice() {
        var deviceId = ZenMoney.getData("device_id");
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
     * @param {String} device
     * @param {Boolean} [force_new=false]
     * @returns {string}
     */
    function getToken(device, force_new) {
        force_new = force_new || false;
        var token = ZenMoney.getData("token");
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
            if (!password) {
                error("Пароль не указан");
            }
            ZenMoney.trace("Пароль получен, отправляем запрос");
            var data = request(
                "GET",
                "/login?email=" + ZenMoney.getData("email") + "&password=" + password,
                null,
                device,
                null
            );
            if (!data.hasOwnProperty("token")) {
                error("Не удалось подтвердить телефон", data.response.description);
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
        var device = "zenmoney_" + hex_md5(Math.random().toString() + "_" + phone + "_" + Date.now());
        ZenMoney.trace(
            "Отправляем запрос на регистрацию устройства " + depersonalize(device) + " (" + depersonalize(phone) + ")"
        );
        /**
         * @type {Register}
         */
        var data = request("POST", "/devices/register", {phone: phone}, device, null);
        if (data.response.status == 200) {
            ZenMoney.trace(data.response.description);
        } else {
            error("Не удалось отправить код подтверждения", data.response.description);
        }
        verifyDevice(data.sms_verification.id, device);

        return device;
    }

    /**
     * Подтверждаем регистрацию устройства
     *
     * @param {String} verificationToken
     * @param {String} device
     */
    function verifyDevice(verificationToken, device) {
        var code = ZenMoney.retrieveCode(
            "Введите код подтверждения из смс для авторизации приложения в интернет-банке",
            null,
            {
                inputType: "numberDecimal",
                time: 18E4
            }
        );
        ZenMoney.trace("Получили код");
        /**
         * @type {Verification}
         */
        var data = request("PATCH", "/sms_verifications/" + verificationToken + "/verify", {code: code}, device, null);
        if (data.response.status == 200) {
            ZenMoney.trace(data.response.description);
        } else {
            error("Не удалось подтвердить телефон", data.response.description);
        }
        ZenMoney.setData("device_id", device);
        ZenMoney.setData("email", data.user.email);
    }

    /**
     * Получаем имя пользователя из объекта
     *
     * @param {Friend|null} friend
     * @return {String|null}
     */
    function getFriendName(friend) {
        var parts = [];
        if (friend.hasOwnProperty("first_name")) {
            parts.push(friend.first_name);
        }
        if (friend.hasOwnProperty("last_name")) {
            parts.push(friend.last_name);
        }
        return parts.length == 0 ? null : parts.join(" ");
    }

    /**
     * Заполняем информацию о плательщике
     *
     * @param {Object} transaction
     * @param {Operation} operation
     */
    function fillPayee(transaction, operation) {
        transaction.payee = operation.hasOwnProperty("friend") ? getFriendName(operation.friend) : null;
        if (!transaction.payee) {
            transaction.comment = getComment(operation);
        }
    }

    /**
     * Комментарий к операции
     *
     * @param {Operation} operation
     * @return {String}
     */
    function getComment(operation) {
        var comment = operation.details;
        if (operation.comment != null) {
            comment += ": " + operation.comment;
        }
        return comment;
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
            part += "*";
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
     * @param {String} [token]
     * @return {Object}
     */
    function request(method, url, data, device_id, token) {
        var baseUrl = "https://rocketbank.ru/api/v5";
        var response;
        if (!method || method.toUpperCase() === "GET") {
            response = ZenMoney.requestGet(baseUrl + url, getHeaders(device_id, token));
        } else {
            response = ZenMoney.request(method, baseUrl + url, data, getHeaders(device_id, token));
        }
        if (!response) {
            error("Неверный ответ с сервера", "[" + method + "] " + url);
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
            error("Сервер вернул ошибочные данные", e.message + ": " + data);
        }
    }

    /**
     * Формируем объект заголовков
     *
     * @param {String} device_id
     * @param {String} [token]
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

    /**
     * Гененируем ошибку
     *
     * @param {String} message
     * @param {String} [description]
     */
    function error(message, description) {
        if (description) {
            description = ": " + description;
        }
        ZenMoney.trace(message + description);
        throw new ZenMoney.Error(message);
    }
}
