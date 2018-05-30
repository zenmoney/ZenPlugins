import {convertAccountSyncID} from "../../common/accounts";
import {
    convertAccounts,
    convertLoanTransaction,
    convertTransaction,
    getAccountData,
    isCutCurrencyTransaction,
    restoreCutCurrencyTransactions,
    updateAccountData,
} from "./converters";
import * as sberbank from "./sberbank";

export async function scrape({preferences, fromDate, toDate}) {
    toDate = toDate || new Date();

    const {host} = await sberbank.login(preferences.login, preferences.pin);
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
        console.log("Needs fetching from web");
        //TODO: Fetch currency transactions from web
    }

    return {
        accounts: convertAccountSyncID(zenAccounts, true),
        transactions: zenTransactions,
    };
}
