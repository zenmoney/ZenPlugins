var g_headers = {
    "Connection": "close",
    "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 5.1; m2 Build/LMY47D) Android/3.16.0(443)",
    "Content-Type": "text/xml;charset=UTF-8",
    "Host": "connect.raiffeisen.ru",
    "Accept-Encoding": "gzip"
},
    g_envelope = "\
        <soapenv:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://entry.rconnect/xsd\" xmlns:ser=\"http://service.rconnect\" xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:soapenc=\"http://schemas.xmlsoap.org/soap/encoding/\">\
        <soapenv:Header />\
        <soapenv:Body>\
        </soapenv:Body>\
        </soapenv:Envelope>",
    g_baseUrl = 'https://connect.raiffeisen.ru/Mobile-WS/services/',
    g_authSer = 'RCAuthorizationService',
    g_cardSer = 'RCCardService',
    g_accSer = 'RCAccountService',
    g_loanSer = 'RCLoanService',
    g_depositSer = 'RCDepositService',
    g_accounts = [],
    g_loans = [],
    g_preferences,
    g_isSuccessful = true;

/**
* Основной метод
*/
function main() {
    g_preferences = ZenMoney.getPreferences();

    openSession();
    try {
        processAccounts();
        processTransactions();
        processLoanPayments();
    }
    catch (exception) {
        ZenMoney.trace('Что-то пошло не так:');
        ZenMoney.trace(exception.message);
        closeSession();
        throw exception;
    }
    closeSession();

    ZenMoney.setResult({ success: g_isSuccessful });
}

/**
* Открывает рабочую сессию с сервером
*/
function openSession() {
    ZenMoney.trace('Открываем сессию');
    if (!g_preferences.login) throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
    if (!g_preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);
    requestSession(g_preferences.login, g_preferences.password);
}

/**
* Закрывает сессию
*/
function closeSession() {
    ZenMoney.trace('Закрываем сессию');
    var nodeCloseSession = new marknote.Element('ser:CloseSession');

    var converter = new marknote.Parser();
    var doc = converter.parse(g_envelope);
    var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
    nodeBody.addChildElement(nodeCloseSession);

    var data = ZenMoney.requestPost(g_baseUrl + g_authSer, doc.toString(), g_headers);
}

/**
* Авторизация
*/
function requestSession(login, password) {
    ZenMoney.trace('Авторизуемся на сервере...');
    var nodeLogin = new marknote.Element('login');
    nodeLogin.setText(login);
    var nodePassword = new marknote.Element('password');
    nodePassword.setText(password);
    var nodeCredentials = new marknote.Element('ser:login');
    nodeCredentials.addChildElement(nodeLogin);
    nodeCredentials.addChildElement(nodePassword);

    var converter = new marknote.Parser();
    var doc = converter.parse(g_envelope);
    var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
    nodeBody.addChildElement(nodeCredentials);

    var response = ZenMoney.requestPost(g_baseUrl + g_authSer, doc.toString(), g_headers);
    var docResponse = converter.parse(response);
    //ZenMoney.trace(docResponse.toString());
    var nodeReply = docResponse.getRootElement().getChildElement('soap:Body');
    var nodeFault = nodeReply.getChildElement('faultstring');
    if (nodeFault != null) {
        
      essful = false;
        if (nodeFault.getText() == 'logins.password.incorrect')
            throw 'Неверный логин или пароль';
        else
            throw nodeFault.getText();
    }
}

/**
* Обработка счетов
*/
function processAccounts() {
    requestCards();
    requestAccounts();
    requestLoans();
    requestDeposits();
}

