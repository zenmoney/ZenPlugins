import * as _ from "lodash";
import {ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId} from "../../common/accounts";
import {fetchAccounts, fetchStatement, login} from "./api";
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

        // ToDO: debug
        // if (apiAccount.account_code !== "40702810101270000000") return;

        const apiStatement = await fetchStatement(auth, apiAccount, fromDate, toDate, preferences);
        // остаток на счету на конец периода в выписке
        if (apiStatement.balance_closing) {
            account.balance = Number(apiStatement.balance_closing);
            account.instrument = "RUB";
        }
        // операции по счёту из выписки
        if (apiStatement.payments) {
            apiStatement.payments.forEach(apiTransaction => {
                const transaction = convertTransaction(apiTransaction, account);
                if (transaction) {
                    transactions.push(transaction);
                }
            });
        }
    }));

    ZenMoney.setData("auth", auth);
    return {
        accounts: ensureSyncIDsAreUniqueButSanitized({accounts: _.values(accounts), sanitizeSyncId}),
        transactions: _.sortBy(transactions, transaction => transaction.date),
    };
}
