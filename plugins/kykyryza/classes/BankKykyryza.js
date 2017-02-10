function BankKykyryza() {
    var contractToAccount = {};

    /**
     * Get card number
     *
     * @returns {string}
     */
    this.getCardNumber = function() {
        var cardNumber = ZenMoney.getData('card_number');
        if (!cardNumber) {
            ZenMoney.trace("Штрих-код карты");
            cardNumber = ZenMoney.retrieveCode(
                "Номер штрих-кода карты",
                null,
                {
                    inputType: "number",
                    time: 18E4
                }
            );

            ZenMoney.setData("card_number", cardNumber);
        }

        return cardNumber;
    };

    /**
     * Get password
     *
     * @returns {*}
     */
    this.getPassword = function() {
        var password = ZenMoney.getData('password');
        if (!password) {
            ZenMoney.trace("Пароль");
            password = ZenMoney.retrieveCode(
                "Пароль",
                null,
                {
                    inputType: "textPassword",
                    time: 18E4
                }
            );

            ZenMoney.setData("password", password);
        }

        return password;
    };

    this.prepareAccountsData = function(rawData) {
        return rawData.map(function (account) {
            var _instrument = null;
            var _balance    = null;
            account.equities.forEach(function (equity) {
                if (equity.type == 'FUNDS') {
                    _instrument = equity.currencyCode == 'RUR' ? 'RUB' : equity.currencyCode;
                    _balance    = equity.amount * 1;
                }
            });

            // дополнительная информация для операций
            contractToAccount[account.contractId.toString()] = account.id.toString();

            return {
                id:           account.id.toString(),
                title:        account.name,
                type:         'ccard',
                instrument:   _instrument,
                balance:      _balance,
                startBalance: 0,
                creditLimit:  0,
                syncID:       account.panTail
            };
        });
    };

    /**
     * @param rawData
     * @returns {Array}
     */
    this.prepareOperationsData = function(rawData) {
        var operations = [];

        rawData.forEach(function (operation) {
            try {
                if (!operation.hasOwnProperty("money")) {
                    throw new ZenMoney.Error('Неизвестный тип транзакции');
                }

                var accountId = null;
                if (operation.hasOwnProperty("cardId")) {
                    accountId = operation.cardId.toString();
                } else {
                    if (operation.hasOwnProperty("contractId") && contractToAccount.hasOwnProperty(operation.contractId.toString())) {
                        accountId = contractToAccount[operation.contractId.toString()];
                    }
                }

                var item = {
                    id:             operation.id + '',
                    date:           operation.date,
                    comment:        operation.title,
                    outcome:        operation.money.income === false
                                        ? operation.money.accountAmount.amount
                                        : 0,
                    outcomeAccount: accountId,
                    income:         operation.money.income === true
                                        ? operation.money.accountAmount.amount
                                        : 0,
                    incomeAccount:  accountId
                };

                operations.push(item);
            } catch (e) {
//                console.log(e);
                ZenMoney.trace('Не удалось обработать данные для транзакции: ' + e.message + ' / ' + JSON.stringify(operation), 'error');
            }
        });

        return operations;
    };
}