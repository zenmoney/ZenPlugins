/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

/**
 * @constructor
 */
function BankEpayments() {
    /**
     * @param data
     * @returns {Array}
     */
    this.prepareAccountsData = function (data) {
        return data.map(function (dataItem) {
            var instrument = resolveInstrument(dataItem.cardCurrency);

            var syncID = [dataItem.id.substr(-4)];
            if (dataItem.hasOwnProperty('prevCardId') && dataItem.prevCardId !== null) {
                syncID.push(dataItem.prevCardId.substr(-4));
            }
            return {
                id:           dataItem.id,
                title:        'Карта ' + instrument,
                type:         'ccard',
                instrument:   instrument,
                balance:      dataItem.balance,
                startBalance: 0,
                creditLimit:  0,
                syncID:       syncID
            };
        });
    };

    /**
     * @param data
     * @returns {Array}
     */
    this.prepareWalletsData = function (data) {
        var wallets = [];

        data.forEach(function (dataItem) {
            dataItem.balances.forEach(function (subDataItem) {
                var accountId = uniqueWalletId(subDataItem.accountNumber, subDataItem.currency);

                wallets.push({
                    id:           accountId,
                    title:        subDataItem.accountType + ' '+ subDataItem.accountNumber + ' (' + resolveInstrument(subDataItem.currency) + ')',
                    type:         'checking',
                    instrument:   resolveInstrument(subDataItem.currency),
                    balance:      subDataItem.currentBalance * 1,
                    startBalance: 0,
                    creditLimit:  0,
                    syncID:       accountId
                });
            });
        });

        return wallets;
    };

    /**
     * @param data
     * @returns {Array}
     */
    this.prepareOperationsData = function (data) {
        var operations = [];

        data.forEach(function (dataItem) {
            try {
                var operation = {
                    id:      dataItem.transactionId.toString(),
                    date:    Date.parse(dataItem.operation.date),
                    comment: dataItem.details
                };

                var isIncome = dataItem.direction == 'In';

                var accountId;
                if (dataItem.source.type == 'card') {
                    accountId = uniqueCardId(dataItem.source.identity);
                } else if (dataItem.source.type == 'ewallet') {
                    accountId = uniqueWalletId(dataItem.source.identity, dataItem.currency);
                }

                operation.outcomeAccount = accountId;
                operation.incomeAccount  = accountId;
                operation.outcome        = isIncome ? 0 : dataItem.total;
                operation.income         = isIncome ? dataItem.total : 0;

                if (dataItem.operation.typeCode == 'Atm') { // снятие нала
                    operation.income        = dataItem.amount;
                    operation.incomeAccount = 'cash#' + resolveInstrument(dataItem.currency);
                }

                operations.push(operation);
            } catch (e) {
//                console.log(e);
                ZenMoney.trace('Не удалось обработать данные для транзакции: ' + e.message + ' / ' + JSON.stringify(dataItem), 'error-dataItem-prepare');
            }
        });

        return operations;
    };

    /**
     * @param code
     * @returns {string}
     */
    function resolveInstrument(code) {
        return code.toUpperCase();
    }

    /**
     * @param id
     * @returns {string}
     */
    function uniqueCardId(id) {
        return id;
    }

    /**
     * @param id
     * @param currency
     * @returns {string}
     */
    function uniqueWalletId(id, currency) {
        return id + '-' + resolveInstrument(currency);
    }
}
