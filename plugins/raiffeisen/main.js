/**
 * Основной метод
 */
function main() {
    g_soap = new MarknoteWrapper();
    var zenAccounts = [];
    var zenTransactions = [];
    var startDate = new Date(getSyncStartTimestamp());
    
    if (startDate.getTime() === 0)
        ZenMoney.trace('Первая синхронизация');
    ZenMoney.trace('Синхронизация операций с ' + startDate.toISOString().substr(0, 10));

    openSession();
    try {
        getFromRaiffesisen(zenAccounts, zenTransactions, startDate);
    }
    catch (exception) {
        ZenMoney.trace('Что-то пошло не так: ');
        ZenMoney.trace(exception.message);
        closeSession();
        throw exception;
    }
    closeSession();

    addToZenMoney(zenAccounts, zenTransactions);

    ZenMoney.setResult({ success: true });
}

/**
 * Открывает рабочую сессию с сервером
 */
function openSession() {
    ZenMoney.trace('Открываем сессию');
    var preferences = ZenMoney.getPreferences();
    if (!preferences.login)
        throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
    if (!preferences.password)
        throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);

    requestSession(preferences.login, preferences.password);
}

/**
 * Закрывает сессию
 */
function closeSession() {
    ZenMoney.trace('Закрываем сессию');
    g_soap.sendRequest('CloseSession', g_authSer);
}

/**
 * Авторизация
 *
 * @param {string} login Логин интернет-банка
 * @param {string} password Пароль интернет-банка
 */
function requestSession(login, password) {
    ZenMoney.trace('Авторизуемся на сервере...');
    var nodes = [];
    nodes.push(g_soap.textNode('login', login));
    nodes.push(g_soap.textNode('password', password));
    var doc = g_soap.sendRequest('login', g_authSer, nodes);
    var nodeReply = doc.getRootElement().getChildElement('soap:Body');
    if (nodeReply != null) {
		var nodeFault = nodeReply.getChildElement('soap:Fault');
		if (nodeFault != null) {
			if (g_soap.getValue(nodeFault, 'faultstring', '') === 'logins.password.incorrect')
				throw new ZenMoney.Error('Райффайзенбанк: Неверный логин или пароль', true);

			var faultDetails = nodeFault.getChildElement('detail').getChildElement('ns1:mobileServiceFault');
			if (faultDetails != null) {
				var faultMessage = g_soap.getValue(faultDetails, 'userMessage', 'неизвестная ошибка');
				throw new ZenMoney.Error('Райффайзенбанк: ' + faultMessage);
			}
			else {
				throw new ZenMoney.Error('Райффайзенбанк: ' + faultString);
			}
		}
	}
}

/**
 * Синхронизация
 *
 * @param {Array} zenAccounts Список для заполнения импортированными Zen-счетами
 * @param {Array} zenTransactions Список для заполнения импортированными Zen-операциями
 * @param {Date} startDate Дата, с которой начинается синхронизация
 */
function getFromRaiffesisen(zenAccounts, zenTransactions, startDate) {
    ZenMoney.trace('Запрашиваем данные по счетам...');
    var accounts = getAccounts();
    ZenMoney.trace('Получено счетов: ' + accounts.length);
    for (var i = 0; i < accounts.length; ++i) {
        ZenMoney.trace('Обрабатываем счёт ' + accounts[i].accountNum());
        var zenAccount = accounts[i].toZenAccount();
        zenAccounts.push(zenAccount);

        var movements = getAccountMovements(accounts[i], startDate);
        ZenMoney.trace('Получено операций: ' + movements.length);
        for (var j = 0; j < movements.length; ++j)
            zenTransactions.push(movements[j].toZenTransaction(zenAccount));
    }

    ZenMoney.trace('Запрашиваем данные по картам...');
    var cards = getCards();
    ZenMoney.trace('Получено карт: ' + cards.length);
    for (var i = 0; i < cards.length; ++i) {
        ZenMoney.trace('Обрабатываем карту ' + cards[i].cardNum());
        var zenAccount;
        var accNum = cards[i].accountNumber();
        for (var j = 0; j < zenAccounts.length; ++j) {
            if (zenAccounts[j].numberString === accNum) {
                zenAccount = zenAccounts[j];
                break;
            }
        }
        cards[i].addToZenAccount(zenAccount);

        var transactions = getCardTransactions(cards[i], startDate);
        ZenMoney.trace('Получено транзакций: ' + transactions.length);
        for (var j = 0; j < transactions.length; ++j)
            zenTransactions.push(transactions[j].toZenTransaction(zenAccount));
    }

    ZenMoney.trace('Запрашиваем данные по кредитам...');
    try {
        var loans = getLoans(startDate);
        ZenMoney.trace('Получено кредитов: ' + loans.length);
        for (var i = 0; i < loans.length; ++i) {
            ZenMoney.trace('Обрабатываем кредит ' + loans[i].loanNum());
            var zenAccount = loans[i].toZenAccount();
            zenAccounts.push(zenAccount);

            var payments = getLoanPayments(loans[i], startDate);
            ZenMoney.trace('Получено платежей: ' + payments.length);
            for (var j = 0; j < payments.length; ++j)
                zenTransactions.push(payments[j].toZenTransaction(zenAccount));
        }
    }
    catch (exception) {
        ZenMoney.trace('Пропускаем синхронизацию кредитов из-за ошибки: ' + exception.message);
    }

    ZenMoney.trace('Запрашиваем данные по вкладам...');
    try {
        var deposits = getDeposits();
        ZenMoney.trace('Получено вкладов: ' + deposits.length);
        for (var i = 0; i < deposits.length; ++i) {
            ZenMoney.trace('Обрабатываем вклад ' + deposits[i].loanNum());
            zenAccounts.push(deposits[i].toZenAccount());
        }
    }
    catch (exception) {
        ZenMoney.trace('Пропускаем синхронизацию вкладов из-за ошибки: ' + exception.message);
    }
}

