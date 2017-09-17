/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as main from "../cft/main";

/**
 * @type {string}
 */
const uriApi = 'https://bank.beeline.ru/api/v0001/';

/**
 * @param fromDate
 * @param toDate
 * @returns {Promise.<Array.<*>>}
 */
async function scrape({fromDate, toDate}) {
    return await main.scrape(uriApi, fromDate);
}

export {
    scrape,
};
