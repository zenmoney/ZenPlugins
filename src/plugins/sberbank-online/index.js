import {login, fetchAccounts, fetchTransactions, fetchAccountDetails} from "./sberbank";

export async function scrape({preferences, fromDate, toDate}) {
    if (!preferences.login) {
        throw new ZenMoney.Error("Введите логин!", null, true);
    }
    if (!preferences.password) {
        throw new ZenMoney.Error("Введите пароль!", null, true);
    }
    toDate = toDate || new Date();

    await login(preferences.login, preferences.pin);
    const accounts = await fetchAccounts();
    console.log("accounts", accounts);
    for (const account of accounts) {
        const details = await fetchAccountDetails(account.id);
        console.log(`details for ${account.id}`, details);
        const transactions = await fetchTransactions(account.id, fromDate, toDate);
        console.log(`transactions for ${account.id}`, transactions);
    }
    //TODO convert accounts and transactions
    return {
        accounts: [],
        transactions: []
    };
}
