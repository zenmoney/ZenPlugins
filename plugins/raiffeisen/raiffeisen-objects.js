/**
 * Парсит счёт из R-Connect в соответствии с wsdl-схемой
 *
 * @class
 * @param {Array.<marknote.Element>} nodes Массив xml-элементов
 */
var Account = function (nodes) {
    var _nodes = nodes || new marknote.Element('');

    this.nodes = function () {
        return _nodes;
    }
    this.isClosed = function () {
        return (this.closeDate() !== '');
    }
    this.isSaving = function () {
        return (this.accountSubtype === 'SAVING');
    }
    this.zenId = function () {
        return 'account:' + this.id();
    }
    this.accountNum = function () {
        var accNum = this.numberString();
        return accNum.substr(accNum.length - 4, 4);
    }
    this.toZenAccount = function () {
        var zenAccount = {
            type: 'checking',
            id: this.zenId(),
            instrument: this.currency(),
            balance: this.balance(),
            title: this.numberString(),
            savings: this.isSaving(),
            syncID: []
        };
        zenAccount.syncID.push(this.accountNum());
        return zenAccount;
    }

    this.accountName = function () {
        return g_soap.getValue(_nodes, 'accountName');
    }
    this.accountSubtype = function () {
        return g_soap.getValue(_nodes, 'accountSubtype');
    }
    this.accountSubtypeName = function () {
        return g_soap.getValue(_nodes, 'accountSubtypeName');
    }
    this.balance = function () {
        return Number(g_soap.getValue(_nodes, 'balance'));
    }
    this.balanceDate = function () {
        return g_soap.getValue(_nodes, 'balanceDate');
    }
    this.bankIdentifierCode = function () {
        return g_soap.getValue(_nodes, 'bankIdentifierCode');
    }
    this.blockedForCredit = function () {
        return (g_soap.getValue(_nodes, 'blockedForCredit') === 'true');
    }
    this.blockedForDebit = function () {
        return (g_soap.getValue(_nodes, 'blockedForDebit') === 'true');
    }
    this.branchId = function () {
        return Number(g_soap.getValue(_nodes, 'branchId'));
    }
    this.closeDate = function () {
        return g_soap.getValue(_nodes, 'closeDate');
    }
    this.creditLimit = function () {
        // it is not the real credit limit, just some random (?) number
        return Number(g_soap.getValue(_nodes, 'creditLimit'));
    }
    this.currency = function () {
        return g_soap.getValue(_nodes, 'currency');
    }
    this.details = function () {
        return g_soap.getValue(_nodes, 'details');
    }
    this.heldFunds = function () {
        return Number(g_soap.getValue(_nodes, 'heldFunds'));
    }
    this.id = function () {
        return g_soap.getValue(_nodes, 'id');
    }
    this.nextCreditPaymentDate = function () {
        return g_soap.getValue(_nodes, 'nextCreditPaymentDate');
    }
    this.numberString = function () {
        return g_soap.getValue(_nodes, 'number');
    }
    this.openDate = function () {
        return g_soap.getValue(_nodes, 'openDate');
    }
    this.owner_id = function () {
        return Number(g_soap.getValue(_nodes, 'owner_id'));
    }
    this.region = function () {
        return g_soap.getValue(_nodes, 'region');
    }
    this.type = function () {
        return g_soap.getValue(_nodes, 'type');
    }
};

/**
 * Парсит карту из R-Connect в соответствии с wsdl-схемой
 *
 * @class
 * @param {Array.<marknote.Element>} nodes Массив xml-элементов
 */
