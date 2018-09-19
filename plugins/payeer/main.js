var g_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:12.0) Gecko/20100101 Firefox/12.0",
    },
    g_baseurl = "https://payeer.com/ajax/api/api.php",
    g_preferences;

/**
 * Основной метод
 */
function main(){
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
    if (!g_preferences.apiId) throw new ZenMoney.Error("Введите API ID!", null, true);
    if (!g_preferences.apiPass) throw new ZenMoney.Error("Введите секретный ключ API!", null, true);

    ZenMoney.trace("Проверка авторизации.");
	
    var json = requestJson("", {}, {
        post: {
            account: g_preferences.login,
            apiId: g_preferences.apiId,
            apiPass: g_preferences.apiPass,
        },
    });
}

/**
 * Обработка счетов
 */
function processAccounts() {
    ZenMoney.trace("Запрашиваем данные по счетам...");
    var balance = requestJson("", {}, {
        post: {
            account: g_preferences.login,
            apiId: g_preferences.apiId,
            apiPass: g_preferences.apiPass,
            action:"balance",
        },
    });
    ZenMoney.trace("JSON: "+JSON.stringify(balance));

    var id = g_preferences.login.substring(1);

    if (isAccountSkipped(id)) {
        ZenMoney.trace("Пропускаем карту/счёт: "+ g_preferences.login+" RUB" +" (#"+ id +")");
        return;
    }

    ZenMoney.trace("Добавляем дебетовую карту: "+ g_preferences.login+" RUB" +" (#"+ id +")");
    var acc = {
        id:				id,
        title:			g_preferences.login+" RUB",
        type:			"ccard",
        syncID:			[],
        instrument:		"RUB",
        balance:		parseFloat(balance.balance.RUB.DOSTUPNO),
    };
    acc.syncID.push(id);
	
    ZenMoney.trace("JSON: "+ JSON.stringify(acc));
    ZenMoney.addAccount(acc);
}

/**
 * Обработка операций
 * @param data
 */
