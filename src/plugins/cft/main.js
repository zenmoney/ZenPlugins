/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as api from "./api";
import {converter as cardDataToZenmoneyAccount} from "./converters/card";
import {mapContractToAccount} from "./converters/helpers";
import {converter as transactionsDataToZenmoneyTransaction} from "./converters/transaction";
import {converter as walletDataToZenmoneyAccount} from "./converters/wallet";

/**
 * @param fromDate
 * @param toDate
 * @param apiUri
 * @returns {Promise.<*>}
 */
async function scrape({fromDate, toDate, apiUri}) {
    const {password, card_number} = ZenMoney.getPreferences();

    console.assert(card_number, "Введите штрих-код карты!");
    console.assert(password, "Введите пароль в интернет-банк!");

    api.setApiUri(apiUri);

    await api.auth(card_number, password);

    const [cards_data, wallets_data, transactions_data] = await Promise.all([
        api.fetchCards(),
        api.fetchWallets(),
        api.fetchTransactions(fromDate),
    ]);

    const cards = cards_data.map(cardDataToZenmoneyAccount);
    const wallets = wallets_data.map(walletDataToZenmoneyAccount);

    const map = mapContractToAccount(cards_data);
    const transactions = transactions_data.map((data) => transactionsDataToZenmoneyTransaction(data, map));

    let accounts = [].concat(cards, wallets).filter((account) => !ZenMoney.isAccountSkipped(account.id));
    let transactionsAccount = accounts.splice(0, 1)[0];

    return [].concat(
        accounts.map(convertAccountsForResult),
        {
            account: transactionsAccount,
            transactions: transactions,
        },
    );
}

/**
 * @param account
 * @returns {{account: *, transactions: Array}}
 */
const convertAccountsForResult = (account) => {
    return {
        account: account,
        transactions: [],
    };

};

export {
    scrape,
};