var Card = function (nodes) {
    var _nodes = nodes || new marknote.Element('');
    var _creditLimit = 0;

    this.setCreditLimit = function (creditLimit) {
        _creditLimit = creditLimit;
    }

    this.nodes = function () {
        return _nodes;
    }
    this.creditLimit = function () {
        return _creditLimit;
    }
    this.isCredit = function () {
        return (this.accountType() === 3);
    }
    this.accNum = function () {
        var accNum = this.accountNumber();
        return accNum.substr(accNum.length - 4, 4);
    }
    this.cardNum = function () {
        var cardNum = this.numberString();
        return cardNum.substr(cardNum.length - 4, 4);
    }
    this.addToZenAccount = function (zenAccount) {
        if (zenAccount.type === 'checking') {
            zenAccount.type = 'ccard';
            zenAccount.title = this.cardNum();
            zenAccount.creditLimit = this.creditLimit();
            zenAccount.balance = zenAccount.balance - zenAccount.creditLimit;
        }
        zenAccount.syncID.push(this.cardNum());
    }

    this.accountNumber = function () {
        return g_soap.getValue(_nodes, 'accountNumber');
    }
    this.accountType = function () {
        return Number(g_soap.getValue(_nodes, 'accountType'));
    }
    this.androidPaySupport = function () {
        return (g_soap.getValue(_nodes, 'androidPaySupport') === 'true');
    }
    this.appleWalletSupport = function () {
        return (g_soap.getValue(_nodes, 'appleWalletSupport') === 'true');
    }
    this.balance = function () {
        return Number(g_soap.getValue(_nodes, 'balance'));
    }
    this.cardName = function () {
        return g_soap.getValue(_nodes, 'cardName');
    }
    this.currency = function () {
        return g_soap.getValue(_nodes, 'currency');
    }
    this.expirationDate = function () {
        return g_soap.getValue(_nodes, 'expirationDate');
    }
    this.holdedFunds = function () {
        return Number(g_soap.getValue(_nodes, 'holdedFunds'));
    }
    this.holderName = function () {
        return g_soap.getValue(_nodes, 'holderName');
    }
    this.id = function () {
        return g_soap.getValue(_nodes, 'id');
    }
    this.isCorporate = function () {
        return (g_soap.getValue(_nodes, 'isCorporate') === 'true');
    }
    this.isMain = function () {
        return (g_soap.getValue(_nodes, 'main') === 'true');
    }
    this.minimalCreditPayment = function () {
        return Number(g_soap.getValue(_nodes, 'minimalCreditPayment'));
    }
    this.nextCreditPaymentDate = function () {
        return g_soap.getValue(_nodes, 'nextCreditPaymentDate');
    }
    this.numberString = function () {
        return g_soap.getValue(_nodes, 'number');
    }
    this.onlineId = function () {
        return g_soap.getValue(_nodes, 'onlineId');
    }
    this.openDate = function () {
        return g_soap.getValue(_nodes, 'openDate');
    }
    this.shortType = function () {
        return g_soap.getValue(_nodes, 'shortType');
    }
    this.state = function () {
        return Number(g_soap.getValue(_nodes, 'state'));
    }
    this.totalCreditDebtAmount = function () {
        return Number(g_soap.getValue(_nodes, 'totalCreditDebtAmount'));
    }
    this.type = function () {
        return g_soap.getValue(_nodes, 'type');
    }
    this.vendor = function () {
        return g_soap.getValue(_nodes, 'vendor');
    }
};

/**
 * Парсит кредит из R-Connect в соответствии с wsdl-схемой
 *
 * @class
 * @param {Array.<marknote.Element>} nodes Массив xml-элементов
 */
