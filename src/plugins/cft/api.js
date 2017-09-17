/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {fetchJson} from "../../common/network";

/**
 * @type {boolean}
 */
const logFetches = true;

/**
 * @type {string}
 */
let apiUri = '';

/**
 * @type {{channel: string}}
 */
const defaultHeaders = {
    'channel': 'web'
};

/**
 * @param uri
 */
const setApiUri = (uri) => {
    if (uri.substr(-1) !== '/') uri += '/';

    apiUri = uri;
};

/**
 * @param cardNumber
 * @param password
 * @returns {Promise.<void>}
 */
async function auth(cardNumber, password) {
    const response = await fetchJson(makeApiUrl("authentication/authenticate"), {
        log:                 logFetches,
        method:              "POST",
        body:                {
            principal: cardNumber,
            secret:    password,
            type:      "AUTO",
        },
        headers:             defaultHeaders,
        sanitizeRequestLog:  {
            body: {
                principal: true,
                secret:    true,
            },
        },
        sanitizeResponseLog: {
            headers: true,
        },
    });

    const s = response.body.status;

    if (!(response.status === 200 && s === 'OK')) {
        let reason = 'неизвестная ошибка';

        if (['CANNOT_FIND_SUBJECT', 'PRINCIPAL_IS_EMPTY', 'CANNOT_FOUND_AUTHENTICATION_PROVIDER'].indexOf(s) !== -1 || (s === 'VALIDATION_FAIL' && ['EAN_OUT_OF_RANGE', 'EAN_MUST_HAVE_13_SYMBOLS'].indexOf(response.body.messages[0].code) !== -1)) {
            reason = 'неправильный номер карты';
        } else if (['AUTH_WRONG', 'EMPTY_SECRET_NOT_ALLOWED'].indexOf(s) !== -1) {
            reason = 'неправильный пароль';
        } else if (s === 'AUTH_LOCKED_TEMPORARY') {
            reason = 'доступ временно запрещен';
        } else if (['CORE_NOT_AVAILABLE_ERROR', 'CORE_UNAVAILABLE'].indexOf(s) !== -1) {
            reason = 'технические работы в банке';
        }

        console.assert(false, 'Не удалось авторизоваться: ' + reason, response);
    }
}

/**
 * @returns {Promise.<Array>}
 */
async function fetchCards() {
    const response = await fetchJson(makeApiUrl("cards"), {
        log:                 logFetches,
        headers:             defaultHeaders,
        sanitizeRequestLog:  {},
        sanitizeResponseLog: {
            body: {
                data: {
                    bankInfo: true,
                    phone:    true
                }
            }
        },
    });

    assertResponseSuccess(response);

    return response.body.data;
}

/**
 * @returns {Promise.<Array>}
 */
async function fetchWallets() {
    const response = await fetchJson(makeApiUrl("wallets"), {
        log:                 logFetches,
        headers:             defaultHeaders,
        sanitizeRequestLog:  {},
        sanitizeResponseLog: {},
    });

    assertResponseSuccess(response);

    return response.body.hasOwnProperty('data') && response.body.data.hasOwnProperty('wallets')
        ? response.body.data.wallets
        : [];
}

/**
 * @param dateFrom
 * @returns {Promise.<Array>}
 */
async function fetchTransactions(dateFrom) {
    let isFirstPage  = true;
    let transactions = [];

    const lastSyncTime = new Date(dateFrom).getTime();
    const pagination   = {
        limit:  20,
        offset: 0,
        total:  null,
    };

    console.log('last sync: ' + lastSyncTime + ' (' + dateFrom + ')');

    while (isFirstPage || pagination.offset < pagination.total) {
        const data = await fetchTransactionsInternal(pagination.limit, pagination.offset);

        if (data.part.offset !== pagination.offset) { // банк ограничивает выборку
            break;
        }

        if (isFirstPage) {
            pagination.total = data.part.totalCount;
            isFirstPage      = false;
        }

        const loadNext = data.data
                             .filter((transaction) => transaction.itemType === 'OPERATION' && ('money' in transaction))
                             .every((transaction) => {
                                 const isActual = transaction.date > lastSyncTime;

                                 isActual && transactions.push(transaction);

                                 return isActual;
                             });

        if (loadNext) {
            pagination.offset += pagination.limit;
        } else {
            break;
        }
    }

    return transactions;
}

/**
 * @param limit
 * @param offset
 * @returns {Promise.<Array>}
 */
async function fetchTransactionsInternal(limit, offset) {
    const urlParams = {
        'limit':  limit,
        'offset': offset,
    };

    const response = await fetchJson(makeApiUrl("hst", urlParams), {
        log:                 logFetches,
        headers:             defaultHeaders,
        sanitizeRequestLog:  {},
        sanitizeResponseLog: {},
    });

    assertResponseSuccess(response, [
        'OK',
        'OK_SYNC',
    ]);

    return response.body;
}

/**
 * @param response
 * @param allowedStatuses
 */
const assertResponseSuccess = (response, allowedStatuses = ['OK']) => {
    console.assert(
        response.status === 200 && allowedStatuses.indexOf(response.body.status) !== -1,
        "non-successful response",
        response
    );
};

/**
 * @param path
 * @param params
 * @returns {string}
 */
const makeApiUrl = (path, params = {}) => {
    params['rid'] = generateHash();

    const query = Object.keys(params)
                        .map((key) => {
                            return [
                                key,
                                params[key]
                            ].map(encodeURIComponent).join("=")
                        })
                        .join("&");

    return apiUri + path + '?' + query;
};

/**
 * @returns {string}
 */
const generateHash = () => {
    return '0123456789abcdf'.repeat(5).split('').sort(() => {
        return 0.5 - Math.random()
    }).join('').substring(0, 13);
};

export {
    apiUri,
    setApiUri,
    auth,
    fetchCards,
    fetchWallets,
    fetchTransactions,
    makeApiUrl,
    generateHash,
};
