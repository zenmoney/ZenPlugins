/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

function main() {
    var bank     = new Bank();
    var beeline  = new BankBeeline();
    var request  = new Request();

    var preferences = ZenMoney.getPreferences();

    if (!preferences.card_number) throw new ZenMoney.Error("Введите штрих-код карты!", false, true);
    if (!preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", false, true);

    request.auth(preferences.card_number, preferences.password);

    var accountsData = request.getAccounts();
    bank.addAccounts(beeline.prepareAccountsData(accountsData));

    var walletsData = request.getWallets();
    bank.addAccounts(beeline.prepareWalletsData(walletsData));

    var operationsData = request.getOperations();
    var operations     = beeline.prepareOperationsData(operationsData);
    bank.addOperations(operations);

    if (operations.length > 0) {
        request.setLastSyncTime(operations[0].date);
    }

    ZenMoney.saveData();
    ZenMoney.setResult({success: true});
}
