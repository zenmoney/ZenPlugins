import {PrivatBank} from "./privatbank";
import {convertAccounts, convertTransactions} from "./converters";
import {convertAccountMapToArray, convertAccountSyncID} from "../../common/accounts";
import {convertTransactionAccounts, mapObjectsGroupedByKey} from "../../common/transactions";

export function adjustAccounts(accounts) {
    return convertAccountSyncID(convertAccountMapToArray(accounts));
}

export function adjustTransactions(transactions, accounts) {
    return mapObjectsGroupedByKey(convertTransactionAccounts(transactions, accounts),
        (transaction)       => transaction._transferId || null,
        (transactions, key) => {
            if (key === null) {
                return transactions;
            }
            if (transactions.length === 2 &&
                    transactions[0]._transferType !==
                    transactions[1]._transferType) {
                const transaction  = transactions[0];
                const transferType = transactions[0]._transferType;
                ["", "Account", "BankID"].forEach(postfix => {
                    const value = transactions[1][transferType + postfix];
                    if (value !== undefined) {
                        transaction[transferType + postfix] = value;
                    }
                });
                transactions = [transaction];
            }
            transactions.forEach(transaction => {
                delete transaction._transferId;
                delete transaction._transferType;
            });
            return transactions;
        });
}

export async function scrape({fromDate, toDate}) {
    const preferences = ZenMoney.getPreferences();
    if (!preferences.merchantId) {
        throw new ZenMoney.Error("Введите номер мерчанта!", null, true);
    }
    if (!preferences.password) {
        throw new ZenMoney.Error("Введите пароль!", null, true);
    }
    const merchants = preferences.merchantId.split(/\s+/);
    const passwords = preferences.password.split(/\s+/);
    if (merchants.length !== passwords.length) {
        throw new ZenMoney.Error("Количество паролей должно быть равно количеству мерчантов", null, true);
    }
    const accounts   = {};
    let transactions = [];
    for (let i = 0; i < merchants.length; i++) {
        const bank = new PrivatBank({
            merchant: merchants[i],
            password: passwords[i],
            baseUrl:  preferences.serverAddress
        });
        const account = convertAccounts(await bank.fetchAccounts());
        transactions = transactions.concat(convertTransactions(
            await bank.fetchTransactions(fromDate, toDate), account));
        Object.assign(accounts, account);
    }
    return {
        accounts:     adjustAccounts(accounts),
        transactions: adjustTransactions(transactions, accounts)
    };
}
