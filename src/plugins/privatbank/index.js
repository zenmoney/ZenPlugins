import {convertAccountMapToArray, convertAccountSyncID} from "../../common/accounts";
import {combineIntoTransferByTransferId, convertTransactionAccounts} from "../../common/transactions";
import {convertAccounts, convertTransactions} from "./converters";
import {PrivatBank} from "./privatbank";

function adjustAccounts(accounts) {
    return convertAccountSyncID(convertAccountMapToArray(accounts));
}

function adjustTransactions(transactions, accounts) {
    return combineIntoTransferByTransferId(convertTransactionAccounts(transactions, accounts));
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
