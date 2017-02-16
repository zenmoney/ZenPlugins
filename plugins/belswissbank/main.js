var main = (function (_, utils, BSB, ZenMoney, errors) {
    function isAccountSkipped(id) { // common cargo cult?
        return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
    }

    function ensureDeviceId() {
        var deviceId = ZenMoney.getData('deviceId');
        if (!deviceId) {
            deviceId = utils.generateUUID();
            ZenMoney.setData('deviceId', deviceId);
            ZenMoney.saveData();
        }
        return deviceId;
    }

    function formatDetailsDateTime(date) {
        // year-month-day hours:minutes:seconds
        return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(utils.toAtLeastTwoDigitsString).join('-') + ' ' +
            [date.getHours(), date.getMinutes(), date.getSeconds()].map(utils.toAtLeastTwoDigitsString).join(':');
    }

    function login() {
        var deviceId = ensureDeviceId();
        var prefs = ZenMoney.getPreferences();
        var username = prefs.username;
        var password = prefs.password;
        if (!username || !password) {
            throw errors.fatal('Credentials are missing');
        }

        var authStatus = BSB.authorize(username, password, deviceId);
        switch (authStatus.userStatus) {
            case 'WAITING_CONFIRMATION':
            case 'SMS_WAS_SENT':
                var prompt = 'Для доступа к банку Вам надо ввести код, который был выслан на ваш телефон СМС сообщением.';
                var retrievedInput = ZenMoney.retrieveCode(prompt, null, {
                    inputType: "numberDecimal",
                    time: 18E4
                });

                if (!/^\d+$/.test(retrievedInput)) {
                    throw errors.temporal('Numeric SMS code was expected.');
                }

                var confirmationCode = Number(retrievedInput);
                BSB.confirm(deviceId, confirmationCode);
                break;
            case 'OK':
                break;
            default:
                throw errors.temporal('auth userStatus is ' + authStatus.userStatus);
        }
    }

    function calculateAccountId(card) {
        return card.cardId.toString();
    }

    function mergeTransferTransactions(transactionsForAccounts) {
        var transactionReplacements = _.chain(transactionsForAccounts)
            .pluck('transfers')
            .flatten()
            .groupBy(_.property('transferId'))
            .reduce(function (transactionReplacements, items, transferId) {
                var transactions = items.map(_.property('transaction'));
                var isNonAmbiguousPair = transactions.length === 2;
                if (isNonAmbiguousPair) {
                    var sorted = _.sortBy(transactions, _.property('income'));
                    var outcomeTransaction = _.omit(sorted[0], 'income', 'incomeAccount');
                    var incomeTransaction = _.omit(sorted[1], 'outcome', 'outcomeAccount');
                    transactionReplacements[outcomeTransaction.id] = _.defaults.apply(_, [
                        {id: outcomeTransaction.id + '+' + incomeTransaction.id},
                        incomeTransaction,
                        outcomeTransaction
                    ]);
                    transactionReplacements[incomeTransaction.id] = null;
                } else {
                    utils.log('cannot merge non-pair transfer #' + transferId + ', groupSize=' + items.length, 'warn');
                }
                return transactionReplacements;
            }, {})
            .value();
        return transactionsForAccounts.map(function (accountTransactions) {
            var transactions = _.compact(accountTransactions.transactions.map(function (transaction) {
                var replacement = transactionReplacements[transaction.id];
                return _.isUndefined(replacement) ? transaction : replacement;
            }));
            return _.defaults({transactions: transactions}, accountTransactions);
        });
    }

    function processCards(cards) {
        return cards.filter(function (card) {
            return !isAccountSkipped(calculateAccountId(card));
        }).map(processCard);
    }

    function processCard(card) {
        var lastFourDigits = card.maskedCardNumber.slice(-4);
        var accountCurrency = BSB.getIsoCurrency(card.currency);
        var account = {
            id: calculateAccountId(card),
            title: card.name,
            type: 'ccard',
            syncID: [lastFourDigits],
            instrument: accountCurrency,
            balance: card.amount
        };

        var lastSeenBsbTransaction = ZenMoney.getData('lastSeenBsbTransactionFor' + account.id, {
            cardTransactionId: 0,
            accountRest: 0,
            transactionDate: BSB.bankBirthday.valueOf()
        });

        var syncFrom = new Date(lastSeenBsbTransaction.transactionDate);
        var syncTo = new Date();

        utils.log(
            'fetching transactions for ' + utils.toReadableJson({
                accountId: account.id,
                from: formatDetailsDateTime(syncFrom),
                to: formatDetailsDateTime(syncTo)
            }), 'info');

        var bsbTransactions = _.chain(BSB.getTransactions(card.cardId, syncFrom, syncTo))
            .filter(function (transaction) {
                return transaction.transactionType !== 'Otkaz' &&
                    transaction.transactionAmount > 0 &&
                    transaction.cardTransactionId > lastSeenBsbTransaction.cardTransactionId;
            })
            .sortBy(_.property('cardTransactionId'))
            .value();
        var newLastSeenBsbTransaction = _.last(bsbTransactions);
        return bsbTransactions
            .reduce(function (result, transaction, index, transactions) {
                var factor = BSB.getFactor(transaction);
                var transactionDelta = factor * transaction.transactionAmount;

                var transactionCurrency = transaction.transactionCurrency;
                var isCurrencyConversion = transactionCurrency !== accountCurrency;

                var previousTransaction = index === 0 ? lastSeenBsbTransaction : transactions[index - 1];
                if (transaction.accountRest === null) {
                    if (isCurrencyConversion) {
                        throw errors.fatal('cannot determine missing accountRest for currency conversion: ' + utils.toReadableJson(transaction));
                    }
                    transaction.accountRest = previousTransaction.accountRest + transactionDelta;
                }
                var accountDelta = isCurrencyConversion ?
                    transaction.accountRest - previousTransaction.accountRest :
                    transactionDelta;

                var zenMoneyTransaction = {
                    id: transaction.cardTransactionId.toString(),
                    date: transaction.transactionDate,
                    payee: _.compact([transaction.countryCode, transaction.city, transaction.transactionDetails]).join('/'),
                    comment: formatDetailsDateTime(new Date(transaction.transactionDate))
                };
                result.transactions.push(zenMoneyTransaction);

                var absAccountDelta = Math.abs(accountDelta);
                var absTransactionDelta = Math.abs(transactionDelta);

                if (isCurrencyConversion) {
                    zenMoneyTransaction.comment += '\n' + absTransactionDelta.toFixed(2) + ' ' + transactionCurrency;
                }
                var isIncome = factor >= 0;
                if (transaction.transactionType === 'Bankomat') { // cash
                    if (isIncome) {
                        throw errors.fatal('income via Bankomat is not supported: ' + utils.toReadableJson(transaction));
                    }
                    zenMoneyTransaction.income = absTransactionDelta;
                    zenMoneyTransaction.outcome = absAccountDelta;
                    zenMoneyTransaction.incomeAccount = 'cash#' + transactionCurrency;
                    zenMoneyTransaction.outcomeAccount = account.id;
                } else if (isIncome) { // income
                    zenMoneyTransaction.income = absAccountDelta;
                    zenMoneyTransaction.outcome = 0;
                    zenMoneyTransaction.incomeAccount = account.id;
                    zenMoneyTransaction.outcomeAccount = account.id;
                    if (isCurrencyConversion) {
                        zenMoneyTransaction.opIncome = absTransactionDelta;
                        zenMoneyTransaction.opIncomeInstrument = transactionCurrency;
                    }
                } else { // outcome
                    zenMoneyTransaction.income = 0;
                    zenMoneyTransaction.outcome = absAccountDelta;
                    zenMoneyTransaction.incomeAccount = account.id;
                    zenMoneyTransaction.outcomeAccount = account.id;
                    if (isCurrencyConversion) {
                        zenMoneyTransaction.opOutcome = absTransactionDelta;
                        zenMoneyTransaction.opOutcomeInstrument = transactionCurrency;
                    }
                }
                if (transaction.transactionDetails === 'PERSON TO PERSON I-B BSB') {
                    result.transfers.push({
                        transferId: [transaction.transactionDate, absTransactionDelta, transaction.transactionCurrency].join('|'),
                        transaction: zenMoneyTransaction
                    });
                }
                return result;
            }, {
                account: account,
                transactions: [],
                transfers: [],
                onBeforeSave: newLastSeenBsbTransaction
                    ? function () {
                        var data = _.pick(newLastSeenBsbTransaction, 'accountRest', 'transactionDate', 'cardTransactionId');
                        ZenMoney.setData('lastSeenBsbTransactionFor' + account.id, data);
                        ZenMoney.saveData();
                    }
                    : _.noop
            });
    }

    return function main() {
        utils.log('alive @' + Date.now(), 'info');

        login();

        mergeTransferTransactions(processCards(BSB.getCards())).forEach(function (accountTransactions) {
            var account = accountTransactions.account;
            var transactions = accountTransactions.transactions;
            var onBeforeSave = accountTransactions.onBeforeSave;

            ZenMoney.addAccount(account);
            if (transactions.length) {
                ZenMoney.addTransaction(transactions);
                utils.log('added ' + transactions.length + ' transaction(s) for account ' + account.id, 'info');
            }
            onBeforeSave();
        });

        ZenMoney.setResult({success: true});
    }
})(_, utils, BSB, ZenMoney, errors);