/**
 * Добавление полученных данных в ZenMoney
 *
 * @param {Array} zenAccounts Список Zen-счетов
 * @param {Array} zenTransactions Список Zen-операций
 */
function addToZenMoney(zenAccounts, zenTransactions) {
    var syncEndDate = new Date(ZenMoney.getData('last_sync', 0));

    for (var i = 0; i < zenAccounts.length; ++i) {
        ZenMoney.addAccount(zenAccounts[i]);
        ZenMoney.trace('Добавлен Zen-счёт: ' + JSON.stringify(zenAccounts[i]));
    }

    for (var i = 0; i < zenTransactions.length; ++i) {
        ZenMoney.addTransaction(zenTransactions[i]);
        ZenMoney.trace('Добавлена Zen-транзакция: ' + JSON.stringify(zenTransactions[i]));

        if (zenTransactions[i].date > Math.round(syncEndDate.getTime() / 1000))
            syncEndDate = new Date(zenTransactions[i].date * 1000);
    }

    ZenMoney.setData('last_sync', syncEndDate);
    ZenMoney.saveData();
}

/**
 * Запрос счетов
 *
 * @return {Account[]} Список счетов из R-Connect
 */
function getAccounts() {
    var accounts = [];
    var accountNodes = g_soap.processRequest('GetAccounts', g_accSer);
    for (var i = 0; i < accountNodes.length; i++) {
        var account = new Account(accountNodes[i]);

        var accId = 'account:' + account.id();
        if (account.isClosed() || isAccountSkipped(accId)) {
            ZenMoney.trace('Пропускаем счёт: ' + account.accountNum());
            continue;
        }
        ZenMoney.trace('Найден счёт: ' + account.accountNum());
        
        accounts.push(account);
    }
    return accounts;
}

/**
 * Запрос карт
 *
 * @return {Card[]} Список карт из R-Connect
 */
function getCards() {
    var cards = [];
    var cardNodes = g_soap.processRequest('GetCards', g_cardSer);
    for (var i = 0; i < cardNodes.length; i++) {
        var card = new Card(cardNodes[i]);

        if (card.isCredit()) {
            ZenMoney.trace('Найдена кредитная карта: ' + card.cardNum());
            try {
                var creditLimit = requestCreditLimit(card.id());
                card.setCreditLimit(creditLimit);
            }
            catch (exception) {
                ZenMoney.trace('Пропускаем установку кредитного лимита из-за ошибки: ' + exception.message);
            }
        }
        else {
            ZenMoney.trace('Найдена дебетовая карта: ' + card.cardNum());
        }

        cards.push(card);
    }
    return cards;
}

/**
 * Запрос и обработка кредитного лимита
 *
 * @param {String} cardId ID карты в R-Connect
 * @returns {Number} Доступный кредитный лимит
 */
function requestCreditLimit(cardId) {
    var nodes = [];
    nodes.push(g_soap.textNode('cardId', cardId));
    var nodeStatements = g_soap.processRequest('getCreditStatementPeriods2', g_cardSer, nodes);
    for (var i = 0; i < nodeStatements.length; i++) {
        if (g_soap.getValue(nodeStatements[i], 'current') === 'true') {
            nodes.push(g_soap.textNode('id', g_soap.getValue(nodeStatements[i], 'id')));
            nodes.push(g_soap.textNode('isPrime', g_soap.getValue(nodeStatements[i], 'prime', 'true')));
            break;
        }
    }
    var nodeStatement = g_soap.processRequest('getCurrentCreditStatement', g_cardSer, nodes);
    return Number(g_soap.getValue(nodeStatement[0], 'availableCreditLimit', '0'));
}

/**
 * Запрос кредитов
 *
 * @param {Date} startDate Дата, с которой начинается синхронизация
 * @return {Loan[]} Список кредитов из R-Connect
 */
