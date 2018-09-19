//
// TODO:
// - Заменить авторизацию по персональному токену, генерируемому в личном кабинете,
// на авторизацию через токен OAuth.
// - Добавить поддержку депозитных счетов, счетов для процентов по депозиту, счетов учета резервов.
//
import * as bank from "./bank";
import * as converters from "./converters";

export async function scrape({preferences, fromDate}) {
    if (!preferences.token) {
        throw new ZenMoney.Error("Не задан ключ API интернет-банка!", false, true)
    }

    const accounts = (await bank.fetchAccounts(preferences.token))
        .map(converters.convertAccount)
        .filter(account => account && !ZenMoney.isAccountSkipped(account.id));
    console.log(`Всего счетов: ${accounts.length}`);

    const transactions = (await bank.fetchTransactions(preferences.token, accounts, fromDate))
        .map(transaction => converters.convertTransaction(transaction, accounts))
        .filter(transaction => transaction);
    console.log(`Всего операций: ${transactions.length}`);

    return {
        accounts: accounts,
        transactions: transactions,
    }
}
