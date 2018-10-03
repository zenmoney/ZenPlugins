//
// TODO:
// - Добавить поддержку депозитных счетов, счетов для процентов по депозиту, счетов учета резервов.
//
import * as bank from "./bank";
import * as converters from "./converters";
import {login} from "./bank";

export async function scrape({preferences, fromDate}) {
    let token = ZenMoney.getData("accessToken");
    if (!token) {
        token = await login();
        ZenMoney.setData("accessToken", token);
    }

    const accounts = (await bank.fetchAccounts(token))
        .map(converters.convertAccount)
        .filter(account => account && !ZenMoney.isAccountSkipped(account.id));
    console.log(`Всего счетов: ${accounts.length}`);

    const transactions = (await bank.fetchTransactions(token, accounts, fromDate))
        .map(transaction => converters.convertTransaction(transaction, accounts))
        .filter(transaction => transaction);
    console.log(`Всего операций: ${transactions.length}`);

    return {
        accounts: accounts,
        transactions: transactions,
    }
}
