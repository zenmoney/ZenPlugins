import {convertAccountSyncID} from "../../common/accounts";
import {convertAccounts, convertTransaction} from "./converters";
import * as sberbank from "./sberbank";

export async function scrape({preferences, fromDate, toDate}) {
    toDate = toDate || new Date();

    await sberbank.login(preferences.login, preferences.pin);
    const accountsByType = await sberbank.fetchAccounts();
    const accountsWithCurrencyTransactions = [];
    const zenAccounts = [];
    const zenTransactions = [];
    await Promise.all(Object.keys(accountsByType).map(type => {
        return Promise.all(convertAccounts(accountsByType[type], type).map(async account => {
            zenAccounts.push(account.zenAccount);
            if (ZenMoney.isAccountSkipped(account.zenAccount.id)) {
                return;
            }
            account.idsWithCurrencyTransactions = [];
            await Promise.all(account.ids.map(async id => {
                for (const json of await sberbank.fetchTransactions({id, type}, fromDate, toDate)) {
                    const transaction = convertTransaction(json, account.zenAccount);
                    if (transaction.isCurrencyTransaction) {
                        if (account.idsWithCurrencyTransactions.indexOf(id) < 0) {
                            account.idsWithCurrencyTransactions.push(id);
                        }
                    } else if (transaction.zenTransaction) {
                        zenTransactions.push(transaction.zenTransaction);
                    }
                }
            }));
            if (account.idsWithCurrencyTransactions.length > 0) {
                accountsWithCurrencyTransactions.push(account);
            }
        }));
    }));

    if (accountsWithCurrencyTransactions.length > 0) {
        //TODO: Fetch currency transactions from web
    }

    return {
        accounts: convertAccountSyncID(zenAccounts, true),
        transactions: zenTransactions,
    };
}