/**
* Запрос и обработка карт
*/
function requestCards() {
    ZenMoney.trace('Запрашиваем данные по картам...');
    var nodeGetCards = new marknote.Element('ser:GetCards');
    var converter = new marknote.Parser();
    var doc = converter.parse(g_envelope);
    var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
    nodeBody.addChildElement(nodeGetCards);

    var cards = ZenMoney.requestPost(g_baseUrl + g_cardSer, doc.toString(), g_headers);

    var docCards = converter.parse(cards);
    var nodeCards = docCards.getRootElement().getChildElement('soap:Body').getChildElement('ns2:GetCardsResponse').getChildElements();
    ZenMoney.trace('Получено карт: ' + nodeCards.length);

    for (var i = 0; i < nodeCards.length; i++) {
        var nodeCard = nodeCards[i];

        var cardNum = nodeCard.getChildElement('number').getText();
        cardNum = cardNum.substr(cardNum.length - 4, 4);
        if (isAccountSkipped(cardNum)) {
            ZenMoney.trace('Пропускаем карту: ' + cardNum);
            continue;
        }

        var accNum = nodeCard.getChildElement('accountNumber').getText();
        accNum = accNum.substr(accNum.length - 4, 4);

        // for now requesting credit limit is unclear,
        // so both credit and debet cards are processed the same way
        var isCreditCard = false;
        if (nodeCard.getChildElement('accountType').getText() == '3')
            isCreditCard = true;

        var zenAccount = {
            id: 'card:' + nodeCard.getChildElement('id').getText(),
            title: 'card:' + nodeCard.getChildElement('id').getText(),
            syncID: [],
            instrument: nodeCard.getChildElement('currency').getText(),
            type: 'ccard',
            balance: Number(nodeCard.getChildElement('balance').getText()),
        };
        zenAccount.syncID.push(cardNum);
        zenAccount.syncID.push(accNum);

        ZenMoney.addAccount(zenAccount);
        ZenMoney.trace('Добавлена карта: ' + JSON.stringify(zenAccount));
    }
}

/**
* Запрос и обработка счетов
*/
function requestAccounts() {
    ZenMoney.trace('Запрашиваем данные по счетам...');
    var nodeGetAccounts = new marknote.Element('ser:GetAccounts');
    var converter = new marknote.Parser();
    var doc = converter.parse(g_envelope);
    var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
    nodeBody.addChildElement(nodeGetAccounts);

    var accounts = ZenMoney.requestPost(g_baseUrl + g_accSer, doc.toString(), g_headers);

    var docAccounts = converter.parse(accounts);
    var nodeAccount = docAccounts.getRootElement().getChildElement('soap:Body').getChildElement('ns2:GetAccountsResponse').getChildElements();
    ZenMoney.trace('Получено счетов: ' + nodeAccount.length);

    for (var i = 0; i < nodeAccount.length; i++) {
        var nodeAcc = nodeAccount[i];
        var accNum = nodeAcc.getChildElement('number').getText();
        accNum = accNum.substr(accNum.length - 4, 4);

        var isClosed = false;
        if (nodeAcc.getChildElement('closeDate') != undefined)
            if (nodeAcc.getChildElement('closeDate').getText().length() != 0)
                isClosed = true;

        if (isClosed || isAccountSkipped(accNum)) {
            ZenMoney.trace('Пропускаем счёт: ' + accNum);
            continue;
        }

        var isSaving = false;
        try {
            if (nodeAcc.getChildElement('accountSubtype').getText() == 'SAVING')
                isSaving = true;
        }
        catch (exception) { }

        var zenAccount = {
            id: 'account:' + nodeAcc.getChildElement('id').getText(),
            title: 'account:' + nodeAcc.getChildElement('id').getText(),
            syncID: accNum,
            instrument: nodeAcc.getChildElement('currency').getText(),
            type: 'checking',
            balance: Number(nodeAcc.getChildElement('balance').getText()),
            savings: isSaving
        };

        ZenMoney.addAccount(zenAccount);
        ZenMoney.trace('Добавлен счёт: ' + JSON.stringify(zenAccount));

        g_accounts.push(nodeAcc);
    }
}

