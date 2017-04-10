var g_headers = {
        'Accept': 'application/vnd.qiwi.sso-v1+json',
        'Content-Type': 'application/json',
        'Accept-Encoding' : 'gzip, deflate, br',
        'Origin': 'https://qiwi.com',
        'Accept-Language': 'ru;q=0.8,en-US;q=0.6,en;q=0.4',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.132 Safari/537.36'
    },
    baseurlAuth = 'https://sso.qiwi.com/',
    baseurl = 'https://qiwi.com/',
    g_prefs;

var g_accounts = []; // линки активных счетов, по ним фильтруем обработку операций

/**
 * Основной метод
 */
function main() {
    ZenMoney.setDefaultCharset('utf-8');
    g_prefs = ZenMoney.getPreferences();

    login();
    processAccounts();
    processAccountTransactions();

    ZenMoney.setResult({success: true});
}

/**
 * Авторизация
 */
function login() {
    if (!g_prefs.login) throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
    if (!g_prefs.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);

    var html = ZenMoney.requestGet(baseurl + 'payment/main.action');

    var login = g_prefs.login;
    // Только для России
    if (/^\d{10}$/i.test(g_prefs.login)) {
        login = '+7' + g_prefs.login;
    } else if (!/^\s*\+/.test(g_prefs.login)) {
        login = '+' + g_prefs.login;
    }

    var response;
    try {
        response = requestAPI({
            action: 'cas/tgts',
            isAuth: true
        }, {
            login: login,
            password: g_prefs.password
        });
    } catch (e) {
        if (/робот|robot/i.test(e.message)) {
            // функционал ввода reCaptcha пока не поддерживается
            ZenMoney.trace('Киви затребовало капчу... Попробуйте сначала зайти в QIWI-кошелек ' + login + ' через браузер, ' +
                'потом снова проведите синхронизацию в Zenmoney');
        } else {
            throw e;
        }
    }

    response = requestAPI({
        action: 'cas/sts',
        isAuth: true
    }, {
        "ticket": response.entity.ticket,
        "service": baseurl + "j_spring_cas_security_check"
    });

    var html = ZenMoney.requestGet(baseurl + 'j_spring_cas_security_check?ticket=' + response.entity.ticket, addHeaders({'Referer': baseurl}));

    if (/Внимание! Срок действия вашего пароля истек/i.test(html)) {
        throw new ZenMoney.Error('Внимание! Срок действия вашего пароля истек. Зайдите в кошелек через браузер и следуйте инструкции.', null, true);
    }

    ZenMoney.trace('Успешно вошли...');

    return html;
}

/**
 * Обработка счетов
 */
function processAccounts() {
    var response = requestAPI({action: 'person/state.action'},
        {},
        {
            'Accept': 'application/json, text/javascript',
            'X-Requested-With': 'XMLHttpRequest'
        });

    var accDict = [];

    for (var currencyCode in response.data.balances) {

        var acc1 = {
            id: 'QIWI (' + response.data.person + ') ' + currencyCode,
            type: 'checking',
            syncID: [],
            instrument: currencyCode,
            balance: response.data.balances[currencyCode]
        };

        if (isAccountSkipped(acc1.id)) {
            ZenMoney.trace('Пропускаем карту/счёт: ' + acc1.id);
            continue;
        }

        acc1.title = acc1.id;
        acc1.syncID.push(acc1.id);
        accDict.push(acc1);
        g_accounts.push(acc1);
    }
    ZenMoney.trace('Всего счетов добавлено: ' + accDict.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(accDict));
    ZenMoney.addAccount(accDict);

    return response;
}

