var BASE_URL = 'https://online.raiffeisen.ru';

function isAccountSkipped(accountId) {
    return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(accountId);
}

var util = {
    today: function () {
        var now = new Date();
        return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDay(), 0, 0, 0));
    },

    dateFormat: function (date) {
        var dateParts = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDay()];
        return dateParts.map(util.zeroPrefix).join('-');
    },

    dateTimeFormat: function (date) {
        var timeParts = [date.getUTCHours(), date.getUTCMinutes()];
        return util.dateFormat(date) + 'T' + timeParts.map(util.zeroPrefix).join(':');
    },

    zeroPrefix: function (num) {
        return (num < 10) ? '0' + num.toFixed(0) : num.toFixed(0);
    },
};


/**
 * Logs with level.
 *
 * @param      {string}  level
 * @return     {logLevelCallback}
 */
function logLevel(level) {
    return function () {
        var msg = Array.prototype.slice.call(arguments).map(
            function (item) {
                return (typeof item === 'object') ? JSON.stringify(item) : item;
            }
        ).join(' ');
        ZenMoney.trace(msg, level);
    };
}

/**
 * @callback logLevelCallback
 * @param {...string} some text for logger
 */

var log = {
    error: logLevel('error'),
    warn: logLevel('warn'),
    info: logLevel('info'),
    debug: logLevel('debug'),
};

/**
 * Account types
 * @typedef {('card'|'account'|'loan'|'deposit')} AccountType
 */

/**
 * @class      Bank (name)
 * @param      {string}  url - Base url
 * @param      {ZenMoney}  zenmoney
 */
var Bank = function (url) {
    this.baseUrl = url;
};

Bank.prototype = {

    /**
     * Login
     *
     * @param      {!string}  username
     * @param      {!string}  password
     * @return     {bool}  Successful auth
     */
    login: function (username, password) {
        // TODO: add captcha
        log.info('auth');
        var data = this._request('/login', {username: username, password: password}, 'POST');
        return Boolean(data.lastLogin);
    },

    /**
     * Logout
     *
     * @param      {!string}  login
     * @param      {!string}  password
     * @return     {bool}  Successful auth
     */
    logout: function () {
        log.info('logout');
        this._request('/logout', 'POST');
    },


    /**
     * Fetch accounts.
     *
     * @param      {!AccountType}  type
     * @return     {Object}  server response
     */
    fetchAccounts: function (type) {
        log.info('fetchAccounts', type);
        return this._request('/rest/' + type);
    },

    /**
     * Fetch transactions.
     * @param      {Object} params
     * @param      {!AccountType}  params.type
     * @param      {!string}       params.id              Account id
     * @param      {!Date}         params.from            DateTime
     * @param      {Date}          [params.to=today]      DateTime
     * @return     {Transaction[]}  transactions.
     */
    fetchTransactions: function (params) {
        log.info('fetchTransactions');
        // format: /rest/<type>/<id>/transaction?from=<from>&to=<to>order=desc&page=0&size=100&sort=date
        // example: /rest/card/11111/transaction?detailRequired=true&from=2017-01-27T00:00&order=desc&page=0&size=15&sort=date&to=2017-02-27T23:59
        params.to = (typeof params.to === 'object') ? params.to : util.today();
        params.to.setUTCHours(23);
        params.to.setUTCMinutes(59);

        params.from.setUTCHours(0);
        params.from.setUTCMinutes(0);

        var reqParams = {
            from: util.dateTimeFormat(params.from),
            to: util.dateTimeFormat(params.to),
            order: 'desc',
            sort: 'date',
            page: 0,
            size: 100,
        };
        var result = [];
        var total = 1;
        for (var p = 0; result.length < total; p++) {
            reqParams.page = p;
            var resp = this._request('/rest/' + params.type + '/' + params.id + '/transaction', reqParams);
            try {
                total = resp.total;
                result = result.concat(resp.list);
            } catch (e) {
                throw new ZenMoney.Error('Transaction response must contains had "total" and "list" property\n'
                                     + e.message);
            }
        }

        // Add accountId to transaction
        result = result.map(function (trans) {
            trans.accountId = params.id;
            return trans;
        });
        return result;
    },


    /**
     * Convert bank account to ZenMoney account
     *
     * @param      {!AccountType}    accountType
     * @param      {BankAccount}    acc
     * @return     {ZmAccount?}
     */
    convertAccountToZM: function (accountType, acc) {
        log.info('Convert account', acc.cba, acc.pan);
        var zmAcc = {
            id: acc.id.toString(),
            title: acc.name || acc.type.name + ' ' + acc.id,
            syncID: [acc.cba.substr(-4)],
            instrument: acc.currencyId,
        };

        if (accountType === 'card') {
            zmAcc.syncID.push(acc.pan.substr(-4));
            zmAcc.type = 'ccard';
            zmAcc.balance = acc.balance;
            zmAcc.startBalance = 0;
            zmAcc.savings = false;

            if (acc.type.id !== 2) {
                // Drop debit cards, use account instead
                zmAcc = undefined;
            }
        } else if (accountType === 'account') {
            zmAcc.type = 'checking';
            zmAcc.balance = acc.balance;
            zmAcc.startBalance = 0;
            zmAcc.savings = false;

            if (acc.cards) {
                acc.cards.forEach(function (card) {
                    zmAcc.syncID.push(card.pan.substr(-4));
                });
            }
        } else if (accountType === 'loan') {
            zmAcc.type = 'loan';
            zmAcc.balance = acc.paidDebt;
            zmAcc.capitalization = true;
            zmAcc.savings = false;
            zmAcc.percent = acc.rate;
            zmAcc.startBalance = acc.start;
            zmAcc.startDate = acc.open.split('T')[0];
            if (acc.frequency.id === 'M') {
                zmAcc.payoffStep = 1;
                zmAcc.payoffInterval = 'month';
                zmAcc.endDateOffsetInterval = 'month';
                // Compute endDateOffset from open and close date
                var loanOpen = new Date(acc.open);
                var loanClose = new Date(acc.close);
                var loanYears = (loanClose.getFullYear() - loanOpen.getFullYear());
                var loanMonth = (loanYears * 12) + loanClose.getUTCMonth() - loanOpen.getUTCMonth();
                zmAcc.endDateOffset = loanMonth;
            }
        } else if (accountType === 'deposit') {
            // TODO process deposit account
            zmAcc.type = 'deposit';
        } else {
            throw new ZenMoney.Error('Unknow accountType "' + accountType + '"');
        }

        log.debug(zmAcc);
        return zmAcc;
    },

    /**
     * Convert bank transaction to ZenMoney transaction
     *
     * @param      {BankTransaction}  trans
     * @return     {ZmTransaction}
     */
    convertTransactionToZM: function (trans) {
        // TODO: covert loan transactions
        // TODO: covert deposit transactions
        log.debug(trans);

        var result = {
            date: trans.date.split('T')[0],
            payee: trans.note,
        };

        var amount = Math.abs(trans.amount);
        var billAmount = Math.abs(trans.billAmount);
        if (trans.billAmount > 0) {
            result.income = billAmount;
            result.outcome = amount;
            result.incomeAccount = trans.accountId;
            result.outcomeAccount = 'cash#' + trans.currencyId;

            if (trans.currencyId !== trans.billCurrencyId) {
                result.opIncomeInstrument = trans.currencyId;
                result.opIncome = amount;
                result.opOutcomeInstrument = trans.billCurrencyId;
                result.opOutcome = billAmount;
            }
        } else {
            result.outcome = billAmount;
            result.income = amount;
            result.outcomeAccount = trans.accountId;
            result.incomeAccount = 'cash#' + trans.currencyId;

            if (trans.currencyId !== trans.billCurrencyId) {
                result.opIncomeInstrument = trans.billCurrencyId;
                result.opIncome = billAmount;
                result.opOutcomeInstrument = trans.currencyId;
                result.opOutcome = amount;
            }
        }

        log.debug(result);
        return result;
    },


    _requestHeaders: {
        'Accept': 'application/json',
    },

    /**
     * Server request
     *
     * @param      {!string}  uri    - URI part
     * @param      {Object}  data   - Payload data
     * @param      {'GET'|'POST'} [method='GET']   - HTTP method
     * @return     {Object} Server response
     */
    _request: function (uri, data, method) {
        var method = method || 'GET';
        var formatedData;
        if (data) {
            formatedData = Object.keys(data)
                                .map(function (key) {
                                    return key + '=' + encodeURIComponent(data[key]);
                                })
                                .join('&');
        }

        var url = this.baseUrl + uri;

        if (method === 'GET' && formatedData) {
            url += '?' + formatedData;
            formatedData = null;
        }

        log.debug(method, url);
        var responseData = ZenMoney.request(method, url, formatedData, this._requestHeaders);
        var responseStatus = ZenMoney.getLastStatusCode();
        log.debug('response status: ', responseStatus);
        log.debug('response data: ', responseData);
        if (responseStatus !== 200) {
            throw new ZenMoney.Error('Server return error status code ' + responseStatus);
        } else {
            try {
                return JSON.parse(responseData);
            } catch (e) {
                log.error('Bad json ' + e.message + ': ' + responseData);
                throw new ZenMoney.Error('Server return error response: ' + e.message);
            }
        }
    },
};