function processTransactions(data) {
    ZenMoney.trace("Запрашиваем данные по последним операциям...");
	
    var lastSyncTime = ZenMoney.getData("last_sync", 0);

    // первоначальная инициализация
    if (lastSyncTime == 0) {
        // по умолчанию загружаем операции за неделю
        var period = !g_preferences.hasOwnProperty("period") || isNaN(period = parseInt(g_preferences.period)) ? 7 : period;

        if (period > 31) period = 31;	// ограничение Payeer

        lastSyncTime = Date.now() - period*24*60*60*1000;
    }

    // всегда захватываем одну неделю минимум
    lastSyncTime = Math.min(lastSyncTime, Date.now() - 7*24*60*60*1000);

    ZenMoney.trace("Запрашиваем операции с "+ new Date(lastSyncTime).toLocaleString());

    var transactions = requestJson("", {}, {
        post: {
            account:	g_preferences.login,
            apiId:		g_preferences.apiId,
            apiPass:	g_preferences.apiPass,
            action:		"history",
            count:		100,
            from: 		getFormattedDate("YYYY-MM-DD", new Date(lastSyncTime)),
        },
    });

    if (transactions.history) {
        ZenMoney.trace("Операции не получены. Ответ банка: "+ JSON.stringify(transactions));
        return;
    }

    ZenMoney.trace("Получено операций: "+Object.keys(transactions.history).length);
    ZenMoney.trace("JSON: "+JSON.stringify(transactions.history));

    var tranDict = {}; // список найденных оперций
    var paymentsDict = {}; // список идентификаторов переводов

    for (var i = 0; i < Object.keys(transactions.history).length; i++) {
        var id = Object.keys(transactions.history)[i];
        var t = transactions.history[id];
        
        // учитываем только успешные операции
        if (t.status && t.status != "success")
            continue;

        // учитываем только RUB операции
        if (t.creditedCurrency && t.creditedCurrency != "RUB")
            continue;

        if (t.creditedAmount.value == 0) {
            ZenMoney.trace("Пропускаем пустую операцию #"+i+": "+ dt.toLocaleString() +" - "+ id+ " "+ t.type +" "+ t.creditedAmount +" "+t.creditedCurrency);
            continue;
        }

        var tran = {};
        var dt = new Date(t.date);
        tran.date = n2(dt.getDate())+"."+n2(dt.getMonth()+1)+"."+dt.getFullYear();

        ZenMoney.trace("Добавляем операцию #"+i+": "+ dt.toLocaleString() +" - "+ id+ " " + t.type+ " " + t.creditedAmount +" "+t.creditedCurrency);
        //ZenMoney.trace('JSON: '+JSON.stringify(t));

        if (t.type == "sci") {
            tran.outcome = parseFloat(t.creditedAmount);
            tran.outcomeAccount = t.from.substring(1);
            tran.income = 0;
            tran.incomeAccount = tran.outcomeAccount;
            tran.payee = t.shop.domain;
            tran.comment = t.shop.description;
        }
        if (t.type == "deposit") {
            tran.income = parseFloat(t.creditedAmount);
            tran.incomeAccount = t.from.substring(1);
            tran.outcome = 0;
            tran.outcomeAccount = tran.incomeAccount;
        }
        if (t.type == "transfer" && t.to != g_preferences.login) {
            tran.outcome = parseFloat(t.creditedAmount);
            tran.outcomeAccount = t.from.substring(1);
            tran.income = 0;
            tran.incomeAccount = t.from.substring(1);
        }
        if (t.type == "transfer" && t.to == g_preferences.login) {
            tran.outcome = 0;
            tran.income = parseFloat(t.creditedAmount);
            tran.incomeAccount = t.to.substring(1);
            tran.outcomeAccount = t.to.substring(1);
            tran.payee = t.from;
        }
        tran.id = t.id;
        tranDict[tran.id] = tran;
    }

    ZenMoney.trace("Всего операций добавлено: "+ Object.getOwnPropertyNames(tranDict).length);
    ZenMoney.trace("JSON: "+ JSON.stringify(tranDict));
    for (var k in tranDict)
        ZenMoney.addTransaction(tranDict[k]);

    ZenMoney.setData("last_sync", lastSyncTime);
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
        ZenMoney.trace("Bad json (" + e.message + "): " + html);
        throw new ZenMoney.Error("Сервер вернул ошибочные данные: " + e.message);
    }
}

/**
 * Выполнение запроса с получением JSON-результата
 * @param requestCode
 * @param data
 * @param parameters
 * @returns {*}
 */
function requestJson(requestCode, data, parameters) {
	
    var params = [];
    parameters || (parameters = {});

    if (data)
        for (var d in data) params.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));

    if (parameters.post)
        data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), parameters.post, g_headers);
    else {
        if (parameters) for (var k in parameters) params.push(encodeURIComponent(k) + "=" + encodeURIComponent(parameters[k]));
        data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), g_headers);
    }

    if (!data) {
        ZenMoney.trace("Пришёл пустой ответ во время запроса по адресу \""+ g_baseurl + requestCode + "\". Попытаемся ещё раз...");

        if (parameters.post)
            data = ZenMoney.requestPost(g_baseurl + requestCode + "?" + params.join("&"), parameters.post, g_headers);
        else {
            if (parameters) for (var k2 in parameters) params.push(encodeURIComponent(k2) + "=" + encodeURIComponent(parameters[k2]));
            data = ZenMoney.requestGet(g_baseurl + requestCode + "?" + params.join("&"), g_headers);
        }
    }
    data = getJson(data);
    if (data.auth_error == "1") {
        ZenMoney.trace("Ошибка: " + data.errors);
        throw new ZenMoney.Error((parameters.scope ? parameters.scope + ": " : "") + (data.errors));
    }
    return data
}

function n2(n) {
    return n < 10 ? "0" + n : String(n);
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
        format = "DD.MM.YYYY";

    var day = dt.getDate();
    var month = (dt.getMonth() + 1);
    var year = dt.getFullYear();

    return format.replaceAll([
        /DD/, n2(day), /D/, day,
        /MM/, n2(month), /M/, month,
        /YYYY/, year, /YY/, (String(year)).substring(2, 4),
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
    return Object.prototype.toString.call(arr) === "[object Array]";
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