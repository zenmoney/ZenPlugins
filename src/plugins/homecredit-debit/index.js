/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as Api from "./api";
import * as Converters from "./converters";

export async function scrape({preferences, fromDate, toDate}) {
    await Api.auth(preferences.login, preferences.password, preferences.code);

    let accounts = {};
    let transactions = {};

    const products = await Api.fetchProducts();

    if (products.debitCards.list.length > 0) {
        await Promise.all(products.debitCards.list.map(async (i) => {
            accounts[i.contractNumber] = Converters.toCard(i);

            const accountTransactions = await Api.fetchDebitCardTransactions(
                i.cardNumber,
                i.accountNumber,
                i.contractNumber,
                fromDate.getTime(),
                toDate !== null ? toDate.getTime() : (new Date()).getTime(),
            );

            accountTransactions.forEach((x) => {
                transactions[x.movementNumber] = Converters.toTransaction(x, i.contractNumber)
            });
        }));
    }

    return {
        accounts: Object.values(accounts),
        transactions: Object.values(transactions),
    };
}
