import {ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId} from "../../common/accounts";
import {combineIntoTransferByTransferId} from "../../common/transactions";
import {convertAccounts, convertTransaction} from "./converters";
import {fetchAccounts, fetchTransactions, login} from "./vtb";

export async function scrape({preferences, fromDate, toDate}) {
    toDate = toDate || new Date();
    const auth = await login(preferences.login, preferences.password);
    const accounts = convertAccounts(await fetchAccounts(auth));
    const transactions = [];
    await Promise.all(accounts.map(async account => {
        (await fetchTransactions(auth, account, fromDate, toDate)).forEach(apiTransaction => {
            const transaction = convertTransaction(apiTransaction, account.zenAccount);
            if (transaction) {
                transactions.push(transaction);
            }
        });
    }));
    return {
        accounts: ensureSyncIDsAreUniqueButSanitized({accounts: accounts.map(account => account.zenAccount), sanitizeSyncId}),
        transactions: combineIntoTransferByTransferId(transactions),
    };
}
