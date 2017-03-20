var g_headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Charset': 'windows-1251,utf-8;q=0.7,*;q=0.3',
        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
        'Connection': 'keep-alive',
        'Origin': 'https://online.akbars.ru',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json'
    },
    g_baseurl = 'https://online.akbars.ru/wb/',
    g_preferences;

/**
 * Основной метод
 */
function main() {
    g_preferences = ZenMoney.getPreferences();
    login();
    processAccounts();

    processTransactions();
    ZenMoney.setResult({success: true});
}

/**
 * Авторизация
 */
function login() {
    if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
    if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);

    var html = ZenMoney.requestGet(g_baseurl + 'menu', g_headers);
    if (!html || ZenMoney.getLastStatusCode > 400) {
        ZenMoney.trace(html);
        throw new ZenMoney.Error('Ошибка при подключении к сайту интернет-банка! Попробуйте обновить данные позже.');
    }

    var url = ZenMoney.getLastUrl();

    var json;
    if (!/CARDS|ACCOUNTS/i.test(url)) {
        json = requestJson("api/v2/session", {}, {
            login: g_preferences.login,
            password: g_preferences.password
        });
    } else {
        ZenMoney.trace('Уже залогинены, используем существующую сессию');
    }
    return json;
}

var g_accounts = []; // линки активных счетов, по ним фильтруем обработку операций
/**
 * Обработка счетов
 */
function processAccounts() {
    ZenMoney.trace('Запрашиваем данные по счетам...');
    var accounts = requestJson("api/v2/contracts",
        {
            system: 'W4C'
        });
    ZenMoney.trace('Получено счетов: ' + accounts.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(accounts));

    var accDict = [];
    for (var i = 0; i < accounts.length; i++) {
        var a = accounts[i];
        if (isAccountSkipped(a.id)) {
            ZenMoney.trace('Пропускаем карту/счёт: ' + a.name + ' (#' + a.id + ')');
            continue;
        }

        // дебетовые карты ------------------------------------
        if (a.addData.CLASSIFICATION_FACTOR == 'DEBIT' && a.type == 'card' && a.card.status == 'active') {
            ZenMoney.trace('Добавляем дебетовую карту: ' + a.number + ' (#' + a.id + ')');
            var acc1 = {
                id: a.id,
                title: a.number,
                type: 'ccard',
                syncID: [],
                instrument: getInstrument(a.currency),
                balance: parseFloat(a.balances.available.value)
            };

            // номер карты
            acc1.syncID.push(a.number.substring(a.number.length - 4));

            if (acc1.syncID.length > 0) {
                // добавим ещё и номер счёта карты
                acc1.syncID.push(a.card.accountNumber.substring(a.card.accountNumber.length - 4));

                accDict.push(acc1);
                g_accounts.push(a.id);
            }
        }

        // счета ------------------------------------
        if (a.addData.CLASSIFICATION_FACTOR == 'DEBIT' && a.type == 'cardAccount' && a.cardAccount.status == 'active') {
            ZenMoney.trace('Добавляем счет: ' + a.cbsNumber + ' (#' + a.id + ')');
            var acc1 = {
                id: a.id,
                title: a.cbsNumber,
                type: 'checking',
                syncID: [],
                instrument: getInstrument(a.currency),
                balance: parseFloat(a.balances.available.value)
            };

            // номер счета
            acc1.syncID.push(a.cbsNumber.substring(a.cbsNumber.length - 4));
            if (acc1.syncID.length > 0) {
                accDict.push(acc1);
                g_accounts.push(a.id);
            }
        }
        // кредитные карты ----------------------------------------
        else if (a.addData.CLASSIFICATION_FACTOR == 'CREDIT' && a.type == 'credit' && a.card.status == 'active') {
            ZenMoney.trace('Добавляем кредитную карту: ' + a.number + ' (#' + a.id + ')');
            var creditLimit = a.balances.creditLimit.value;

            var acc2 = {
                id: a.id,
                title: a.number,
                type: 'ccard',
                syncID: [],
                instrument: getInstrument(a.currency),
                balance: a.balances.available.value - creditLimit
            };

            // номер карты
            acc2.syncID.push(a.number.substring(a.number.length - 4));

            if (acc2.syncID.length > 0) {
                // добавим ещё и номер счёта карты
                acc2.syncID.push(a.card.accountNumber.substring(a.card.accountNumber.length - 4));

                accDict.push(acc2);
                g_accounts.push(a.id);
            }
        }
    }

    ZenMoney.trace('Всего счетов добавлено: ' + accDict.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(accDict));
    ZenMoney.addAccount(accDict);
}

/**
 * Обработка операций
 * @param data
 */
