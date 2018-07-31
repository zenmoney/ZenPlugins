import * as _ from "lodash";
import {ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId} from "../../common/accounts";
import {fetchAccounts, fetchTransactions, login} from "./api";
import {convertAccount, convertTransaction} from "./converters";

export async function scrape({preferences, fromDate, toDate, isInBackground}) {
    if (!toDate) {
        toDate = new Date();
    }
    const auth = await login(ZenMoney.getData("auth"));
    const accounts = {};
    const transactions = [];
    await Promise.all((await fetchAccounts(auth, preferences)).map(async apiAccount => {
        const account = convertAccount(apiAccount);
        if (account) {
            accounts[account.id] = account;
        }
        if (ZenMoney.isAccountSkipped(account.id)) {
            return;
        }
        (await fetchTransactions(auth, preferences, account, fromDate, toDate)).forEach(apiTransaction => {
            const transaction = convertTransaction(apiTransaction, account);
            if (transaction) {
                transactions.push(transaction);
            }
        });
    }));
    transactions.forEach(transaction => {
        if (!accounts[transaction.incomeAccount]) {
            transaction.income = 0;
            transaction.incomeAccount = transaction.outcomeAccount;
        }
        if (!accounts[transaction.outcomeAccount]) {
            transaction.outcome = 0;
            transaction.outcomeAccount = transaction.incomeAccount;
        }
        if (transaction.incomeAccount !== transaction.outcomeAccount) {
            transaction.payee = null;
        }
    });
    ZenMoney.setData("auth", auth);
    return {
        accounts: ensureSyncIDsAreUniqueButSanitized({accounts: _.values(accounts), sanitizeSyncId}),
        transactions: _.sortBy(transactions, transaction => transaction.date),
    };
}
