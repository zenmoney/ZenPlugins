function main() {
    var appSettings = ZenMoney.getPreferences();
    if (!appSettings.login) throw new ZenMoney.Error("Введите логин для входа в интернет-банк.", null, true);
    if (!appSettings.password) throw new ZenMoney.Error("Введите пароль для входа в интернет-банк.", null, true);

    var sessionId = login(appSettings.login, appSettings.password);
    if (!sessionId)
        throw ZenMoney.Error('Не удалось авторизоваться');

    var accountItems = getAccounts(sessionId);
    if (isNullOrEmpty(accountItems))
        throw ZenMoney.Error('Не удалось загрузить список счетов');

    var accounts = parseAccounts(accountItems);
    addAccounts(accounts);

    var transactions = getTransactions(sessionId);
    if (isNullOrEmpty(transactions))
        return;

    var zenTransactions = parseTransactions(accounts, transactions);
    addTransactions(zenTransactions);

    ZenMoney.saveData();
    ZenMoney.setResult({ success: true });
}

function getDeviceId() {
    var deviceId = ZenMoney.getData('deviceId');
    if (!deviceId) {
        deviceId = newGuid();
        ZenMoney.setData('deviceId', deviceId);
    }
}

function login(login, password) {
    var loginRequest = {
        T: "rt_2Auth.CL",
        A: login,
        B: password,
        DeviceId: getDeviceId(),
        MobDevice: "apple",
        MobModel: "iPhone 5s (model A1457, A1518, A1528 (China), A1530 | Global)",
        MobOS: "iPhone OS 10.2.1",
        Console: "iphone",
        TIC: 1,
        L: "RUSSIAN",
        Scale: 2.000000,
        MODE: "NEW",
        appversion: "2.18.23.1"
    };

    var loginResponse = ZenMoney.requestPost(BASE_URL, loginRequest, defaultHeaders);

    var jsonResponse = xml2json(loginResponse);
    for (var i = 0; i < jsonResponse.length; i++) {
        var item = jsonResponse[i];
        if (item.name != "information")
            continue;

        return item.properties.value;
    }
}

function isAccountSkipped(accountId) {
    return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(accountId);
}

function getAccounts(sessionId) {
    var request = {
        T: 'RT_iphone_1common.start',
        Console: 'iphone',
        TIC: 0,
        SID: sessionId,
        L: 'RUSSIAN',
        Scale: '2.000000',
        MODE: 'NEW',
        appversion: '2.18.23.1'
    };

    var responseXml = ZenMoney.requestPost(BASE_URL, request, defaultHeaders);
    return xml2json(responseXml);
}

function parseAccounts(json) {
    try {
        var foundAccounts = [];
        for (var i = 0; i < json.length; i++) {
            var node = json[i];

            var account = node.properties;
            if (node.name == "card") {
                foundAccounts.push({
                    id: account.account,
                    title: account.name,
                    type: 'ccard',
                    balance: parseFloat(account.ownfunds),
                    syncID: [account.id],
                    instrument: account.iso
                });
            }
            else if (node.name == "account") {
                foundAccounts.push({
                    id: account.number,
                    title: account.name,
                    type: 'checking',
                    balance: parseFloat(account.rest),
                    syncID: [account.number.substring(account.number.length - 4)],
                    instrument: account.iso
                });
            }
        }

        return foundAccounts;
    }
    catch (e) {
        ZenMoney.trace(`Exception: ${e}`);
        throw ZenMoney.Error('Не удалось разобрать список счетов.');
    }
}

function addAccounts(accounts) {
    var filteredAccounts = accounts.filter(e => !isAccountSkipped(e.id));
    ZenMoney.addAccount(filteredAccounts);
    ZenMoney.trace('Всего счетов добавлено: ' + filteredAccounts.length);
}

function getTransactions(sessionId) {
    var lastSyncDate = getLastSyncDate();
    var startDate = getDateString(new Date(lastSyncDate));
    var endDate = getDateString(new Date());

    var getHistoryRequest = {
        T: "rt_iphone_1Common.FORM",
        SCHEMENAME: "history",
        STM: 1,
        Datewith: startDate,
        DateOn: endDate,
        Console: "iphone",
        TIC: 0,
        SID: sessionId,
        L: "RUSSIAN",
        Scale: '2.000000',
        MODE: "NEW",
        appversion: "2.18.23.1"
    };

    var xml = ZenMoney.requestPost(BASE_URL, getHistoryRequest, defaultHeaders);
    return xml2json(xml);
}

function parseTransactions(accounts, json) {
    try {
        var transactions = [];
        for (var i = 0; i < json.length; i++) {
            var node = json[i];
            var item = node.properties;
            var tran;

            // в stmitem'ах содержится полная история операций
            // в том числе и те, что в статусе HOLD
            // поэтому итерируемся только по ним
            if (node.name != 'stmitem')
                continue;

            var accountId = getCardId(item.card);
            var account = accounts.find(e => e.id == accountId);

            if (!account)
                continue;

            var operationAmount = parseFloat(item.amount);
            var accountAmount = parseFloat(item.cardAmount);

            tran = {};            
            tran.id = `${accountId}_${item.date}_${item.amount}`;

            tran.date = item.date;
            if (operationAmount > 0) {
                tran.income = accountAmount,
                tran.incomeAccount = accountId;
                tran.outcome = 0;
                tran.outcomeAccount = accountId;
                tran.payee = item.name;

                // операция в валюте
                if (account.instrument != item.iso) {
                    tran.opIncome = operationAmount;
                    tran.opIncomeInstrument = item.iso;
                }
            }
            else {
                tran.outcome = -accountAmount;
                tran.outcomeAccount = accountId;
                tran.income = 0;
                tran.incomeAccount = accountId;
                tran.comment = item.paymentPurpose;
                tran.payee = item.contragentName;
                tran.opOutcomeInstrument = item.iso;

                // операция в валюте
                if (account.instrument != item.iso) {
                    tran.opOutcome = -operationAmount;
                }
            }

            transactions.push(tran);
        }

        return transactions;
    }
    catch (e) {
        ZenMoney.trace(`Exception: ${e}`);
        throw ZenMoney.Error('Ошибка при обработке транзакций');
    }
}

function addTransactions(transactions) {
    var lastSyncDate = getLastSyncDate();

    for (var i = 0; i < transactions.length; i++) {
        var tran = transactions[i];

        if (tran) {
            ZenMoney.addTransaction(tran);
            ZenMoney.trace(`Добавлена транзакция ${tran.id}`);

            var tranTime = parseDate(tran.date).getTime();
            if (tranTime > lastSyncDate) {
                lastSyncDate = tranTime;
            }
        }
    }

    ZenMoney.setData('last_sync', lastSyncDate);
}

function getLastSyncDate() {
    var lastSyncDate = ZenMoney.getData('last_sync', 0);
    var now = Date.now();

    if (lastSyncDate == 0)
        lastSyncDate = now - FIRST_SYNC_PERIOD * 24 * 60 * 60 * 1000;

    return Math.min(lastSyncDate, Date.now() - 7 * 24 * 60 * 60 * 1000);
}