/**
 * Main
 */
function main () {
    ZenMoney.setDefaultCharset('utf8');
    var preferences = ZenMoney.getPreferences();
    var bank = new Bank(BASE_URL);
    var transactionPeriod = preferences.period || 31;

    if (!preferences.login) throw new ZenMoney.Error('Введите логин в интернет-банк!', null, true);
    if (!preferences.password) throw new ZenMoney.Error('Введите пароль в интернет-банк!', null, true);

    bank.login(preferences.login, preferences.password);
    // Add accounts
    var accounts = {
        'card': [],
        'account': [],
        // 'loan': [],
        // 'deposit': [],
    };
    Object.keys(accounts).forEach(function (accountType) {
        bank.fetchAccounts(accountType)
            .forEach(function (account) {
                var zmAccount = bank.convertAccountToZM(accountType, account);
                if (zmAccount && !isAccountSkipped(zmAccount.id)) {
                    accounts[accountType].push(zmAccount);
                }
            });

        ZenMoney.addAccount(accounts[accountType]);

        // Process transactions
        accounts[accountType].forEach(function (acc) {
            // TODO: start sync from ZenMoney.getData('lastSync');
            var fromDate = util.today();
            fromDate.setUTCDate(fromDate.getUTCDate() - transactionPeriod);
            var transactions = bank
                .fetchTransactions({type: accountType, id: acc.id, from: fromDate})
                .map(bank.convertTransactionToZM);
            ZenMoney.addTransaction(transactions);
        });
    });

    ZenMoney.setData('lastSync', Date.now());
    ZenMoney.saveData();
    ZenMoney.setResult({success: true});
    bank.logout();
}

