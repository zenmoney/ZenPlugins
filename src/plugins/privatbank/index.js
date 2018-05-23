import {convertAccountMapToArray, convertAccountSyncID} from "../../common/accounts";
import {convertTransactionAccounts, mapObjectsGroupedByKey} from "../../common/transactions";
import {convertAccounts, convertTransactions} from "./converters";
import {PrivatBank} from "./privatbank";

function adjustAccounts(accounts) {
    return convertAccountSyncID(convertAccountMapToArray(accounts));
}

function adjustTransactions(transactions, accounts) {
    return mapObjectsGroupedByKey(convertTransactionAccounts(transactions, accounts),
        (transaction) => transaction._transferId || null,
        (transactions, key) => {
            if (key === null) {
                return transactions;
            }
            if (transactions.length === 2 &&
                transactions[0]._transferType !==
                transactions[1]._transferType) {
                const transaction = transactions[0];
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

export async function scrape({preferences, fromDate, toDate}) {
    const merchants = preferences.merchantId.split(/\s+/);
    const passwords = preferences.password.split(/\s+/);
    if (merchants.length !== passwords.length) {
        throw new InvalidPreferencesError("Количество паролей, разделенных через пробел, в настройках подключения должно быть равно количеству мерчантов, разделенных через пробел");
    }
    const accounts = {};
    let transactions = [];
    await Promise.all(merchants.map(async (merchant, i) => {
        const bank = new PrivatBank({
            merchant: merchant,
            password: passwords[i],
            baseUrl: preferences.serverAddress,
        });
        const account = convertAccounts(await bank.fetchAccounts());
        transactions = transactions.concat(convertTransactions(
            await bank.fetchTransactions(fromDate, toDate), account));
        Object.assign(accounts, account);
    }));
    return {
        accounts: adjustAccounts(accounts),
        transactions: adjustTransactions(transactions, accounts),
    };
}