/**
* Запрос и обработка кредитов
*/
function requestLoans() {
    ZenMoney.trace('Запрашиваем данные по кредитам...');
    var nodeGetLoans = new marknote.Element('ser:GetLoans');
    var converter = new marknote.Parser();
    var doc = converter.parse(g_envelope);
    var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
    nodeBody.addChildElement(nodeGetLoans);

    var loans = ZenMoney.requestPost(g_baseUrl + g_loanSer, doc.toString(), g_headers);

    var docLoans = converter.parse(loans);
    var nodeLoans = docLoans.getRootElement().getChildElement('soap:Body').getChildElement('ns2:GetLoansResponse').getChildElements();
    ZenMoney.trace('Получено кредитов: ' + nodeLoans.length);

    for (var i = 0; i < nodeLoans.length; i++) {
        var nodeLoan = nodeLoans[i];
        var loanNum = nodeLoan.getChildElement('id').getText();
        loanNum = loanNum.substr(loanNum.length - 4, 4);
        
        // <currency> contains a string that looks like 'bmw.curr.rur'
        var currency = nodeLoan.getChildElement('currency').getText();
        currency = currency.substr(currency.length - 3, 3);

        var paymentRest = Number('-' + nodeLoan.getChildElement('paymentRest').getText());

        var startDate = +new Date(nodeLoan.getChildElement('openDate').getText());
        startDate = startDate / 1000;
        var endDate = +new Date(nodeLoan.getChildElement('closeDate').getText());
        endDate = endDate / 1000;
        var dateOffset = Math.round(Number((endDate - startDate) / (30 * 24 * 60 * 60)));

        var zenAccount = {
            id: 'loan:' + nodeLoan.getChildElement('id').getText(),
            title: 'loan:' + nodeLoan.getChildElement('id').getText(),
            syncID: loanNum,
            instrument: currency,
            type: 'loan',
            balance: paymentRest,
            percent: Number(nodeLoan.getChildElement('intrestRate').getText()),
            capitalization: true,
            startDate: startDate,
            endDateOffset: dateOffset,
            endDateOffsetInterval: 'month',
            payoffStep: 1,
            payoffInterval: 'month'
        };

        ZenMoney.addAccount(zenAccount);
        ZenMoney.trace('Добавлен кредит: ' + JSON.stringify(zenAccount));

        g_loans.push(nodeLoan);
    }
}

/**
* Запрос и обработка вкладов
*/
function requestDeposits() {
    ZenMoney.trace('Запрашиваем данные по вкладам...');
    var nodeGetDeposits = new marknote.Element('ser:GetDeposits');
    var converter = new marknote.Parser();
    var doc = converter.parse(g_envelope);
    var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
    nodeBody.addChildElement(nodeGetDeposits);

    var deposits = ZenMoney.requestPost(g_baseUrl + g_depositSer, doc.toString(), g_headers);

    var docDeposits = converter.parse(deposits);
    var nodeDeposits = docDeposits.getRootElement().getChildElement('soap:Body').getChildElement('ns2:GetDepositsResponse').getChildElements();
    ZenMoney.trace('Получено вкладов: ' + nodeDeposits.length);

    for (var i = 0; i < nodeDeposits.length; i++) {
        var nodeDep = nodeDeposits[i];
        var depNum = nodeDep.getChildElement('accountNumber').getText();
        depNum = depNum.substr(depNum.length - 4, 4);

        // <currency> contains a string that looks like 'bmw.curr.rur'
        var currency = nodeDep.getChildElement('currency').getText();
        currency = currency.substr(currency.length - 3, 3);

        var startDateShift = nodeDep.getChildElement('openDate').getText();
        startDateShift = startDateShift.substr(1, startDateShift.length - 2);
        var startDate = new Date(Date.now() - startDateShift * (24 * 60 * 60 * 1000));

        var endDateShift = nodeDep.getChildElement('closeDate').getText();
        endDateShift = endDateShift.substr(1, endDateShift.length - 2);
        var endDate = new Date(Date.now() + endDateShift * (24 * 60 * 60 * 1000));

        var dateOffset = Math.round(Number((endDate - startDate) / (24 * 60 * 60 * 1000)));

        var zenAccount = {
            id: 'deposit:' + nodeDep.getChildElement('id').getText(),
            title: 'deposit:' + nodeDep.getChildElement('id').getText(),
            syncID: depNum,
            instrument: currency,
            type: 'deposit',
            balance: Number(nodeDep.getChildElement('currentAmount').getText()),
            startBalance: Number(nodeDep.getChildElement('initialAmount').getText()),
            percent: nodeDep.getChildElement('intrestRate').getText(),
            capitalization: Bool(nodeDep.getChildElement('capitalization').getText()),
            startDate: startDate,
            endDateOffset: dateOffset,
            endDateOffsetInterval: 'day',
            payoffStep: 1,
            payoffInterval: 'month'
        };

        ZenMoney.addAccount(zenAccount);
        ZenMoney.trace('Добавлен вклад: ' + JSON.stringify(zenAccount));
    }
}

