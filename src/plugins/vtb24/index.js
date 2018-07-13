import * as _ from "lodash";
import {ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId} from "../../common/accounts";
import {combineIntoTransferByTransferId} from "../../common/transactions";
import {convertAccounts, convertTransaction} from "./converters";
import {fetchAccounts, fetchTransactions, login} from "./vtb";

export async function scrape({preferences, fromDate, toDate}) {
    toDate = toDate || new Date();
    const auth = await login(preferences.login, preferences.password);
    const apiAccounts = convertAccounts(await fetchAccounts(auth));
    const zenAccounts = [];
    const transactions = [];
    await Promise.all(apiAccounts.map(async apiAccount => {
        if (zenAccounts.indexOf(apiAccount.zenAccount) < 0) {
            zenAccounts.push(apiAccount.zenAccount);
        }
        if (ZenMoney.isAccountSkipped(apiAccount.zenAccount.id)) {
            return;
        }
        (await fetchTransactions(auth, apiAccount, fromDate, toDate)).forEach(apiTransaction => {
            const transaction = convertTransaction(apiTransaction, apiAccount.zenAccount);
            if (transaction) {
                transactions.push(transaction);
            }
        });
    }));
    return {
        accounts: ensureSyncIDsAreUniqueButSanitized({
            accounts: zenAccounts,
            sanitizeSyncId,
        }),
        transactions: _.sortBy(combineIntoTransferByTransferId(transactions), zenTransaction => zenTransaction.date),
    };
}
