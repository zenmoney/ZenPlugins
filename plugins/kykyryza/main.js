function main() {
    var bank     = new Bank();
    var kykyruza = new BankKykyryza();

    var request = new Request(kykyruza.getCardNumber(), kykyruza.getPassword());

    var accountsData = request.getAccounts();
    bank.addAccounts(kykyruza.prepareAccountsData(accountsData));

    var operationsData = request.getAllOperations();
    bank.addOperations(kykyruza.prepareOperationsData(operationsData));

    ZenMoney.saveData();
    ZenMoney.setResult({success: true});
}
