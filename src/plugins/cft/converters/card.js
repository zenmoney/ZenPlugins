/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {TYPES as ZENMONEY_ACCOUNT_TYPE} from "../constants/zenmoney_accounts";
import {entity} from "../zenmoney_entity/account";
import {cardUniqueAccountId as accountId, resolveCurrencyCode} from "./helpers";

/**
 * @param data
 * @returns {{id: null, title: null, syncID: Array, type: null, balance: number, startBalance: number, creditLimit: number, savings: undefined, capitalization: undefined, percent: undefined, startDate: undefined, endDateOffset: undefined, endDateOffsetInterval: undefined, payoffStep: undefined, payoffInterval: undefined}}
 */
const converter = (data) => {
    const account = entity();

    account.id     = accountId(data.id);
    account.title  = data.name;
    account.type   = ZENMONEY_ACCOUNT_TYPE.CARD;
    account.syncID = [
        data.ean.toString(),
        data.panTail.toString(),
    ];

    data.equities.forEach((equity) => {
        if (equity.type === 'FUNDS') {
            account.instrument = resolveCurrencyCode(equity.currencyCode);
            account.balance    = Number(equity.amount);
        }
    });

    return account;
};

export {
    converter,
}
