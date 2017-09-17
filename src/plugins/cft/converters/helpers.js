/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import _ from "lodash";

/**
 * @param data
 * @returns {{}}
 */
const mapContractToAccount = (data) => {
    const map = {};

    data.forEach(function (item) {
        map[item.contractId.toString()] = cardUniqueAccountId(item.id);
    });

    return map;
};

/**
 * @param value
 * @returns {number}
 */
const toInteger = (value) => {
    return value * 1;
};

/**
 * @param code
 * @returns {string}
 */
const resolveCurrencyCode = (code) => {
    return code === 'RUR' ? 'RUB' : code;
};

/**
 * @param id
 * @returns {string}
 */
const cardUniqueAccountId = (id) => {
    return uniqueAccountId('c', id);
};

/**
 * @param id
 * @returns {string}
 */
const walletUniqueAccountId = (id) => {
    return uniqueAccountId('w', id);
};

/**
 * @param prefix
 * @param id
 * @returns {string}
 */
const uniqueAccountId = (prefix, id) => {
    return prefix + '-' + id;
};

export {
    mapContractToAccount,
    toInteger,
    resolveCurrencyCode,
    cardUniqueAccountId,
    walletUniqueAccountId,
}
