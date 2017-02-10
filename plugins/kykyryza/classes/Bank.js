/**
 * @constructor
 */
function Bank() {
    /**
     * @param accounts
     */
    this.addAccounts = function(accounts) {
        accounts.forEach(function (account) {
            ZenMoney.trace("Обрабатываем счет: " + JSON.stringify(account), 'trace-account');

            try {
                ZenMoney.addAccount(account);
            } catch (exception) {
//                console.log(exception);
                ZenMoney.trace('Не удалось добавить счет: ' + JSON.stringify(account), 'error-account');
            }
        });
    };

    /**
     * @param operations
     */
    this.addOperations = function(operations) {
        operations.reverse().forEach(function (operation) {
            ZenMoney.trace("Обрабатываем транзакцию: " + JSON.stringify(operation), 'trace-operation');

            try {
                ZenMoney.addTransaction(operation);
            } catch (exception) {
//                console.log(exception);
                ZenMoney.trace('Не удалось добавить транзакцию: ' + JSON.stringify(operation), 'error-operation');
            }
        });
    };
}
