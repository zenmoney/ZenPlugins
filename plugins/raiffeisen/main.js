var g_headers = {
    "Connection": "close",
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
    g_accountCards = {},
    g_accounts = [],
    g_loans = [],
    g_converter,
    g_preferences,
	g_syncStartDate,
	g_syncEndDate,
    g_isSuccessful = true;

/**
* Основной метод
*/
function main() {
    g_converter = new marknote.Parser();
    g_preferences = ZenMoney.getPreferences();
	g_syncStartDate = getSyncStartDate();
	g_syncEndDate = g_syncStartDate;

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

    ZenMoney.setData('last_sync', g_syncEndDate);
    ZenMoney.saveData();
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
    makeRequest(nodeCloseSession, g_authSer);
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

    var docResponse = makeRequest(nodeCredentials, g_authSer);
    var nodeReply = docResponse.getRootElement().getChildElement('soap:Body');
    if (nodeReply != null) {
        var nodeFault = nodeReply.getChildElement('soap:Fault');
        if (nodeFault != null) {
            g_isSuccessful = false;
            if (getValue(nodeFault, 'faultstring', '') == 'logins.password.incorrect') {
                throw new ZenMoney.Error('Райффайзенбанк: Неверный логин или пароль', true);
            }
            var faultDetails = nodeFault.getChildElement('detail').getChildElement('ns1:mobileServiceFault');
            if (faultDetails != null) {
                var faultMessage = getValue(faultDetails, 'userMessage', 'неизвестная ошибка');
                throw new ZenMoney.Error('Райффайзенбанк: ' + faultMessage);
            }
            else {
                throw new ZenMoney.Error('Райффайзенбанк: ' + faultString);
            }
        }
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

    var docCards = makeRequest(nodeGetCards, g_cardSer);
    var nodeReply = docCards.getRootElement().getChildElement('soap:Body');
    if (nodeReply == null) {
        ZenMoney.trace('docCards: ' + docCards.toString());
        throw new ZenMoney.Error('Райффайзенбанк: получен некорректный ответ от сервера');
    }
    var nodeCards = nodeReply.getChildElement('ns2:GetCardsResponse').getChildElements();
    ZenMoney.trace('Получено карт: ' + nodeCards.length);

    for (var i = 0; i < nodeCards.length; i++) {
        var nodeCard = nodeCards[i];

        var cardNum = getValue(nodeCard, 'number');
        cardNum = cardNum.substr(cardNum.length - 4, 4);
        ZenMoney.trace('Найдена карта: ' + cardNum);

        var accNum = getValue(nodeCard, 'accountNumber');
        if (g_accountCards[accNum] == undefined)
            g_accountCards[accNum] = [];
        g_accountCards[accNum].push(cardNum);
    }
}

/**
* Запрос и обработка счетов
*/
function requestAccounts() {
    ZenMoney.trace('Запрашиваем данные по счетам...');
    var nodeGetAccounts = new marknote.Element('ser:GetAccounts');

    var docAccounts = makeRequest(nodeGetAccounts, g_accSer);
    var nodeReply = docAccounts.getRootElement().getChildElement('soap:Body');
    if (nodeReply == null) {
        ZenMoney.trace('docAccounts: ' + docAccounts.toString());
        throw new ZenMoney.Error('Райффайзенбанк: получен некорректный ответ от сервера');
    }
    var nodeAccount = nodeReply.getChildElement('ns2:GetAccountsResponse').getChildElements();
    ZenMoney.trace('Получено счетов: ' + nodeAccount.length);

    for (var i = 0; i < nodeAccount.length; i++) {
        var nodeAcc = nodeAccount[i];
        var accNumber = getValue(nodeAcc, 'number');
        var accNum = accNumber.substr(accNumber.length - 4, 4);

        var accId = 'account:' + getValue(nodeAcc, 'id');
        var isClosed = (getValue(nodeAcc, 'closeDate') != '');
        if (isClosed || isAccountSkipped(accId)) {
            ZenMoney.trace('Пропускаем счёт: ' + accNum);
            continue;
        }

        var isSaving = (getValue(nodeAcc, 'accountSubtype') == 'SAVING');
        var zenAccount = {
            id: accId,
            syncID: [],
            instrument: getValue(nodeAcc, 'currency'),
            balance: Number(getValue(nodeAcc, 'balance')),
        };
        zenAccount.syncID.push(accNum);

        // if no card is binded then import it as an account
        if (g_accountCards[accNumber] == undefined) {
            zenAccount.type = 'checking';
            zenAccount.title = getValue(nodeAcc, 'number');
            zenAccount.savings = isSaving;
        }
        // else import it as a card
        else {
            zenAccount.type = 'ccard';
            zenAccount.title = g_accountCards[accNumber][0];
            for (var card = 0; card < g_accountCards[accNumber].length; card++)
                zenAccount.syncID.push(g_accountCards[accNumber][card]);
        }

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

    var docLoans = makeRequest(nodeGetLoans, g_loanSer);
    var nodeReply = docLoans.getRootElement().getChildElement('soap:Body');
    if (nodeReply == null) {
        ZenMoney.trace('docLoans: ' + docLoans.toString());
        throw new ZenMoney.Error('Райффайзенбанк: получен некорректный ответ от сервера');
    }
    var nodeLoans = nodeReply.getChildElement('ns2:GetLoansResponse').getChildElements();
    ZenMoney.trace('Получено кредитов: ' + nodeLoans.length);

    for (var i = 0; i < nodeLoans.length; i++) {
        var nodeLoan = nodeLoans[i];
        var loanNum = getValue(nodeLoan, 'id');
        loanNum = loanNum.substr(loanNum.length - 4, 4);
        
        var loanId = 'loan:' + getValue(nodeLoan, 'id');
        if (isAccountSkipped(loanId)) {
            ZenMoney.trace('Пропускаем кредит: ' + loanNum);
            continue;
        }

        // <currency> contains a string that looks like 'bmw.curr.rur'
        var currency = getValue(nodeLoan, 'currency');
        currency = currency.substr(currency.length - 3, 3);

        var paymentRest = Number('-' + getValue(nodeLoan, 'paymentRest'));

        var startDate = +new Date(getValue(nodeLoan, 'openDate').substr(0, 10));
        startDate = startDate / 1000;
        var endDate = +new Date(getValue(nodeLoan, 'closeDate').substr(0, 10));
        endDate = endDate / 1000;
        var dateOffset = Math.round(Number((endDate - startDate) / (30 * 24 * 60 * 60)));

        var zenAccount = {
            id: loanId,
            title: getValue(nodeLoan, 'id'),
            syncID: loanNum,
            instrument: currency,
            type: 'loan',
            balance: paymentRest,
            percent: Number(getValue(nodeLoan, 'intrestRate')),
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

    var docDeposits = makeRequest(nodeGetDeposits, g_depositSer);
    var nodeReply = docDeposits.getRootElement().getChildElement('soap:Body');
    if (nodeReply == null) {
        ZenMoney.trace('docDeposits: ' + docDeposits.toString());
        throw new ZenMoney.Error('Райффайзенбанк: получен некорректный ответ от сервера');
    }
    var nodeDeposits = nodeReply.getChildElement('ns2:GetDepositsResponse').getChildElements();

    ZenMoney.trace('Получено вкладов: ' + nodeDeposits.length);

    for (var i = 0; i < nodeDeposits.length; i++) {
        var nodeDep = nodeDeposits[i];
        var depNum = getValue(nodeDep, 'accountNumber');
        depNum = depNum.substr(depNum.length - 4, 4);

        var depId = 'deposit:' + getValue(nodeDep, 'id');
        if (isAccountSkipped(depId)) {
            ZenMoney.trace('Пропускаем вклад: ' + depNum);
            continue;
        }

        // <currency> contains a string that looks like 'bmw.curr.rur'
        var currency = getValue(nodeDep, 'currency');
        currency = currency.substr(currency.length - 3, 3);
        var startDate = new Date(getValue(nodeDep, 'openDate').substr(0, 10));
        var isCapitalized = (getValue(nodeDep, 'capitalization') == 'true');

        var zenAccount = {
            id: depId,
            title: getValue(nodeDep, 'names'),
            syncID: depNum,
            instrument: currency,
            type: 'deposit',
            balance: Number(getValue(nodeDep, 'currentAmount')),
            startBalance: Number(getValue(nodeDep, 'initialAmount')),
            percent: Number(getValue(nodeDep, 'interestRate')),
            capitalization: isCapitalized,
            startDate: startDate,
            endDateOffset: Number(getValue(nodeDep, 'daysQuantity')),
            endDateOffsetInterval: 'day',
            payoffStep: 1,
            payoffInterval: 'month'
        };
        ZenMoney.addAccount(zenAccount);
        ZenMoney.trace('Добавлен вклад: ' + JSON.stringify(zenAccount));
    }
}

/**
 * Обработка операций по счетам
 */
function processTransactions() {
    ZenMoney.trace('Запрашиваем данные по последним операциям по счетам...');
    ZenMoney.trace('Запрашиваем операции с ' + g_syncStartDate.toISOString().substr(0, 10));

    var mapTransactions = new Map();

    for (var i = 0; i < g_accounts.length; i++) {
        var nodeAccInfo = g_accounts[i].getChildElements();

        var nodeAccount = new marknote.Element('account');
        for (var j = 0; j < nodeAccInfo.length; j++)
            nodeAccount.addChildElement(nodeAccInfo[j]);

        var nodeStart = new marknote.Element('startDate');
        nodeStart.setText(g_syncStartDate.toISOString().substr(0, 10));
        var nodeEnd = new marknote.Element('endDate');
        nodeEnd.setText(new Date(Date.now()).toISOString());

        var nodeMovements = new marknote.Element('ser:GetAccountMovements');
        nodeMovements.addChildElement(nodeAccount);
        nodeMovements.addChildElement(nodeStart);
        nodeMovements.addChildElement(nodeEnd);

        var docMovements = makeRequest(nodeMovements, g_accSer);
        var nodeReply = docMovements.getRootElement().getChildElement('soap:Body');
        if (nodeReply == null) {
            ZenMoney.trace('docMovements: ' + docMovements.toString());
            throw new ZenMoney.Error('Райффайзенбанк: получен некорректный ответ от сервера');
        }
        var nodeReturns = nodeReply.getChildElement('ns2:GetAccountMovementsResponse').getChildElements();
        ZenMoney.trace('Получено операций по счетам: ' + nodeReturns.length);

        for (var j = 0; j < nodeReturns.length; j++) {
            var nodeRet = nodeReturns[j];

			var description = getValue(nodeRet, 'shortDescription');
			// do not count these operations
			// because they are negative duplicates of real transactions
			if (description == 'CREDIT CARD POSTING')
				continue;

            var date = new Date(getValue(nodeRet, 'commitDate').substr(0, 10));
            var transCurrency = getValue(nodeRet, 'currency');
            var accCurrency = getValue(nodeAccount, 'currency');
            var isOutcome = (getValue(nodeRet, 'type') == '0');
            var isIncome = (getValue(nodeRet, 'type') == '1');

            var zenTrans = {
                date: n2(date.getDate()) + '.' + n2(date.getMonth() + 1) + '.' + date.getFullYear(),
                outcome: 0,
                outcomeAccount: '',
                income: 0,
                incomeAccount: '',
                payee: description
            };

            if (isOutcome) {
                zenTrans.outcomeAccount = 'account:' + getValue(nodeAccount, 'id');
                zenTrans.incomeAccount = zenTrans.outcomeAccount;
                if (transCurrency == accCurrency) {
                    zenTrans.outcome = Number(getValue(nodeRet, 'amount'));
                }
                else {
                    zenTrans.opOutcome = Number(getValue(nodeRet, 'amount'));
                    zenTrans.opOutcomeInstrument = transCurrency;
                }
            }
            else if (isIncome) {
                zenTrans.incomeAccount = 'account:' + getValue(nodeAccount, 'id');
                zenTrans.outcomeAccount = zenTrans.incomeAccount;
                if (transCurrency == accCurrency) {
                    zenTrans.income = Number(getValue(nodeRet, 'amount'));
                }
                else {
                    zenTrans.opIncome = Number(getValue(nodeRet, 'amount'));
                    zenTrans.opIncomeInstrument = transCurrency;
                }
            }
            
            var transId = Number(getValue(nodeRet, 'id', '-1'));
            if (transId != -1) {
                // if there once already was a transaction with the same ID
                // then it is a transfer between accounts
                // we will complete now the first transaction
                // and skip current transaction
                if (mapTransactions.has(transId)) {
                    var zenSameTrans = mapTransactions[transId];

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
                    zenTrans.id = transId;
                    mapTransactions.set(transId, zenTrans);
                }
            }
            else {
                // DEBUG //
                ZenMoney.trace('Получена операция без id: ' + nodeRet.toString());
                // DEBUG //
            }

            if (zenTrans.date > g_syncEndDate)
                g_syncEndDate = zenTrans.date;
        }
    }

    var sum = 0;
    for (var trans of mapTransactions.values()) {
        ZenMoney.addTransaction(trans);
        ZenMoney.trace('Добавлена операция: ' + JSON.stringify(trans));
        sum++;
    }
    ZenMoney.trace('Всего операций добавлено: ' + sum);
}

/**
* Обработка платежей по кредитам
*/
function processLoanPayments() {
    ZenMoney.trace('Запрашиваем данные о всех совершённых платежах по кредитам...');
    for (var i = 0; i < g_loans.length; i++) {
        var nodeLoanInfo = g_loans[i].getChildElements();

        var nodeLoan = new marknote.Element('loan');
        for (var j = 0; j < nodeLoanInfo.length; j++)
            nodeLoan.addChildElement(nodeLoanInfo[j]);

        var nodePayments = new marknote.Element('ser:GetLoanPayments');
        nodePayments.addChildElement(nodeLoan);

        var docPayments = makeRequest(nodePayments, g_loanSer);
        var nodeReply = docPayments.getRootElement().getChildElement('soap:Body');
        if (nodeReply == null) {
            ZenMoney.trace('docPayments: ' + docPayments.toString());
            throw new ZenMoney.Error('Райффайзенбанк: получен некорректный ответ от сервера');
        }
        var nodeReturns = nodeReply.getChildElement('ns2:GetLoanPaymentsResponse').getChildElements();
        ZenMoney.trace('Получено платежей по кредиту за весь период: ' + nodeReturns.length);
         
		var sum = 0;
        for (var j = 0; j < nodeReturns.length; j++) {
            var nodeRet = nodeReturns[j];

            var date = new Date(getValue(nodeRet, 'commitDate').substr(0, 10));
			if (date < g_syncStartDate)
				continue;
			
            var transCurrency = getValue(nodeRet, 'currency');
            var accCurrency = getValue(nodeLoan, 'currency');
            var intrestPayment = Number(getValue(nodeRet, 'intrestPayment'));
            var loanAmountPayment = Number(getValue(nodeRet, 'loanAmountPayment'));

            var zenTrans = {
                id: getValue(nodeRet, 'id'),
                date: n2(date.getDate()) + '.' + n2(date.getMonth() + 1) + '.' + date.getFullYear(),
                outcome: 0,
                outcomeAccount: 'loan:' + getValue(nodeLoan, 'id'),
                income: intrestPayment + loanAmountPayment,
                incomeAccount: 'loan:' + getValue(nodeLoan, 'id')
            };
            ZenMoney.addTransaction(zenTrans);
            ZenMoney.trace('Добавлен платёж: ' + JSON.stringify(zenTrans));
			sum++;
            if (zenTrans.date > g_syncEndDate)
                g_syncEndDate = zenTrans.date;
        }
        ZenMoney.trace('Всего платежей добавлено: ' + sum);
    }
}

/**
* Отправить запрос с телом nodeRequest на сервис serviceName и получить ответ
* @param {marknote.Element} nodeRequest
* @param {String} serviceName
* @returns {marknote.Document}
*/
function makeRequest(nodeRequest, serviceName) {
    var doc = g_converter.parse(g_envelope);
    var nodeBody = doc.getRootElement().getChildElement('soapenv:Body');
    nodeBody.addChildElement(nodeRequest);
    var reply = ZenMoney.requestPost(g_baseUrl + serviceName, doc.toString(), g_headers);
    return g_converter.parse(reply);
}

/**
* Получить текстовое значение поля либо вернуть дефолтное значение
* @param {marknote.Element} node
* @param {String} key
* @param {String} ?defaultValue
* @returns {String}
*/
function getValue(node, key, defaultValue) {
    defaultValue = (typeof defaultValue !== 'undefined') ? defaultValue : '';
    if (node == null)
        return defaultValue;
    if (node.getChildElement(key) == null)
        return defaultValue;
    var value = node.getChildElement(key).getText();
    if (value == '')
        return defaultValue;
    return value;
}

/**
* Установить дату начала периода синхронизации
* @returns {Date}
*/
function getSyncStartDate() {
	var lastSyncTime = ZenMoney.getData('last_sync', 0);
	var period;

    // первая снхронизация
    if (lastSyncTime == 0) {
		ZenMoney.trace('Первая синхронизация');
		if (g_preferences.hasOwnProperty('period'))
			period = parseInt(g_preferences.period);
		
        // загружаем операции минимум за 1 день, максимум за 100 дней
		if (isNaN(period))
			period = 1;
		else if (period > 100)
			period = 100;

        lastSyncTime = Date.now() - period * 24 * 60 * 60 * 1000;
    }
    else {
		lastSyncTime = Math.min(lastSyncTime, Date.now() - 1 * 24 * 60 * 60 * 1000);
	}
	
	return new Date(lastSyncTime);
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