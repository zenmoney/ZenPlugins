function main() {
    var bank     = new Bank();
    var kykyruza = new BankKykyryza();

    var preferences = ZenMoney.getPreferences();

    if (!preferences.card_number) throw new ZenMoney.Error("Введите логин в интернет-банк!", false, true);
    if (!preferences.password) throw new ZenMoney.Error("Введите пароль в интернет-банк!", false, true);

    var request = new Request(preferences.card_number, preferences.password);

    request.auth();

    var accountsData = request.getAccounts();
    bank.addAccounts(kykyruza.prepareAccountsData(accountsData));

    var operationsData = request.getAllOperations();
    bank.addOperations(kykyruza.prepareOperationsData(operationsData));

    ZenMoney.saveData();
    ZenMoney.setResult({success: true});
}