function processAccountTransactions() {
    var lastSyncTime = ZenMoney.getData('last_sync', 0);

    // первоначальная инициализация
    if (lastSyncTime == 0) {
        // по умолчанию загружаем операции за неделю
        var period = !g_prefs.hasOwnProperty('period') || isNaN(period = parseInt(g_prefs.period)) ? 7 : period;

        lastSyncTime = Date.now() - period * 24 * 60 * 60 * 1000;
    }

    // всегда захватываем одну неделю минимум
    lastSyncTime = Math.min(lastSyncTime, Date.now() - 7 * 24 * 60 * 60 * 1000);

    ZenMoney.trace('Запрашиваем операции с ' + new Date(lastSyncTime).toLocaleString());

    html = ZenMoney.requestGet(
        baseurl + 'report/list.action?daterange=true&start=' + getFormattedDate('DD.MM.YYYY', new Date(lastSyncTime)) + '&finish=' + getFormattedDate(), g_headers);

    var table = getElement(html, /<div class="reports">/i);

    if (!table) {
        ZenMoney.trace(html);
        ZenMoney.trace('Не удалось найти таблицу операций!');
        return;
    }

    var ops = getElements(table, /<div[^>]*class="[^"]*status_SUCCESS"/ig);

    ZenMoney.trace('Найдено транзакций: ' + ops.length);

    var currencys = {
        RUB: 'руб',
        USD: 'долл'
        // EUR: '€',
    };

    var tranDict = [];      // список найденных оперций
    for (var i = 0; i < ops.length; ++i) {
        var tran = {};

        var sum = getElements(ops[i], /<div[^>]*class="[^"]*cash"/ig);

        for (var j = 0; j < g_accounts.length; j++) {
            var account = g_accounts[j];

            if (new RegExp(currencys[account.instrument]).test(sum)) {
                tran.amount = parseBalance(sum);
                tran.date = getElement(ops[i], /DateWithTransaction[^>]*>((?:[\s\S]*?<\/span){2})/i, null, parseDate);
                tran.id = getElement(ops[i], /<div[^>]+class="transaction"[^>]*>/i, null, parseBalance);
                var isExpense = getElements(ops[i], /<div[^>]*class="[^"]*IncomeWithExpend income"[^>]*>/i).length != 0;
                var isIncome = getElements(ops[i], /<div[^>]*class="[^"]*IncomeWithExpend expenditure"[^>]*>/i).length != 0;

                if (isIncome) {
                    tran.income = Math.abs(tran.amount);
                    tran.incomeAccount = account.id;
                    tran.outcome = 0;
                    tran.outcomeAccount = tran.incomeAccount;
                } else if (isExpense) {
                    tran.outcome = Math.abs(tran.amount);
                    tran.outcomeAccount = account.id;
                    tran.income = 0;
                    tran.incomeAccount = tran.outcomeAccount;
                }
                tranDict.push(tran);
                break;
            }
        }

        if (tran.date > lastSyncTime) {
            lastSyncTime = tran.date;
        }

    }
    ZenMoney.trace('Всего операций добавлено: ' + tranDict.length);
    ZenMoney.trace('JSON: ' + JSON.stringify(tranDict));
    ZenMoney.addTransaction(tranDict);

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
 actionObj - объект с полями:
 action - url
 isAuth - флаг проверки авторизации
 */
function requestAPI(actionObj, params, addOnHeaders) {
    var info = ZenMoney.requestPost(actionObj.isAuth ? baseurlAuth + actionObj.action : baseurl + actionObj.action, JSON.stringify(params), addOnHeaders ? addHeaders(g_headers, addOnHeaders) : g_headers);
    ZenMoney.trace('Request result: ' + info);

    var response = getJson(info);

    // Проверка ошибки входа
    if (actionObj.isAuth) {
        if (!response.entity || !response.entity.ticket) {
            if (response.entity) {
                var error = response.entity.error.message;
                if (error)
                    throw new ZenMoney.Error(error, null, true);
            }
            ZenMoney.trace(info);
            throw new ZenMoney.Error('Не удалось войти в Qiwi Visa Wallet, сайт изменен?');
        }

    } else {
        if (!response.data) {
            var error = response.message;
            if (error)
                throw new ZenMoney.Error('Сайт qiwi.ru сообщает: ' + error + '. Попробуйте обновить данные позже.');

            ZenMoney.trace(info);
            throw new ZenMoney.Error('Ошибка при обработке запроса к API!');
        }

    }

    return response;
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