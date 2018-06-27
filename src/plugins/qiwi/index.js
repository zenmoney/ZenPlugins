import {combineIntoTransfer} from "../../common/transactions";
import {convertAccounts, convertTransactions} from "./converters";
import {fetchAccounts, fetchTransactions, login} from "./qiwi";

export async function scrape({preferences, fromDate, toDate, isInBackground}) {
    const auth = await login(preferences.token);
    const accounts = convertAccounts(await fetchAccounts(auth), auth.walletId);
    const transactions = combineIntoTransfer(
        convertTransactions(await fetchTransactions(auth, fromDate, toDate), auth.walletId),
        (transaction) => {
            return {
                id: transaction.id,
                type: transaction.income ? "outcome" : "income",
            };
        });
    return {
        accounts,
        transactions,
    };
}
