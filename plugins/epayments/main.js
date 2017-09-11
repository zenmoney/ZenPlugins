/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

function main() {
    var bank      = new Bank();
    var epayments = new BankEpayments();
    var request   = new Request();

    var preferences = ZenMoney.getPreferences();

    if (!preferences.login) throw new ZenMoney.Error("Введите номер телефона / e-mail!", false, true);
    if (!preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", false, true);

    request.auth(preferences.login, preferences.password);

    var userData = request.getUser();

    var accountsData = userData.cards;
    bank.addAccounts(epayments.prepareAccountsData(accountsData));

    var walletsData = userData.ewallets;
    bank.addAccounts(epayments.prepareWalletsData(walletsData));

    var operationsData = request.getOperations();
    var operations     = epayments.prepareOperationsData(operationsData);
    bank.addOperations(operations);

    if (operations.length > 0) {
        request.setLastSyncTime(parseInt(operations[operations.length - 1].date / 1000));
    }

    ZenMoney.saveData();
    ZenMoney.setResult({success: true});
}
