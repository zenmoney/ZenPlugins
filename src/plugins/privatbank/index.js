import {PrivatBank} from "./privatbank";
import {convertTransactions, convertAccounts} from "./converters";

export function adjustAccounts(accounts) {
    const filtered = [];
    for (const id in accounts) {
        const account = accounts[id];
        if (account.id === id) {
            filtered.push(account);
        }
    }
    return filtered;
}

export function adjustTransactions(transactions, accounts) {
    let filtered = [];
    const transactionsByTransferId = {};
    for (const transaction of transactions) {
        const incomeAccount  = accounts[transaction.incomeAccount];
        const outcomeAccount = accounts[transaction.outcomeAccount];
        if (!incomeAccount && !outcomeAccount) {
            continue;
        }
        if (incomeAccount) {
            transaction.incomeAccount = incomeAccount.id;
        }
        if (outcomeAccount) {
            transaction.outcomeAccount = outcomeAccount.id;
        }
        if (transaction._transferId) {
            let group = transactionsByTransferId[transaction._transferId];
            if (!group) {
                transactionsByTransferId[transaction._transferId] = group = [];
            }
            group.push(transaction);
        } else {
            filtered.push(transaction);
        }
    }
    for (const key in transactionsByTransferId) {
        const group = transactionsByTransferId[key];
        if (group.length === 2 && group[0]._transferType !== group[1]._transferType) {
            const transaction  = group[0];
            const transferType = group[0]._transferType;
            ["", "Account", "BankID"].forEach(postfix => {
                const value = group[1][transferType + postfix];
                if (value !== undefined) {
                    transaction[transferType + postfix] = value;
                }
            });
            delete transaction._transferId;
            delete transaction._transferType;
            filtered.push(transaction);
            continue;
        }
        for (const transaction of group) {
            if (group.length > 1) {
                transaction[transaction._transferType] = 0;
                transaction[transaction._transferType + "Account"] =
                    transaction._transferType === "income" ?
                    transaction.outcomeAccount : transaction.incomeAccount;
            }
            delete transaction._transferId;
            delete transaction._transferType;
            filtered.push(transaction);
        }
    }
    return filtered;
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