var Loan = function (nodes) {
    var _nodes = nodes || new marknote.Element('');

    this.nodes = function () {
        return _nodes;
    }
    this.zenId = function () {
        return 'loan:' + this.id();
    }
    this.loanNum = function () {
        var loanNum = this.id();
        return loanNum.substr(loanNum.length - 4, 4);
    }
    this.toZenAccount = function () {
        // <currency> contains a string that looks like 'bmw.curr.rur'
        var currency = this.currency().toUpperCase();
        currency = currency.substr(currency.length - 3, 3);

        var paymentRest = Number('-' + this.paymentRest());

        var startDate = +new Date(this.openDate().substr(0, 10));
        startDate = startDate / 1000;
        var endDate = +new Date(this.closeDate().substr(0, 10));
        endDate = endDate / 1000;
        var dateOffset = Math.round(Number((endDate - startDate) / (30 * 24 * 60 * 60)));

        var zenAccount = {
            type: 'loan',
            id: this.zenId(),
            title: this.id(),
            syncID: this.loanNum(),
            instrument: currency,
            balance: paymentRest,
            percent: this.intrestRate(),
            capitalization: true,
            startDate: startDate,
            endDateOffset: dateOffset,
            endDateOffsetInterval: 'month',
            payoffStep: 1,
            payoffInterval: 'month'
        };
        return zenAccount;
    }

    this.closeDate = function () {
        return g_soap.getValue(_nodes, 'closeDate');
    }
    this.currency = function () {
        return g_soap.getValue(_nodes, 'currency');
    }
    this.id = function () {
        return g_soap.getValue(_nodes, 'id');
    }
    this.intrestRate = function () {
        return Number(g_soap.getValue(_nodes, 'intrestRate'));
    }
    this.loanAmount = function () {
        return Number(g_soap.getValue(_nodes, 'loanAmount'));
    }
    this.nextPaymentAmount = function () {
        return Number(g_soap.getValue(_nodes, 'nextPaymentAmount'));
    }
    this.nextPaymentDate = function () {
        return g_soap.getValue(_nodes, 'nextPaymentDate');
    }
    this.openDate = function () {
        return g_soap.getValue(_nodes, 'openDate');
    }
    this.paidLoanAmount = function () {
        return Number(g_soap.getValue(_nodes, 'paidLoanAmount'));
    }
    this.paidLoanIntrest = function () {
        return Number(g_soap.getValue(_nodes, 'paidLoanIntrest'));
    }
    this.paymentRest = function () {
        return Number(g_soap.getValue(_nodes, 'paymentRest'));
    }
    this.status = function () {
        return g_soap.getValue(_nodes, 'status');
    }
    this.subtype = function () {
        return g_soap.getValue(_nodes, 'subtype');
    }
    this.type = function () {
        return g_soap.getValue(_nodes, 'type');
    }
};

/**
 * Парсит вклад из R-Connect в соответствии с wsdl-схемой
 *
 * @class
 * @param {Array.<marknote.Element>} nodes Массив xml-элементов
 */
var Deposit = function (nodes) {
    var _nodes = nodes || new marknote.Element('');

    this.nodes = function () {
        return _nodes;
    }
    this.zenId = function () {
        return 'deposit:' + this.id();
    }
    this.depositNum = function () {
        var depositNum = this.accountNumber();
        return depositNum.substr(depositNum.length - 4, 4);
    }
    this.toZenAccount = function () {
        // <currency> contains a string that looks like 'bmw.curr.rur'
        var currency = this.currency().toUpperCase();
        currency = currency.substr(currency.length - 3, 3);

        var paymentRest = Number('-' + this.paymentRest());

        var startDate = +new Date(this.openDate().substr(0, 10));
        startDate = startDate / 1000;
        var endDate = +new Date(this.closeDate().substr(0, 10));
        endDate = endDate / 1000;
        var dateOffset = Math.round(Number((endDate - startDate) / (30 * 24 * 60 * 60)));

        var zenAccount = {
            type: 'deposit',
            id: this.zenId(),
            title: this.names(),
            syncID: this.depositNum(),
            instrument: currency,
            balance: this.currentAmount(),
            startBalance: this.initialAmount(),
            percent: this.interestRate(),
            capitalization: this.capitalization(),
            startDate: startDate,
            endDateOffset: this.daysQuantity(),
            endDateOffsetInterval: 'day',
            payoffStep: 1,
            payoffInterval: 'month'
        };
        return zenAccount;
    }

    this.accountNumber = function () {
        return g_soap.getValue(_nodes, 'accountNumber');
    }
    this.capitalization = function () {
        return (g_soap.getValue(_nodes, 'capitalization') === 'true');
    }
    this.closeDate = function () {
        return g_soap.getValue(_nodes, 'closeDate');
    }
    this.currency = function () {
        return g_soap.getValue(_nodes, 'currency');
    }
    this.currentAmount = function () {
        return Number(g_soap.getValue(_nodes, 'currentAmount'));
    }
    this.daysQuantity = function () {
        return Number(g_soap.getValue(_nodes, 'daysQuantity'));
    }
    this.depositTypeId = function () {
        return Number(g_soap.getValue(_nodes, 'depositTypeId'));
    }
    this.description = function () {
        return g_soap.getValue(_nodes, 'description');
    }
    this.frequency = function () {
        return g_soap.getValue(_nodes, 'frequency');
    }
    this.id = function () {
        return g_soap.getValue(_nodes, 'id');
    }
    this.initialAmount = function () {
        return Number(g_soap.getValue(_nodes, 'initialAmount'));
    }
    this.initialStartAmount = function () {
        return Number(g_soap.getValue(_nodes, 'initialStartAmount'));
    }
    this.interestRate = function () {
        return Number(g_soap.getValue(_nodes, 'interestRate'));
    }
    this.lastIntrestChargeDate = function () {
        return g_soap.getValue(_nodes, 'lastIntrestChargeDate');
    }
    this.names = function () {
        return g_soap.getValue(_nodes, 'names');
    }
    this.occuredInterest = function () {
        return Number(g_soap.getValue(_nodes, 'occuredInterest'));
    }
    this.openDate = function () {
        return g_soap.getValue(_nodes, 'openDate');
    }
    this.rollover = function () {
        return (g_soap.getValue(_nodes, 'rollover') === 'true');
    }
    this.status = function () {
        return g_soap.getValue(_nodes, 'status');
    }
    this.totalInterest = function () {
        return Number(g_soap.getValue(_nodes, 'totalInterest'));
    }
};

