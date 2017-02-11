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
                type:         'ccard', //'checking',
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
                    comment: dataItem.title
                };

                var accountId = null;
                if (dataItem.hasOwnProperty("cardId")) {
                    accountId = uniqueCardId(dataItem.cardId);
                } else {
                    if (dataItem.hasOwnProperty("contractId") && contractToAccount.hasOwnProperty(dataItem.contractId.toString())) {
                        accountId = contractToAccount[dataItem.contractId.toString()];
                    }
                }

                if (dataItem.props.indexOf('WALLET') == 1) {
                    // Операции с валютными кошельками рассматриваются со стороны кошелька, а не карты
                    var isWalletIncome = !isIncome;

                    dataItem.movements.forEach(function (movement) {
                        if (movement.income) {
                            operation.income        = movement.amount;
                            operation.incomeAccount = isWalletIncome ? accountId : uniqueWalletId(movement.walletId);
                        } else {
                            operation.outcome        = movement.amount;
                            operation.outcomeAccount = isWalletIncome ? uniqueWalletId(movement.walletId) : accountId;
                        }
                    });
                } else {
                    operation.outcomeAccount = accountId;
                    operation.incomeAccount  = accountId;
                    operation.outcome        = isIncome ? 0 : _m.accountAmount.amount;
                    operation.income         = isIncome ? _m.accountAmount.amount : 0;

                    /**
                     * Операция совершена в валюте отличной от валюты карты
                     */
                    if (!dataItem.props.indexOf('WALLET') && _m.accountAmount.currency != _m.currency) {
                        if (isIncome) {
                            operation.opIncome           = _m.amount;
                            operation.opIncomeInstrument = resolveInstrument(_m.currency);
                        } else {
                            operation.opOutcome           = _m.amount;
                            operation.opOutcomeInstrument = resolveInstrument(_m.currency);
                        }
                    }

                    if (dataItem.hasOwnProperty("mcc")) {
                        operation.mcc = dataItem.mcc.code * 1;
                    }

                    if (dataItem.hasOwnProperty("description")) {
                        operation.payee = dataItem.description;
                    }

                    if (dataItem.hasOwnProperty("paymentDetail")) {
                        operation.payee = dataItem.paymentDetail.depositBankName;
                    }

                    if (isIncome) {
                        if (dataItem.props.indexOf('RECHARGE') == 1) { // пополнение
                            operation.outcome = operation.income;
                            if (dataItem.props.indexOf('TRANSFER')) {
                                operation.outcomeAccount = 'cash#' + resolveInstrument(_m.accountAmount.currency);
                            } else {
                                operation.outcomeAccount = 'checking#' + resolveInstrument(_m.accountAmount.currency);
                            }
                        }
                    } else {
                        if (dataItem.props.indexOf('CASH') == 1) { // снятие нала
                            operation.income        = operation.outcome;
                            operation.incomeAccount = 'cash#' + resolveInstrument(_m.accountAmount.currency);
                        }
                    }
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
