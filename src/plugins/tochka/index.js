import * as _ from "lodash";
import {ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId} from "../../common/accounts";
import {fetchAccounts, fetchTransactions, login} from "./api";
import {convertAccount, convertTransaction} from "./converters";

export async function scrape({preferences, fromDate, toDate, isInBackground}) {
    if (!toDate) {
        toDate = new Date();
    }
    const accounts = {};
    const transactions = [];

    let auth = await login(ZenMoney.getData("auth"), preferences);
    const apiAccounts = await fetchAccounts(auth, preferences);
    await Promise.all(apiAccounts.map(async apiAccount => {
        const account = convertAccount(apiAccount);
        if (account) {
            accounts[account.id] = account;
        }
        if (ZenMoney.isAccountSkipped(account.id)) {
            return;
        }
        const apiTransactions = await fetchTransactions(auth, apiAccount, fromDate, toDate, preferences);
        apiTransactions.forEach(apiTransaction => {
            const transaction = convertTransaction(apiTransaction, account);
            if (transaction) {
                transactions.push(transaction);
            }
        });
    }));

    ZenMoney.setData("auth", auth);
    return {
        accounts: ensureSyncIDsAreUniqueButSanitized({accounts: _.values(accounts), sanitizeSyncId}),
        transactions: _.sortBy(transactions, transaction => transaction.date),
    };
}
