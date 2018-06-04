import {convertAccountSyncID} from "../../common/accounts";
import {
    convertAccounts,
    convertLoanTransaction,
    convertTransaction,
    convertWebTransaction,
    getAccountData,
    isCutCurrencyTransaction,
    isRestoredCurrencyTransaction,
    restoreCutCurrencyTransactions,
    updateAccountData,
} from "./converters";
import * as sberbank from "./sberbank";
import * as sberbankWeb from "./sberbankWeb";

export async function scrape({preferences, fromDate, toDate}) {
    toDate = toDate || new Date();

    let {host} = await sberbank.login(preferences.login, preferences.pin);

    const accountsByType = await sberbank.fetchAccounts(host);
    const accountsWithCurrencyTransactions = [];
    const zenAccounts = [];
    const zenTransactions = [];
    await Promise.all(Object.keys(accountsByType).map(type => {
        return Promise.all(convertAccounts(accountsByType[type], type).map(async account => {
            zenAccounts.push(account.zenAccount);
            if (ZenMoney.isAccountSkipped(account.zenAccount.id)) {
                return;
            }

            const idsWithCurrencyTransactions = [];

            const prevAccountData = ZenMoney.getData("data_" + account.zenAccount.id);
            const currAccountData = getAccountData(account.zenAccount);

            await Promise.all(account.ids.map(async id => {
                for (const apiTransaction of await sberbank.fetchTransactions(host, {id, type}, fromDate, toDate)) {
                    const transaction = type === "loan"
                        ? convertLoanTransaction(apiTransaction, account.zenAccount)
                        : convertTransaction(apiTransaction, account.zenAccount);
                    if (!transaction) {
                        continue;
                    }
                    if (currAccountData) {
                        updateAccountData({transaction, account: account.zenAccount,
                            currAccountData, prevAccountData});
                    }
                    if (isCutCurrencyTransaction(transaction)) {
                        if (idsWithCurrencyTransactions.indexOf(id) < 0) {
                            idsWithCurrencyTransactions.push(id);
                        }
                    } else {
                        zenTransactions.push(transaction);
                    }
                }
            }));

            if (idsWithCurrencyTransactions.length > 0 && (!currAccountData || !prevAccountData
                    || !restoreCutCurrencyTransactions({
                        account: account.zenAccount,
                        transactions: zenTransactions,
                        currAccountData,
                        prevAccountData,
                    }))) {
                account.idsWithCurrencyTransactions = idsWithCurrencyTransactions;
                accountsWithCurrencyTransactions.push(account);
            }
            if (currAccountData) {
                delete currAccountData.currencyMovements;
            }

            ZenMoney.setData("data_" + account.zenAccount.id, currAccountData);
        }));
    }));

    if (accountsWithCurrencyTransactions.length > 0) {
        let error = null;
        try {
            await sberbankWeb.login(preferences.login, preferences.password);
        } catch (e) {
            if (e instanceof TemporaryError) {
                console.error(e);
                error = e;
            } else {
                throw e;
            }
        }
        if (!error) {
            for (const account of accountsWithCurrencyTransactions) {
                for (const id of account.idsWithCurrencyTransactions) {
                    const webTransactions = await sberbankWeb.fetchTransactions(host, {id, type: account.type}, fromDate, toDate);
                    for (const webTransaction of webTransactions) {
                        const transaction = convertWebTransaction(webTransaction, account.zenAccount);
                        if (transaction && isRestoredCurrencyTransaction(transaction)) {
                            zenTransactions.push(transaction);
                        }
                    }
                }
            }
        }
    }

    return {
        accounts: convertAccountSyncID(zenAccounts, true),
        transactions: zenTransactions,
    };
}

export async function makeTransfer(fromAccount, toAccount, sum) {
    const preferences = ZenMoney.getPreferences();
    const auth = await sberbank.login(preferences.login, preferences.pin);
    await sberbank.makeTransfer(auth, {fromAccount, toAccount, sum});
}
