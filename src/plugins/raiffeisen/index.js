import {convertAccountMapToArray, convertAccountSyncID} from "../../common/accounts";
import {convertTransactionAccounts} from "../../common/transactions";
import {
    convertAccounts,
    convertCards,
    convertDepositsWithTransactions,
    convertLoans,
    convertTransactions,
} from "./converters";

import * as raiffeisen from "./raiffeisen";

function adjustTransactions(transactions, accounts) {
    return convertTransactionAccounts(transactions, accounts);
}

function adjustAccounts(accounts) {
    return convertAccountSyncID(convertAccountMapToArray(accounts));
}

export async function scrape({preferences, fromDate, toDate}) {
    let oldPluginLastSyncDate = ZenMoney.getData("last_sync", 0);
    if (oldPluginLastSyncDate && oldPluginLastSyncDate > 0) {
        oldPluginLastSyncDate = oldPluginLastSyncDate - 24 * 60 * 60 * 1000;
        fromDate = new Date(oldPluginLastSyncDate);
        ZenMoney.setData("last_sync", null);
    }
    const token = (await raiffeisen.login(preferences.login, preferences.password)).accessToken;
    const accounts = convertAccounts(await raiffeisen.fetchAccounts(token));
    let {accounts: deposits, transactions} =
        convertDepositsWithTransactions(await raiffeisen.fetchDepositsWithTransactions(token), fromDate);
    Object.assign(accounts, deposits,
        convertCards(await raiffeisen.fetchCards(token), accounts),
        convertLoans(await raiffeisen.fetchLoans(token)),
    );
    transactions = transactions.concat(convertTransactions(await raiffeisen.fetchTransactions(token, fromDate)));
    return {
        accounts: adjustAccounts(accounts),
        transactions: adjustTransactions(transactions, accounts),
    };
}
