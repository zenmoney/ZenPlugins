/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

/**
 * @constructor
 */
function BankKykyryza() {
    var contractToAccount   = {};
    var accountToInstrument = {};

    /**
     * @param data
     * @returns {Array}
     */
    this.prepareAccountsData = function (data) {
        return data.map(function (dataItem) {
            var _instrument = null;
            var _balance    = null;
            dataItem.equities.forEach(function (equity) {
                if (equity.type == 'FUNDS') {
                    _instrument = resolveInstrument(equity.currencyCode);
                    _balance    = equity.amount * 1;
                }
            });

            var accountId = uniqueCardId(dataItem.id);

            // дополнительная информация для операций
            contractToAccount[dataItem.contractId.toString()] = accountId;
            accountToInstrument[accountId]                    = _instrument;

            /**
             * временно добавляем в лог данные о типе и количестве денежных средств на карте
             * необходимо узнать как записывается кредитный лимит по карте
             */
            ZenMoney.trace("account equities: " + JSON.stringify(dataItem.equities), 'log-account-data');

            return {
                id:           accountId,
                title:        dataItem.name,
                type:         'ccard',
                instrument:   _instrument,
                balance:      _balance,
                startBalance: 0,
                creditLimit:  0,
                syncID:       dataItem.panTail
            };
        });
    };

    /**
     * @param data
     * @returns {Array}
     */
    this.prepareWalletsData = function (data) {
        return data.map(function (dataItem) {
            var accountId = uniqueWalletId(dataItem.id);

            return {
                id:           accountId,
                title:        dataItem.name,
                type:         'checking',
                instrument:   resolveInstrument(dataItem.currencyCode),
                balance:      dataItem.amount * 1,
                startBalance: 0,
                creditLimit:  0,
                syncID:       dataItem.ean
            };
        });
    };

    /**
     * @param data
     * @returns {Array}
     */
    this.prepareOperationsData = function (data) {
        var operations = [];

        data.forEach(function (dataItem) {
            try {
                if (!dataItem.hasOwnProperty("money")) {
                    throw new ZenMoney.Error('Неизвестный тип транзакции');
                }
                var _m       = dataItem.money;
                var isIncome = _m.income;

                var operation = {
                    id:      dataItem.id.toString(),
                    date:    dataItem.date,
                    comment: (dataItem.hasOwnProperty("typeName") ? dataItem.typeName + ': ' : '') + dataItem.title
                };

                var accountId = null;
                if (dataItem.hasOwnProperty("cardId")) {
                    accountId = uniqueCardId(dataItem.cardId);
                } else {
                    if (dataItem.hasOwnProperty("contractId") && contractToAccount.hasOwnProperty(dataItem.contractId.toString())) {
                        accountId = contractToAccount[dataItem.contractId.toString()];
                    }
                }

//                TYPES: "TRANSFER","WALLET","RECHARGE","ZKDP","DEPOSIT_PROC","CASH","FDT_RBS_COMMISSION","PAYMENT","PURCHASE"
                if (dataItem.type == 'WALLET') {
                    if (isIncome) {
                        operation.income        = _m.amount;
                        operation.incomeAccount = uniqueWalletId(dataItem.walletId);
                        operation.outcome        = _m.accountAmount.amount;
                        operation.outcomeAccount =  accountId;
                    } else {
                        operation.income        = _m.accountAmount.amount;
                        operation.incomeAccount =  accountId;
                        operation.outcome        = _m.amount;
                        operation.outcomeAccount = uniqueWalletId(dataItem.walletId);
                    }
                } else if (dataItem.type == 'ZKDP') { // Перевод «Золотая Корона»
                    operation.outcomeAccount = uniqueWalletId(dataItem.walletId);
                    operation.incomeAccount  = 'cash#' + resolveInstrument(_m.currency);
                    operation.outcome        = _m.amount;
                    operation.income         = _m.amount;
                } else {
                    var _amount   = _m.amount;
                    var _currency = _m.currency;
                    if (_m.hasOwnProperty('amountDetail')) {
                        _amount = _m.amountDetail.amount;
                    }
                    if (_m.hasOwnProperty('accountAmount')) {
                        _amount   = _m.accountAmount.amount;
                        _currency = _m.accountAmount.currency;
                    }

                    operation.outcomeAccount = accountId;
                    operation.incomeAccount  = accountId;
                    operation.outcome        = isIncome ? 0 : _amount;
                    operation.income         = isIncome ? _amount : 0;

                    /**
                     * Операция совершена в валюте отличной от валюты карты
                     */
                    if (_currency != _m.currency) {
                        if (isIncome) {
                            operation.opIncome           = _m.amount;
                            operation.opIncomeInstrument = resolveInstrument(_m.currency);
                        } else {
                            operation.opOutcome           = _m.amount;
                            operation.opOutcomeInstrument = resolveInstrument(_m.currency);
                        }
                    }

                    if (dataItem.hasOwnProperty("description")) {
                        operation.payee = dataItem.description;
                    }

                    if (dataItem.hasOwnProperty("paymentDetail")) {
                        operation.payee = dataItem.paymentDetail.depositBankName;
                    }

                    if (dataItem.type == 'RECHARGE' && isIncome) {
                        operation.outcome        = operation.income;
                        operation.outcomeAccount = 'cash#' + resolveInstrument(_currency);
                    }

                    if (dataItem.type == 'CASH' && !isIncome) { // снятие наличных
                        operation.income        = operation.outcome;
                        operation.incomeAccount = 'cash#' + resolveInstrument(_currency);
                    }

//                    if (dataItem.type == 'TRANSFER') {
//                        if (isIncome) {
//                            operation.outcome        = operation.income;
//                            operation.outcomeAccount = 'checking#' + resolveInstrument(_currency);
//                        } else {
//                            operation.income        = operation.outcome;
//                            operation.incomeAccount = 'checking#' + resolveInstrument(_currency);
//                        }
//                    }
                }

                if (dataItem.hasOwnProperty("mcc")) {
                    operation.mcc = dataItem.mcc.code * 1;
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
        return code == 'RUR' ? 'RUB' : code;
    }

    /**
     * @param id
     * @returns {string}
     */
    function uniqueCardId(id) {
        return 'c-' + id;
    }

    /**
     * @param id
     * @returns {string}
     */
    function uniqueWalletId(id) {
        return 'w-' + id;
    }
}