function getLoans(startDate) {
    var loans = [];
    var nodeLoans = g_soap.processRequest('GetLoans', g_loanSer);
    for (var i = 0; i < nodeLoans.length; i++) {
        var loan = new Loan(nodeLoans[i]);

        if (isAccountSkipped(loan.zenId())) {
            ZenMoney.trace('Пропускаем кредит: ' + loan.loanNum());
            continue;
        }
        var date = new Date(loan.closeDate().substr(0, 10));
        if (date < startDate)
            continue;
        ZenMoney.trace('Найден кредит: ' + loan.loanNum());

        loans.push(loan);
    }
    return loans;
}

/**
 * Запрос вкладов
 *
 * @return {Deposit[]} Список вкладов из R-Connect
 */
function getDeposits() {
    var deposits = [];
    var nodeDeposits = g_soap.processRequest('GetDeposits', g_depositSer);
    for (var i = 0; i < nodeDeposits.length; i++) {
        var deposit = new Deposit(nodeDeposits[i]);

        if (isAccountSkipped(deposit.zenId())) {
            ZenMoney.trace('Пропускаем вклад: ' + deposit.depositNum());
            continue;
        }
        ZenMoney.trace('Найден вклад: ' + deposit.depositNum());

        deposits.push(deposit);
    }
    return deposits;
}

/**
 * Обработка операций по счёту
 *
 * @param {Account} account Счёт, по которому будут запрошены операции
 * @param {Date} startDate Дата, с которой начинается синхронизация
 * @return {AccountMovement[]} Список операций из R-Connect
 */
function getAccountMovements(account, startDate) {
    var nodes = [];
    nodes.push(g_soap.arrayNode('account', account.nodes().getChildElements()));
    nodes.push(g_soap.textNode('startDate', startDate.toISOString().substr(0, 10)));
    nodes.push(g_soap.textNode('endDate', new Date(Date.now()).toISOString()));
    var returns = g_soap.processRequest('GetAccountMovements', g_accSer, nodes);

    var movements = [];
    for (var j = 0; j < returns.length; j++) {
        var movement = new AccountMovement(returns[j]);

        if (movement.shortDescription() === 'CREDIT CARD POSTING')
            continue;
        if (movement.fullDescription().substr(0, 7) === 'CARD **')
            continue;
        if (!movement.isIncome() && !movement.isOutcome())
            continue;

        movements.push(movement);
    }
    return movements;
}

/**
 * Обработка транзакций по карте
 *
 * @param {Card} card Карта, по которой будут запрошены операции
 * @param {Date} startDate Дата, с которой начинается синхронизация
 * @return {CardTransaction[]} Список транзакций из R-Connect
 */
function getCardTransactions(card, startDate) {
    var nodes = [];
    nodes.push(g_soap.arrayNode('card', card.nodes().getChildElements()));
    nodes.push(g_soap.textNode('startDate', startDate.toISOString().substr(0, 10)));
    nodes.push(g_soap.textNode('endDate', new Date(Date.now()).toISOString()));
    var returns = g_soap.processRequest('GetCardTransactions', g_cardSer, nodes);

    var transactions = [];
    for (var j = 0; j < returns.length; j++) {
        var transaction = new CardTransaction(returns[j]);

        if (!transaction.isIncome() && !transaction.isOutcome())
            continue;

        transactions.push(transaction);
    }
    return transactions;
}

/**
 * Обработка платежей по кредиту
 *
 * @param {Loan} loan Кредит, по которому будут запрошены операции
 * @param {Date} startDate Дата, с которой начинается синхронизация
 * @return {LoanPayment[]} Список платежей из R-Connect
 */
function getLoanPayments(loan, startDate) {
    var nodes = [];
    nodes.push(g_soap.arrayNode('loan', loan.nodes().getChildElements()));
    var returns = g_soap.processRequest('GetLoanPayments', g_loanSer, nodes);

    var payments = [];
    for (var j = 0; j < returns.length; j++) {
        var payment = new LoanPayment(returns[j]);

        var date = new Date(payment.commitDate().substr(0, 10));
        if (date < startDate)
            continue;

        payments.push(payment);
    }
    return payments;
}

/**
 * Получить начало периода синхронизации
 *
 * @returns {Number} Timestamp начала синхронизации
 */
function getSyncStartTimestamp() {
    var lastSyncTime = ZenMoney.getData('last_sync', 0);

    // первая снхронизация
    if (lastSyncTime === 0) {
        var period;
        var preferences = ZenMoney.getPreferences();
        if (preferences.hasOwnProperty('period'))
            period = parseInt(preferences.period);

        // загружаем операции минимум за 1 день, максимум за 100 дней
        if (isNaN(period))
            period = 1;
        else if (period > 100)
            period = 100;

        lastSyncTime = Math.floor(Date.now() - period * 24 * 60 * 60 * 1000);
    }
    else {
        lastSyncTime = Math.floor((new Date(lastSyncTime)).getTime() - 1 * 24 * 60 * 60 * 1000);
    }

    return lastSyncTime;
}

/**
 * Проверить не игнорируемый ли это счёт
 *
 * @param {Number} id Zen-идентификатор счёта
 * @return {bool} true, если игнорируемый
 */
function isAccountSkipped(id) {
    return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}