/**
 * Парсит транзакцию по карте из R-Connect в соответствии с wsdl-схемой
 *
 * @class
 * @param {Array.<marknote.Element>} nodes Массив xml-элементов
 */
var CardTransaction = function (nodes) {
    var _nodes = nodes || new marknote.Element('');

    this.nodes = function () {
        return _nodes;
    }
    this.isOutcome = function () {
        return (this.type() === 0);
    }
    this.isIncome = function () {
        return (this.type() === 1);
    }
    this.toZenTransaction = function (zenAccount) {
        var date = new Date(this.entryDate().substr(0, 10));

        //if (this.merchantType() === 'ATM')  // MCC
        //    zenTrans.outcomeAccount = 'cash#' + this.currency();

        var zenTrans = {
            date: Math.round(date.getTime() / 1000),
            outcome: 0,
            outcomeAccount: zenAccount.id,
            income: 0,
            incomeAccount: zenAccount.id,
            payee: this.merchant(),
            //mcc: mcc
        };

        if (this.isOutcome())
            zenTrans.outcome = this.billingAmount();
        else
            zenTrans.income = this.billingAmount();

        if (zenAccount.instrument !== this.currency()) {
            if (this.isOutcome()) {
                zenTrans.opOutcome = this.amount();
                zenTrans.opOutcomeInstrument = this.currency();
            }
            else {
                zenTrans.opIncome = this.amount();
                zenTrans.opIncomeInstrument = this.currency();
            }
        }

        return zenTrans;
    }

    // Сумма в валюте операции
    this.amount = function () {
        return Number(g_soap.getValue(_nodes, 'amount'));
    }
    // Сумма в валюте счёта
    this.billingAmount = function () {
        return Number(g_soap.getValue(_nodes, 'billingAmount'));
    }
    this.commitDate = function () {
        return g_soap.getValue(_nodes, 'commitDate');
    }
    this.currency = function () {
        var curr = g_soap.getValue(_nodes, 'currency');
        if (curr === 'RUB')
            curr = 'RUR';
        return curr;
    }
    this.entryDate = function () {
        return g_soap.getValue(_nodes, 'entryDate');
    }
    this.id = function () {
        return g_soap.getValue(_nodes, 'id');
    }
    this.merchant = function () {
        return g_soap.getValue(_nodes, 'merchant');
    }
    this.merchantCity = function () {
        return g_soap.getValue(_nodes, 'merchantCity');
    }
    this.merchantCountry = function () {
        return g_soap.getValue(_nodes, 'merchantCountry');
    }
    this.merchantType = function () {
        return g_soap.getValue(_nodes, 'merchantType');
    }
    this.status = function () {
        return g_soap.getValue(_nodes, 'status');
    }
    this.type = function () {
        return Number(g_soap.getValue(_nodes, 'type'));
    }
};

