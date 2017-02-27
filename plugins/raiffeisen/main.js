/**
 * @author Ilnaz Fazliakhmetov <ilnaz94@gmail.com>
 */

var g_headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Charset': 'utf-8;q=0.7,*;q=0.3',
        'Accept-Language': 'ru,en;q=0.8',
        'Connection': 'keep-alive',
        'Origin': 'https://online.raiffeisen.ru',
        'Host': 'online.raiffeisen.ru',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'DNT': 1,
        'Referer': 'https://online.raiffeisen.ru/'
    },
    g_baseurl = 'https://online.raiffeisen.ru/',
    g_preferences;

var g_accounts = {}; // линки активных счетов, по ним фильтруем обработку операций

/**
 * Основной метод
 */
function main() {
    ZenMoney.setDefaultCharset('utf-8');
    g_preferences = ZenMoney.getPreferences();
    login();
    processAccountsApi();
    processTransactions();
    ZenMoney.setResult({success: true});
}

/**
 * Авторизация
 */
function login() {
    if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
    if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);

    var json = ZenMoney.requestGet(g_baseurl + "security/heartbeat", g_headers);
    if (!json) {
        json = requestJson("login", {}, {
            captcha: '',
            username: g_preferences.login,
            password: g_preferences.password,
            uiVersion: 'RC3.0-GUI-1.14.4-prod'
        });
    }

    return json;
}


/**
 * Обработка счетов
 */
function processAccountsApi() {
    processCards();
    processAccounts();
}

/**
 * Обработка банковских карт
 */
function processCards() {
    ZenMoney.trace('Запрашиваем данные по картам...');
    var accounts = requestJson("rest/card");
    ZenMoney.trace('Получено карт: ' + accounts.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(accounts));

    var accDict = [];

    for (var i = 0; i < accounts.length; i++) {
        var a = accounts[i];

        if (isAccountSkipped(a.id)) {
            ZenMoney.trace('Пропускаем карту/счёт: ' + a.name + ' (#' + a.id + ')');
            continue;
        }

        // дебетовые карты ------------------------------------
        if (a.type.id == 1 && a.type.name == 'Дебетовая карта' && a.status.id == 0) {
            ZenMoney.trace('Добавляем дебетовую карту: ' + a.pan + ' (#' + a.id + ')');
            var acc1 = {
                id: a.id.toString(),
                title: a.product,
                type: 'ccard',
                syncID: [],
                instrument: a.currency.shortName,
                balance: a.balance
            };

            // номер карты
            acc1.syncID.push(a.pan.substring(a.pan.length - 4));

            if (acc1.syncID.length > 0) {
                // добавим ещё и номер счёта карты
                acc1.syncID.push(a.cba.substring(a.cba.length - 4));

                accDict.push(acc1);
                g_accounts[a.id.toString()] = acc1;
            }
        }
    }


    ZenMoney.trace('Всего карт добавлено: ' + accDict.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(accDict));
    ZenMoney.addAccount(accDict);

}

/**
 * Обработка банковских счетов
 */
function processAccounts() {
    ZenMoney.trace('Запрашиваем данные по счетам...');
    var accounts = requestJson("rest/account");
    ZenMoney.trace('Получено счетов: ' + accounts.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(accounts));

    var accDict = [];

    for (var i = 0; i < accounts.length; i++) {
        var a = accounts[i];

        if (isAccountSkipped(a.id)) {
            ZenMoney.trace('Пропускаем карту/счёт: ' + a.cba + ' (#' + a.id + ')');
            continue;
        }

        // обрабатываем только активные счета
        if (a.status.id == 1) {
            ZenMoney.trace('Добавляем счет: ' + a.cba + ' (#' + a.id + ')');
            var acc = {
                id: a.id.toString(),
                title: a.cba,
                type: 'checking',
                syncID: [],
                instrument: a.currency.shortName,
                balance: a.balance
            };

            // если счет оказался накопительным
            if (a.rate > 0) {
                acc.savings = true;
                acc.type = 'deposit';
                acc.percent = a.rate;
                acc.capitalization = true;
                acc.startDate = a.open.substr(0, 10);
                acc.endDateOffsetInterval = 'year';
                acc.endDateOffset = 1;
                acc.payoffInterval = 'month';
                acc.payoffStep = 1;
            }

            // номер счета
            acc.syncID.push(a.cba.substring(a.cba.length - 4));
            if (acc.syncID.length > 0) {
                accDict.push(acc);
                g_accounts[a.id.toString()] = acc;
            }
        }
    }

    ZenMoney.trace('Всего счетов добавлено: ' + accDict.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(accDict));
    ZenMoney.addAccount(accDict);
}

