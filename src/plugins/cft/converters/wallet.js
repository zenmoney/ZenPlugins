/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {TYPES as ZENMONEY_ACCOUNT_TYPE} from "../constants/zenmoney_accounts";
import {entity} from "../zenmoney_entity/account";
import {resolveCurrencyCode, toInteger, walletUniqueAccountId as accountId} from "./helpers";

/**
 * @param data
 * @returns {{id: null, title: null, syncID: Array, type: null, balance: number, startBalance: number, creditLimit: number, savings: undefined, capitalization: undefined, percent: undefined, startDate: undefined, endDateOffset: undefined, endDateOffsetInterval: undefined, payoffStep: undefined, payoffInterval: undefined}}
 */
const converter = (data) => {
    const account = entity();

    account.id         = accountId(data.id);
    account.title      = data.name;
    account.type       = ZENMONEY_ACCOUNT_TYPE.CHECK;
    account.instrument = resolveCurrencyCode(data.currencyCode);
    account.balance    = toInteger(data.amount);
    account.syncID     = [
        data.ean.toString(),
    ];

    return account;
};

export {
    converter,
}
