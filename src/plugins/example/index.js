import * as bank from "./bank";
import * as converters from "./converters";

export async function scrape({fromDate, toDate}) {
    const preferences = ZenMoney.getPreferences();
    if (!preferences.login) {
        // ZenMoney.Error(message, logIsNotImportant, forcePluginReinstall)
        throw new ZenMoney.Error("Введите логин!", null, true);
    }
    if (!preferences.password) {
        throw new ZenMoney.Error("Введите пароль!", null, true);
    }
    const token = await bank.login(preferences.login, preferences.password);
    const accounts = (await bank.fetchAccounts(token))
        .map(converters.convertAccount);
    const transactions = (await bank.fetchTransactions(token, fromDate, toDate))
        .map(transaction => converters.convertTransaction(transaction, accounts));
    return {
        accounts: accounts,
        transactions: transactions,
    };
}
