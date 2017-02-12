/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

function main() {
    var bank     = new Bank();
    var kykyruza = new BankEpayments();
    var request  = new Request();

    var preferences = ZenMoney.getPreferences();

    if (!preferences.login) throw new ZenMoney.Error("Введите номер телефона / e-mail!", false, true);
    if (!preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", false, true);

    request.auth(preferences.login, preferences.password);

    var userData = request.getUser();

    var accountsData = userData.cards;
    bank.addAccounts(kykyruza.prepareAccountsData(accountsData));

    var walletsData = userData.ewallets;
    bank.addAccounts(kykyruza.prepareWalletsData(walletsData));

    var operationsData = request.getOperations();
    var operations     = kykyruza.prepareOperationsData(operationsData);
    bank.addOperations(operations);

    if (operations.length > 0) {
        request.setLastSyncTime(operations[0].date);
    }

    ZenMoney.saveData();
    ZenMoney.setResult({success: true});
}
