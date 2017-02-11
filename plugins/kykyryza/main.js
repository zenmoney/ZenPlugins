function main() {
    var bank     = new Bank();
    var kykyruza = new BankKykyryza();
    var request  = new Request();

    var preferences = ZenMoney.getPreferences();

    if (!preferences.card_number) throw new ZenMoney.Error("Введите штрих-код карты!", false, true);
    if (!preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", false, true);

    request.auth(preferences.card_number, preferences.password);

    var accountsData = request.getAccounts();
    bank.addAccounts(kykyruza.prepareAccountsData(accountsData));

    var walletsData = request.getWallets();
    bank.addAccounts(kykyruza.prepareWalletsData(walletsData));

    var operationsData = request.getAllOperations();
    bank.addOperations(kykyruza.prepareOperationsData(operationsData));

    ZenMoney.saveData();
    ZenMoney.setResult({success: true});
}