function processTransactions(data) {

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

    ZenMoney.trace('Запрашиваем операции с ' + new Date(lastSyncTime).toLocaleString());

    var transactions = requestJson("api/v2/history", {
        "from": getFormattedDate('YYYY-MM-DD', new Date(lastSyncTime))
    });
    ZenMoney.trace('Получено операций: ' + transactions.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(transactions));

    var tranDict = {};      // список найденных оперций


    for (var i = 0; i < transactions.length; i++) {
        var t = transactions[i];
        var tran = {};
        var dt = new Date(t.operationTime);

        // работаем только по активным счетам
        if (!inArray(t.contractId, g_accounts))
            continue;

        // учитываем только успешные операции
        if (!t.status || t.status != 'success')
            continue;

        if (t.totalAmount.value == 0) {
            ZenMoney.trace('Пропускаем пустую операцию #' + i + ': ' + dt.toLocaleString() + ' - '
                + t.description + ' (' + tran.operationTime + ') ' + t.totalAmount.value);
            continue;
        }

        tran.date = getFormattedDate('DD.MM.YYYY', dt);

        ZenMoney.trace('Добавляем операцию #' + i + ': ' + dt.toLocaleString() + ' - '
            + t.description + ' (' + tran.date + ') ' + t.totalAmount.value);

        // доход ------------------------------------------------------------------

        if (t.totalAmount.value > 0) {
            tran.income = Math.abs(t.totalAmount.value);
            tran.incomeAccount = t.contractId;
            tran.outcome = 0;
            tran.outcomeAccount = tran.incomeAccount;

            // пополнение наличными
            if (t.merchantCategory == "Cash-out") {
                tran.outcomeAccount = "cash#" + getInstrument(t.totalAmount.currency);
                tran.outcome = Math.abs(t.totalAmount.value);
            }

            // операция в валюте
            if (t.totalAmount.currency != t.transAmount.currency) {
                tran.opIncome = Math.abs(t.transAmount.value);
                tran.opIncomeInstrument = getInstrument(t.transAmount.currency);
            }

            tran.comment = t.description;
            if (t.location) {
                t.payee = t.location.merchant;
            }
        }
        // расход -----------------------------------------------------------------
        else if (t.totalAmount.value < 0) {
            tran.outcome = Math.abs(t.totalAmount.value);
            tran.outcomeAccount = t.contractId;
            tran.income = 0;
            tran.incomeAccount = tran.outcomeAccount;

            // снятие наличных
            if (t.merchantCategory == "Cash-out") {
                tran.incomeAccount = "cash#" + getInstrument(t.totalAmount.currency);
                tran.income = Math.abs(t.totalAmount.value);
            }
            else {
                // получатель
                if (t.location && t.location.merchant)
                    tran.payee = t.location.merchant;
            }

            if (t.totalAmount.currency != t.transAmount.currency) {
                tran.opOutcome = Math.abs(t.transAmount.value);
                tran.opOutcomeInstrument = getInstrument(t.transAmount.currency);
            }

            tran.comment = t.description;
        }

        tran.id = t.id;

        // склеим переводы --------------------------------------------------------------
        var tranId = tran.id;

        // если ранее операция с таким идентификатором уже встречалась, значит это перевод
        if (tranDict[tranId] && tranDict[tranId].income == 0 && tran.income > 0) {
            tranDict[tranId].income = tran.income;
            tranDict[tranId].incomeAccount = tran.incomeAccount;

            if (tran.opIncome) {
                tranDict[tranId].opIncome = tran.opIncome;
                tranDict[tranId].opIncomeInstrument = tran.opIncomeInstrument;
            }
        }
        else if (tranDict[tranId] && tranDict[tranId].outcome == 0 && tran.outcome > 0) {
            tranDict[tranId].outcome = tran.outcome;
            tranDict[tranId].outcomeAccount = tran.outcomeAccount;

            if (tran.opOutcome) {
                tranDict[tranId].opOutcome = tran.opOutcome;
                tranDict[tranId].opOutcomeInstrument = tran.opOutcomeInstrument;
            }
        }
        else {
            tranDict[tranId] = tran;
        }

        if (dt.getTime() > lastSyncTime) {
            lastSyncTime = dt.getTime();
        }
    }

    ZenMoney.trace('Всего операций добавлено: ' + tranDict.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(tranDict));
    for (var k in tranDict)
        ZenMoney.addTransaction(tranDict[k]);

    ZenMoney.setData('last_sync', lastSyncTime);
    ZenMoney.saveData();
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
        var error = errorCodes[json._error.code];
        ZenMoney.trace("Ошибка: " + requestCode + ", " + error);
        if (error)
            throw new ZenMoney.Error(error);

        ZenMoney.trace(html);
        throw new ZenMoney.Error('Неизвестная ошибка вызова API. Сайт изменен?');
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
    if(!format)
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

String.prototype.replaceAll = function(replaces) {
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

/**
 * Поиск в массиве
 * @param needle
 * @param haystack
 * @returns {boolean}
 */
function inArray(needle, haystack) {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
        if (haystack[i] == needle) return true;
    }
    return false;
}



/**
 * Конвертация кода валюты в необходимый формат
 * @param code
 * @returns {string}
 */
function getInstrument(code) {
    return code == 'RUR' ? 'RUB' : code;
}

function n2(n) {
    return n < 10 ? '0' + n : '' + n;
}