/**
 * Обработка операций
 */
function processTransactions() {

    ZenMoney.trace('Запрашиваем данные по последним операциям...');

    var lastSyncTime = ZenMoney.getData('last_sync', 0);

    // первоначальная инициализация
    if (lastSyncTime == 0) {
        // по умолчанию загружаем операции за неделю
        var period = !g_preferences.hasOwnProperty('period') || isNaN(period = parseInt(g_preferences.period)) ? 7 : period;

        lastSyncTime = Date.now() - period * 24 * 60 * 60 * 1000;
    }

    // всегда захватываем одну неделю минимум
    lastSyncTime = Math.min(lastSyncTime, Date.now() - 7 * 24 * 60 * 60 * 1000);
    var newSyncTime = 0;

    ZenMoney.trace('Запрашиваем операции с ' + new Date(lastSyncTime).toLocaleString());


    var tranDict = [];      // список найденных оперций

    for (var accID in g_accounts) {

        var acc = g_accounts[accID];
        var transactions = loadOperations(accID, lastSyncTime);

        ZenMoney.trace('Получено операций по счету #' + accID + ': ' + transactions.length);
        ZenMoney.trace('JSON: ' + JSON.stringify(transactions));

        for (var i = 0; i < transactions.length; i++) {
            var t = transactions[i];
            var tran = {};
            var dt = new Date(t.date);

            if (t.amount == 0) {
                ZenMoney.trace('Пропускаем пустую операцию #' + i + ': ' + dt.toLocaleString() + ' - '
                    + t.note + ' (' + tran.date + ') ' + t.amount);
                continue;
            }

            tran.date = getFormattedDate('YYYY-MM-DD', dt);

            ZenMoney.trace('Добавляем операцию #' + i + ': ' + dt.toLocaleString() + ' - '
                + t.note + ' (' + tran.date + ') ' + t.amount);

            // доход ------------------------------------------------------------------

            if (t.amount > 0) {
                tran.income = Math.abs(t.amount);
                tran.incomeAccount = accID;
                tran.outcome = 0;
                tran.outcomeAccount = tran.incomeAccount;

                // пополнение наличными
                if (t.merchant == "Cash-out") {
                    tran.outcomeAccount = "cash#" + t.currency.shortName;
                    tran.outcome = Math.abs(t.amount);
                }

                // операция в валюте
                if (t.billCurrencyId != t.currencyId) {
                    tran.opIncome = Math.abs(t.billAmount);
                    tran.opIncomeInstrument = t.billCurrency.shortName;
                }

                tran.comment = t.note;
                if (t.merchant) {
                    t.payee = t.merchant.trim();
                }
            }
            // расход -----------------------------------------------------------------
            else if (t.amount < 0) {
                tran.outcome = Math.abs(t.amount);
                tran.outcomeAccount = accID;
                tran.income = 0;
                tran.incomeAccount = tran.outcomeAccount;

                // снятие наличных
                if (t.merchant == "Cash-out") {
                    tran.incomeAccount = "cash#" + t.currency.shortName;
                    tran.income = Math.abs(t.amount);
                }
                else {
                    // получатель
                    if (t.merchant)
                        tran.payee = t.merchant.trim();
                }

                // операция в валюте
                if (t.billCurrencyId != t.currencyId) {
                    tran.opOutcome = Math.abs(t.billAmount);
                    tran.opOutcomeInstrument = t.billCurrency.shortName;
                }

                tran.comment = t.note;
            }

            // id транзакции не предоставлено
            //tran.id = t.id;

            tranDict.push(tran);
            if (dt.getTime() > newSyncTime) {
                newSyncTime = dt.getTime();
            }
        }

    }

    ZenMoney.trace('Всего операций добавлено: ' + Object.getOwnPropertyNames(tranDict).length);
    ZenMoney.trace('JSON: ' + JSON.stringify(tranDict));
    ZenMoney.addTransaction(tranDict);

    ZenMoney.setData('last_sync', newSyncTime);
    ZenMoney.saveData();
}