/**
 * Парсит операцию по счёту из R-Connect в соответствии с wsdl-схемой
 *
 * @class
 * @param {Array.<marknote.Element>} nodes Массив xml-элементов
 */
var AccountMovement = function (nodes) {
    var _nodes = nodes || new marknote.Element('');

    this.nodes = function () {
        return _nodes;
    }
    this.isOutcome = function () {
        return (this.type() === 0);
    }
    this.isIncome = function () {
        return (this.type() === 1);
    }
    this.toZenTransaction = function (zenAccount) {
        var date = new Date(this.commitDate().substr(0, 10));
        var zenTrans = {
            id: this.id(),
            date: Math.round(date.getTime() / 1000),
            outcome: 0,
            outcomeAccount: zenAccount.id,
            income: 0,
            incomeAccount: zenAccount.id,
            payee: this.fullDescription()
        };
        if (zenTrans.payee === '')
            zenTrans.payee = this.shortDescription();

        if (this.isOutcome())
            zenTrans.outcome = this.amount();
        else
            zenTrans.income = this.amount();

        if (zenAccount.instrument !== this.currency()) {
            if (this.isOutcome()) {
                zenTrans.opOutcome = this.amount();
                zenTrans.opOutcomeInstrument = this.currency();
            }
            else {
                zenTrans.opIncome = this.amount();
                zenTrans.opIncomeInstrument = this.currency();
            }
        }

        return zenTrans;
    }

    this.amount = function () {
        return Number(g_soap.getValue(_nodes, 'amount'));
    }
    this.commitDate = function () {
        return g_soap.getValue(_nodes, 'commitDate');
    }
    this.currency = function () {
        return g_soap.getValue(_nodes, 'currency');
    }
    this.entryDate = function () {
        return g_soap.getValue(_nodes, 'entryDate');
    }
    this.fullDescription = function () {
        return g_soap.getValue(_nodes, 'fullDescription');
    }
    this.id = function () {
        return g_soap.getValue(_nodes, 'id');
    }
    this.movementStatus = function () {
        return g_soap.getValue(_nodes, 'movementStatus');
    }
    this.shortDescription = function () {
        return g_soap.getValue(_nodes, 'shortDescription');
    }
    this.type = function () {
        return Number(g_soap.getValue(_nodes, 'type'));
    }
};

/**
 * Парсит платёж по кредиту из R-Connect в соответствии с wsdl-схемой
 *
 * @class
 * @param {Array.<marknote.Element>} nodes Массив xml-элементов
 */
var LoanPayment = function (nodes) {
    var _nodes = nodes || new marknote.Element('');

    this.nodes = function () {
        return _nodes;
    }
    this.toZenTransaction = function (zenAccount) {
        var date = new Date(this.commitDate().substr(0, 10));

        var zenTrans = {
            id: this.id(),
            date: Math.round(date.getTime() / 1000),
            outcome: 0,
            outcomeAccount: zenAccount.id,
            income: this.intrestPayment() + this.loanAmountPayment(),
            incomeAccount: zenAccount.id
        };
        return zenTrans;
    }

    this.commitDate = function () {
        return g_soap.getValue(_nodes, 'commitDate');
    }
    this.currency = function () {
        return g_soap.getValue(_nodes, 'currency');
    }
    this.entryDate = function () {
        return g_soap.getValue(_nodes, 'entryDate');
    }
    this.id = function () {
        return g_soap.getValue(_nodes, 'id');
    }
    this.intrestPayment = function () {
        return Number(g_soap.getValue(_nodes, 'intrestPayment'));
    }
    this.loanAmountPayment = function () {
        return Number(g_soap.getValue(_nodes, 'loanAmountPayment'));
    }
};