///**
// * Обработка операций по счетам
// */
function processTransactions() {
    ZenMoney.trace('Запрашиваем данные по последним операциям по счетам...');

    var lastSyncTime = ZenMoney.getData('last_sync', 0);

    // первоначальная инициализация
    if (lastSyncTime == 0) {
        // по умолчанию загружаем операции за неделю
        var period = !g_preferences.hasOwnProperty('period') || isNaN(period = parseInt(g_preferences.period)) ? 7 : period;

        if (period > 100) period = 100;	// на всякий случай, ограничим лимит, а то слишком долго будет

        lastSyncTime = Date.now() - period * 24 * 60 * 60 * 1000;
    }

    // всегда захватываем одну неделю минимум
    lastSyncTime = Math.min(lastSyncTime, Date.now() - 7 * 24 * 60 * 60 * 1000);

    ZenMoney.trace('Запрашиваем операции с ' + new Date(lastSyncTime).toLocaleString());

    var mapTransactions = new Map();

    for (var i = 0; i < g_accounts.length; i++) {
        var nodeAccInfo = g_accounts[i].getChildElements();

        var nodeAccount = new marknote.Element('account');
        for (var j = 0; j < nodeAccInfo.length; j++)
            nodeAccount.addChildElement(nodeAccInfo[j]);

        var nodeStart = new marknote.Element('startDate');
        nodeStart.setText(new Date(lastSyncTime).toISOString());
        var nodeEnd = new marknote.Element('endDate');
        nodeEnd.setText(new Date(Date.now()).toISOString());

        var nodeMovements = new marknote.Element('ser:GetAccountMovements');
        nodeMovements.addChildElement(nodeAccount);
        nodeMovements.addChildElement(nodeStart);
        nodeMovements.addChildElement(nodeEnd);

        var converter = new marknote.Parser();
        var doc = converter.parse(g_envelope);
        var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
        nodeBody.addChildElement(nodeMovements);

        var movements = ZenMoney.requestPost(g_baseUrl + g_accSer, doc.toString(), g_headers);

        var docMovements = converter.parse(movements);
        var nodeReturns = docMovements.getRootElement().getChildElement('soap:Body').getChildElement('ns2:GetAccountMovementsResponse').getChildElements();
        ZenMoney.trace('Получено операций по счетам: ' + nodeReturns.length);
         
        for (var j = 0; j < nodeReturns.length; j++) {
            var nodeRet = nodeReturns[j];

            var transId = Number(nodeRet.getChildElement('id').getText());
            var date = new Date(nodeRet.getChildElement('commitDate').getText());
            var transCurrency = nodeRet.getChildElement('currency').getText();
            var accCurrency = nodeAccount.getChildElement('currency').getText();
            var isOutcome = (nodeRet.getChildElement('type').getText() == '0');
            var isIncome = (nodeRet.getChildElement('type').getText() == '1');

            var zenTrans = {
                id: transId.toString(),
                date: n2(date.getDate()) + '.' + n2(date.getMonth() + 1) + '.' + date.getFullYear(),
                outcome: 0,
                outcomeAccount: '',
                income: 0,
                incomeAccount: '',
                payee: nodeRet.getChildElement('shortDescription').getText()
            };

            if (isOutcome) {
                zenTrans.outcomeAccount = 'account:' + nodeAccount.getChildElement('id').getText();
                zenTrans.incomeAccount = zenTrans.outcomeAccount;
                if (transCurrency == accCurrency) {
                    zenTrans.outcome = Number(nodeRet.getChildElement('amount').getText());
                }
                else {
                    zenTrans.opOutcome = Number(nodeRet.getChildElement('amount').getText());
                    zenTrans.opOutcomeInstrument = transCurrency;
                }
            }
            else if (isIncome) {
                zenTrans.incomeAccount = 'account:' + nodeAccount.getChildElement('id').getText();
                zenTrans.outcomeAccount = zenTrans.incomeAccount;
                if (transCurrency == accCurrency) {
                    zenTrans.income = Number(nodeRet.getChildElement('amount').getText());
                }
                else {
                    zenTrans.opIncome = Number(nodeRet.getChildElement('amount').getText());
                    zenTrans.opIncomeInstrument = transCurrency;
                }
            }

            // if there once already was a transaction with the same ID
            // then it is a transfer between accounts
            // we will complete now the first transaction
            // and skip current transaction
            if (mapTransactions.has(transId)) {
                var zenSameTrans = mapTransactions[transId];
                ZenMoney.trace('zenSameTrans: ' + zenSameTrans);

                if (isOutcome && (zenSameTrans.income > 0)) {
                    zenSameTrans.outcome = zenTrans.outcome;
                    zenSameTrans.outcomeAccount = zenTrans.outcomeAccount;
                    if (transCurency != accCurrency) {
                        zenSameTrans.opOutcome = zenTrans.opOutcome;
                        zenSameTrans.opOutcomeInstrument = zenTrans.opOutcomeInstrument;
                    }
                }
                else if (isIncome && (zenSameTrans.outcome > 0)) {
                    zenSameTrans.income = zenTrans.income;
                    zenSameTrans.incomeAccount = zenTrans.incomeAccount;
                    if (transCurency != accCurrency) {
                        zenSameTrans.opIncome = zenTrans.opIncome;
                        zenSameTrans.opIncomeInstrument = zenTrans.opIncomeInstrument;
                    }
                }
            }
            else {
                ZenMoney.trace('zenSameTrans: none');
                mapTransactions.set(transId, zenTrans);
                ZenMoney.trace('trans added to map: ' + JSON.stringify(mapTransactions.get(transId)));
            }            

            if (zenTrans.date > lastSyncTime)
                lastSyncTime = zenTrans.date;
        }
    }

    var sum = 0;
    for (var trans of mapTransactions.values()) {
        ZenMoney.addTransaction(trans);
        ZenMoney.trace('Добавлена операция: ' + JSON.stringify(trans));
        sum++;
    }
    ZenMoney.trace('Всего операций добавлено: ' + sum);

    ZenMoney.setData('last_sync', lastSyncTime);
    ZenMoney.saveData();
}

