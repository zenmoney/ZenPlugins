import * as _ from "lodash";
import {convertAccountSyncID} from "../../common/accounts";
import {combineIntoTransferByTransferId} from "../../common/transactions";
import {
    addTransactions,
    convertAccounts,
    convertApiTransaction,
    convertLoanTransaction,
    convertPfmTransaction,
    convertToZenMoneyTransaction,
    convertWebTransaction,
} from "./converters";
import * as sberbank from "./sberbank";
import * as sberbankWeb from "./sberbankWeb";
import {
    addDeltaToLastCurrencyTransaction,
    getAccountData,
    loadAccountData,
    restoreNewCurrencyTransactions,
    RestoreResult,
    saveAccountData,
    trackCurrencyMovement,
    trackLastCurrencyTransaction,
} from "./transactionUtils";

export async function scrape({preferences, fromDate, toDate, isInBackground}) {
    if (preferences.pin.length !== 5) {
        throw new InvalidPreferencesError("Пин-код должен быть из 5 цифр");
    }

    toDate = toDate || new Date();

    let {host} = await sberbank.login(preferences.login, preferences.pin);

    const zenAccounts = [];
    const zenTransactions = [];

    const apiAccountsByType = await sberbank.fetchAccounts(host);
    const pfmAccounts = [];
    const webAccounts = [];

    const isFirstRun = !ZenMoney.getData("scrape/lastSuccessDate");
    if (isFirstRun && ZenMoney.getData("devid")) {
        fromDate = new Date(new Date().getTime() - 7 * 24 * 3600 * 1000);
    }

    await Promise.all(Object.keys(apiAccountsByType).map(type => {
        const isPfmAccount = type === "card";

        return Promise.all(convertAccounts(apiAccountsByType[type], type).map(async apiAccount => {
            zenAccounts.push(apiAccount.zenAccount);
            if (ZenMoney.isAccountSkipped(apiAccount.zenAccount.id)) {
                return;
            }

            if (isPfmAccount) {
                pfmAccounts.push(apiAccount);
                apiAccount.previousAccountData = loadAccountData(ZenMoney.getData("data_" + apiAccount.zenAccount.id));
                apiAccount.accountData = getAccountData(apiAccount.zenAccount);
                apiAccount.transactions = {};
                apiAccount.ids.forEach(id => apiAccount.transactions[id] = []);
            }

            await Promise.all(apiAccount.ids.map(async id => {
                for (const apiTransaction of await sberbank.fetchTransactions(host, {id, type}, fromDate, toDate)) {
                    const transaction = type === "loan"
                        ? convertLoanTransaction(apiTransaction)
                        : convertApiTransaction(apiTransaction, apiAccount.zenAccount);
                    if (!transaction) {
                        continue;
                    }
                    if (isPfmAccount) {
                        apiAccount.transactions[id].push(transaction);
                    } else {
                        zenTransactions.push(convertToZenMoneyTransaction(apiAccount.zenAccount, transaction));
                    }
                }
            }));
        }));
    }));

    if (pfmAccounts.length > 0) {
        host = (await sberbank.loginInPfm(host)).host;
        await Promise.all(pfmAccounts.map(async apiAccount => {
            await Promise.all(apiAccount.ids.map(async id => {
                const transactions = apiAccount.transactions[id];
                const n = transactions.length;
                addTransactions(transactions,
                    (await sberbank.fetchTransactionsInPfm(host, [id], fromDate, toDate)).map(convertPfmTransaction));
                if (isFirstRun) {
                    const hasCurrencyTransactions = transactions.some(transaction => !transaction.posted);
                    if (hasCurrencyTransactions) {
                        if (apiAccount.idsWithCurrencyTransactions) {
                            apiAccount.idsWithCurrencyTransactions.push(id);
                        } else {
                            apiAccount.idsWithCurrencyTransactions = [id];
                            webAccounts.push(apiAccount);
                        }
                    }
                }
                for (let i = 0; i < n; i++) {
                    trackCurrencyMovement({
                        transaction: transactions[i],
                        accountData: apiAccount.accountData,
                        previousAccountData: isFirstRun ? null : apiAccount.previousAccountData,
                    });
                }
            }));
            if (!isFirstRun) {
                console.log(`restorePosted old ${apiAccount.zenAccount.id}`, apiAccount.previousAccountData);
                console.log(`restorePosted new ${apiAccount.zenAccount.id}`, apiAccount.accountData);
                apiAccount.restoreResult = restoreNewCurrencyTransactions({
                    account: apiAccount.zenAccount,
                    accountData: apiAccount.accountData,
                    previousAccountData: apiAccount.previousAccountData,
                });
                console.log(`restorePosted result ${apiAccount.restoreResult}`);
            }
        }));
    }

    if (webAccounts.length > 0) {
        host = (await sberbankWeb.login(preferences.login, preferences.password)).host;
        for (const apiAccount of webAccounts) {
            const type = apiAccount.type;
            for (const id of apiAccount.idsWithCurrencyTransactions) {
                const transactions = apiAccount.transactions[id];
                addTransactions(transactions,
                    (await sberbankWeb.fetchTransactions(host, {id, type}, fromDate, toDate)).map(convertWebTransaction),
                    true);
            }
        }
    }

    for (const apiAccount of pfmAccounts) {
        const n = zenTransactions.length;
        for (const id of apiAccount.ids) {
            for (const transaction of apiAccount.transactions[id]) {
                const zenTransaction = convertToZenMoneyTransaction(apiAccount.zenAccount, transaction);
                trackLastCurrencyTransaction(zenTransaction, apiAccount.accountData);
                if (!transaction.posted) {
                    console.log("skipping not restored transaction", transaction);
                    continue;
                }
                zenTransactions.push(zenTransaction);
            }
        }
        if (!isFirstRun && apiAccount.restoreResult === RestoreResult.UNCHANGED) {
            const lastCurrencyTransaction = addDeltaToLastCurrencyTransaction({
                account: apiAccount.zenAccount,
                accountData: apiAccount.accountData,
                previousAccountData: apiAccount.previousAccountData,
            });
            if (lastCurrencyTransaction) {
                console.log("delta added to last currency transaction", lastCurrencyTransaction);
                if (zenTransactions.indexOf(lastCurrencyTransaction, n) < 0) {
                    zenTransactions.push(lastCurrencyTransaction);
                }
            }
        }
        saveAccountData(apiAccount.accountData);
        ZenMoney.setData("data_" + apiAccount.zenAccount.id, apiAccount.accountData);
    }

    return {
        accounts: convertAccountSyncID(zenAccounts, true),
        transactions: _.sortBy(combineIntoTransferByTransferId(zenTransactions), zenTransaction => zenTransaction.date),
    };
}

export async function makeTransfer(fromAccount, toAccount, sum) {
    const preferences = ZenMoney.getPreferences();
    const auth = await sberbank.login(preferences.login, preferences.pin);
    await sberbank.makeTransfer(auth, {fromAccount, toAccount, sum});
}
