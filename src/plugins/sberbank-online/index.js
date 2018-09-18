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

function getAuth() {
    return ZenMoney.getData("auth");
}

function saveAuth(auth) {
    delete auth.api.token;
    delete auth.pfm;
    ZenMoney.setData("auth", auth);
}

export async function scrape({preferences, fromDate, toDate, isInBackground}) {
    if (preferences.pin.length !== 5) {
        throw new InvalidPreferencesError("Пин-код должен быть из 5 цифр");
    }

    toDate = toDate || new Date();

    const isFirstRun = !ZenMoney.getData("scrape/lastSuccessDate");
    if (isFirstRun && ZenMoney.getData("devid")) {
        fromDate = new Date(new Date().getTime() - 7 * 24 * 3600 * 1000);
    }

    let auth = await sberbank.login(preferences.login, preferences.pin, getAuth());

    const zenAccounts = [];
    const zenTransactions = [];

    const apiAccountsByType = await sberbank.fetchAccounts(auth);
    const pfmAccounts = [];
    const webAccounts = [];

    await Promise.all(["account", "loan", "card", "target"].map(type => {
        const isPfmAccount = type === "card";

        return Promise.all(convertAccounts(apiAccountsByType[type], type).map(async apiAccount => {
            for (const zenAccount of zenAccounts) {
                if (apiAccount.zenAccount.id === zenAccount.id) {
                    apiAccount.zenAccount.syncID.forEach(id => {
                        if (zenAccount.syncID.indexOf(id) < 0) {
                            zenAccount.syncID.push(id);
                        }
                    });
                    return;
                }
            }

            zenAccounts.push(apiAccount.zenAccount);
            if (ZenMoney.isAccountSkipped(apiAccount.zenAccount.id)) {
                return;
            }

            if (isPfmAccount) {
                apiAccount.previousAccountData = loadAccountData(ZenMoney.getData("data_" + apiAccount.zenAccount.id));
                apiAccount.accountData = getAccountData(apiAccount.zenAccount);
                apiAccount.transactions = {};
            }

            await Promise.all(apiAccount.ids.map(async id => {
                try {
                    const transactions = [];
                    for (const apiTransaction of await sberbank.fetchTransactions(auth, {id, type: apiAccount.type}, fromDate, toDate)) {
                        const transaction = apiAccount.type === "loan"
                            ? convertLoanTransaction(apiTransaction)
                            : convertApiTransaction(apiTransaction, apiAccount.zenAccount);
                        if (!transaction) {
                            continue;
                        }
                        if (isPfmAccount) {
                            transactions.push(transaction);
                        } else {
                            zenTransactions.push(convertToZenMoneyTransaction(apiAccount.zenAccount, transaction));
                        }
                    }
                    if (isPfmAccount) {
                        apiAccount.transactions[id] = transactions;
                    }
                } catch (e) {
                    if (e.toString().indexOf("временно недоступна") < 0) {
                        throw e;
                    }
                }
            }));

            if (isPfmAccount) {
                apiAccount.ids = Object.keys(apiAccount.transactions);
                if (apiAccount.ids.length > 0) {
                    pfmAccounts.push(apiAccount);
                }
            }
        }));
    }));

    if (pfmAccounts.length > 0) {
        let hasSSLError = false;
        try {
            auth = await sberbank.loginInPfm(auth);
        } catch (e) {
            if (e.toString().indexOf("[NCE]") >= 0) {
                //PFM uses TLSv1.2 which is not supported by Android < 5.0
                hasSSLError = true;
                console.log("skipping PFM. Application doesn't seem to support TLSv1.2")
            } else {
                throw e;
            }
        }
        await Promise.all(pfmAccounts.map(async apiAccount => {
            await Promise.all(apiAccount.ids.map(async id => {
                const transactions = apiAccount.transactions[id];
                const n = transactions.length;
                const pfmTransactions = hasSSLError
                    ? []
                    : await sberbank.fetchTransactionsInPfm(auth, [id], fromDate, toDate);
                const isHoldByDefault = pfmTransactions.length > 0;
                addTransactions(transactions, pfmTransactions.map(convertPfmTransaction));
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
                    const transaction = transactions[i];
                    if (transaction.hold === null && isHoldByDefault) {
                        transaction.hold = true;
                    }
                    trackCurrencyMovement({
                        transaction: transaction,
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
        const host = (await sberbankWeb.login(preferences.login, preferences.password)).host;
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

    saveAuth(auth);

    return {
        accounts: convertAccountSyncID(zenAccounts, true),
        transactions: _.sortBy(combineIntoTransferByTransferId(zenTransactions), zenTransaction => zenTransaction.date),
    };
}

export async function makeTransfer(fromAccount, toAccount, sum) {
    const preferences = ZenMoney.getPreferences();
    const auth = await sberbank.login(preferences.login, preferences.pin);
    await sberbank.makeTransfer(preferences.login, auth, {fromAccount, toAccount, sum});
    saveAuth(auth);
    ZenMoney.saveData();
}