/**
 * Порционная загрузка операций по счету
 * @param accountId
 * @param timestamp
 * @param page
 * @param limit
 * @param transactions
 * @returns {*}
 */
function loadOperations(accountId, timestamp, page, limit, transactions) {
    page = page || 0;
    limit = limit || 20;
    transactions = transactions || [];
    ZenMoney.trace("Запрашиваем список операций: страница " + page);
    var account = g_accounts[accountId];

    // какой именно API вызывать зависит от типа счета
    var accType;
    switch (account.type) {
        case 'ccard':
            accType = 'card';
            break;
        case 'checking':
            accType = 'account';
            break;
        case 'deposit' :
            // операции накопительных счетов вытягиваются как и для обычного счета
            accType = (account.savings) ? 'account' : 'deposit';
            break;
        default:
            accType = g_accounts[accountId].type;
    }

    var data = requestJson('rest/' + accType + '/' + accountId + '/transaction', {
        'from': getFormattedDate('YYYY-MM-DD', new Date(timestamp)),
        'sort': 'date',
        'order': 'asc',
        'page':page,
        'size':limit
    });

    transactions = transactions.concat(data.list);

    if ((page+1) * limit < data.total) {
        return loadOperations(accountId, timestamp, page + 1, limit, transactions);
    }

    return transactions;
}

/**
 * Проверить не игнорируемый ли это счёт
 * @param id
 */
function isAccountSkipped(id) {
    return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}

/**
 * Обработка JSON-строки в объект
 * @param html
 */
function getJson(html) {
    try {
        return JSON.parse(html);
    } catch (e) {
        ZenMoney.trace('Bad json (' + e.message + '): ' + html);
        throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message);
    }
}

/**
 * Выполнение запроса с получением JSON-результата
 * @param requestCode
 * @param urlparams
 * @param postBody
 * @returns {*}
 */
function requestJson(requestCode, urlparams, postBody) {
    var params = [];

    if (urlparams)
        for (var d in urlparams) params.push(encodeURIComponent(d) + "=" + encodeURIComponent(urlparams[d]));

    var data;

    if (postBody)
        data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), postBody, g_headers);
    else {
        if (postBody) for (var k in postBody) params.push(encodeURIComponent(k) + "=" + encodeURIComponent(postBody[k]));
        data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), g_headers);
    }
    if (!data) {
        ZenMoney.trace('Пришёл пустой ответ во время запроса по адресу "' + g_baseurl + requestCode + '". Попытаемся ещё раз...');

        if (postBody)
            data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), postBody, g_headers);
        else {
            if (postBody) for (var k2 in postBody) params.push(encodeURIComponent(k2) + "=" + encodeURIComponent(postBody[k2]));
            data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), g_headers);
        }
    }

    var json = getJson(data);

    if (json._error) {
        var error = json._error.code;
        ZenMoney.trace("Ошибка: " + requestCode + ", " + error);
        if (error)
            throw new ZenMoney.Error(error);

        AnyBalance.trace(html);
        throw new AnyBalance.Error('Неизвестная ошибка вызова API. Сайт изменен?');
    }
    return json;
}

/**
 * Форматирование даты под шаблон
 * @param format формат даты, например, 'YYYY-MM-DD'
 * @param dt
 * @returns {*}
 */
function getFormattedDate(format, dt) {
    if (!dt)
        dt = new Date();
    if (!format)
        format = 'DD.MM.YYYY';

    var day = dt.getDate();
    var month = (dt.getMonth() + 1);
    var year = dt.getFullYear();

    return format.replaceAll([
        /DD/, n2(day), /D/, day,
        /MM/, n2(month), /M/, month,
        /YYYY/, year, /YY/, (year + '').substring(2, 4)
    ]);
}

String.prototype.replaceAll = function (replaces) {
    var value = this, i;
    for (i = 0; replaces && i < replaces.length; ++i) {
        if (isArray(replaces[i])) {
            value = value.replaceAll(replaces[i]);
        } else {
            value = value.replace(replaces[i], replaces[i + 1]);
            ++i; //Пропускаем ещё один элемент, использованный в качестве замены
        }
    }
    return value.valueOf();
};


function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
}

function n2(n) {
    return n < 10 ? '0' + n : '' + n;
}