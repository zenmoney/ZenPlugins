import * as sberbank from "./sberbank";

export async function scrape({preferences, fromDate, toDate}) {
    if (!preferences.login) {
        throw new ZenMoney.Error("Введите логин!", null, true);
    }
    if (!preferences.password) {
        throw new ZenMoney.Error("Введите пароль!", null, true);
    }
    toDate = toDate || new Date();

    await sberbank.login(preferences.login, preferences.pin);

    console.log("Запрашиваем счета...");
    const accounts = await sberbank.fetchAccounts();
    console.log("Загрузили счета: ", accounts);

    let transactions = [];
    for (const account of accounts) {
        console.log(`Запрашиваем операции: ${account.title} (#${account.id})`);

        const trans = await sberbank.fetchTransactions(account, fromDate, toDate);
        if (trans) {
            console.log(`Загрузили операции:`, trans);
            transactions = transactions.concat(trans);
        } else
            console.log("Нет операций.");
    }

    return {
        accounts: accounts,
        transactions: transactions,
    };
}
