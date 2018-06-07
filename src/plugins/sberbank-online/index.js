import {convertAccountSyncID} from "../../common/accounts";
import {combineIntoTransferByTransferId} from "../../common/transactions";
import {convertAccounts, convertLoanTransaction, convertTransaction, convertTransactions} from "./converters";
import * as sberbank from "./sberbank";

export async function scrape({preferences, fromDate, toDate}) {
    toDate = toDate || new Date();

    let {host} = await sberbank.login(preferences.login, preferences.pin);

    const zenAccounts = [];
    const zenTransactions = [];

    const apiAccountsByType = await sberbank.fetchAccounts(host);
    const pfmAccounts = [];

    await Promise.all(Object.keys(apiAccountsByType).map(type => {
        const isPfmAccount = type === "card";

        return Promise.all(convertAccounts(apiAccountsByType[type], type).map(async apiAccount => {
            zenAccounts.push(apiAccount.zenAccount);
            ZenMoney.setData("data_" + apiAccount.zenAccount.id, null);

            if (ZenMoney.isAccountSkipped(apiAccount.zenAccount.id)) {
                return;
            }

            if (isPfmAccount) {
                pfmAccounts.push(apiAccount);
                apiAccount.transactions = {};
                apiAccount.ids.forEach(id => {
                    apiAccount.transactions[id] = [];
                });
            }

            await Promise.all(apiAccount.ids.map(async id => {
                for (const apiTransaction of await sberbank.fetchTransactions(host, {id, type}, fromDate, toDate)) {
                    if (isPfmAccount) {
                        apiAccount.transactions[id].push(apiTransaction);
                        continue;
                    }
                    const zenTransaction = type === "loan"
                        ? convertLoanTransaction(apiTransaction, apiAccount.zenAccount)
                        : convertTransaction(apiTransaction, apiAccount.zenAccount);
                    if (zenTransaction) {
                        zenTransactions.push(zenTransaction);
                    }
                }
            }));
        }));
    }));

    if (pfmAccounts.length > 0) {
        host = (await sberbank.loginInPfm(host)).host;
        await Promise.all(pfmAccounts.map(apiAccount => Promise.all(apiAccount.ids.map(async id => {
            const pfmTransactions = await sberbank.fetchTransactionsInPfm(host, [id], fromDate, toDate);
            for (const zenTransaction of convertTransactions({
                account: apiAccount.zenAccount,
                apiTransactions: apiAccount.transactions[id],
                pfmTransactions,
            })) {
                zenTransactions.push(zenTransaction);
            }
        }))));
    }

    return {
        accounts: convertAccountSyncID(zenAccounts, true),
        transactions: combineIntoTransferByTransferId(zenTransactions),
    };
}

export async function makeTransfer(fromAccount, toAccount, sum) {
    const preferences = ZenMoney.getPreferences();
    const auth = await sberbank.login(preferences.login, preferences.pin);
    await sberbank.makeTransfer(auth, {fromAccount, toAccount, sum});
}