/**
* Обработка платежей по кредитам
*/
function processLoanPayments() {
    ZenMoney.trace('Запрашиваем данные о совершённых платежах по кредитам...');
    for (var i = 0; i < g_loans.length; i++) {
        var nodeLoanInfo = g_loans[i].getChildElements();

        var nodeLoan = new marknote.Element('loan');
        for (var j = 0; j < nodeLoanInfo.length; j++)
            nodeLoan.addChildElement(nodeLoanInfo[j]);

        var nodePayments = new marknote.Element('ser:GetLoanPayments');
        nodePayments.addChildElement(nodeLoan);

        var converter = new marknote.Parser();
        var doc = converter.parse(g_envelope);
        var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
        nodeBody.addChildElement(nodePayments);

        var payments = ZenMoney.requestPost(g_baseUrl + g_loanSer, doc.toString(), g_headers);

        var docPayments = converter.parse(payments);
        var nodeReturns = docPayments.getRootElement().getChildElement('soap:Body').getChildElement('ns2:GetLoanPaymentsResponse').getChildElements();
        ZenMoney.trace('Получено платежей по кредиту: ' + nodeReturns.length);
         
        for (var j = 0; j < nodeReturns.length; j++) {
            var nodeRet = nodeReturns[j];

            var date = new Date(nodeRet.getChildElement('commitDate').getText());
            var transCurrency = nodeRet.getChildElement('currency').getText();
            var accCurrency = nodeLoan.getChildElement('currency').getText();
            var intrestPayment = Number(nodeRet.getChildElement('intrestPayment').getText());
            var loanAmountPayment = Number(nodeRet.getChildElement('loanAmountPayment').getText());

            var zenTrans = {
                id: nodeRet.getChildElement('id').getText(),
                date: n2(date.getDate()) + '.' + n2(date.getMonth() + 1) + '.' + date.getFullYear(),
                outcome: 0,
                outcomeAccount: 'loan:' + nodeLoan.getChildElement('id').getText(),
                income: intrestPayment + loanAmountPayment,
                incomeAccount: 'loan:' + nodeLoan.getChildElement('id').getText()
            };
            ZenMoney.addTransaction(zenTrans);
            ZenMoney.trace('Добавлен платёж: ' + JSON.stringify(zenTrans));
        }
    }
}

/**
* Проверить не игнорируемый ли это счёт
* @param id
*/
function isAccountSkipped(id) {
    return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}

function n2(n) {
    return n < 10 ? '0' + n : '' + n;
}