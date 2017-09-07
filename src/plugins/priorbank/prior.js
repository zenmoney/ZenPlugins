import {SHA512} from "jshashes";
import _ from "underscore";
import {isValidDate} from "../../common/dates";
import {fetchJson} from "../../common/network";

function isSuccessfulResponse(response) {
    return response.status === 200 && (!("success" in response.body) || response.body.success === true);
}

function assertResponseSuccess(response) {
    console.assert(isSuccessfulResponse(response), "non-successful response", response);
}

const makeApiUrl = (path) => `https://www.prior.by/api3/api${path}`;

export async function fetchPreAuthHeaders() {
    const response = await fetchJson(makeApiUrl("/Authorization/MobileToken"), {
        sanitizeResponseLog: {body: true},
    });
    assertResponseSuccess(response);

    return {
        "Authorization": `${response.body.token_type} ${response.body.access_token}`,
        "client_id": response.body.client_secret,
        "User-Agent": "PriorMobile3/3.17.03.22 (Android 24; versionCode 37)",
    };
}

export async function fetchLoginSalt({preAuthHeaders, login}) {
    const response = await fetchJson(makeApiUrl("/Authorization/GetSalt"), {
        method: "POST",
        body: {login, lang: "RUS"},
        headers: preAuthHeaders,
        sanitizeRequestLog: {body: {login: true}, headers: true},
        sanitizeResponseLog: {body: {result: true}},
    });
    assertResponseSuccess(response);

    return response.body.result.salt;
}

const sha512 = new SHA512();

export const calculatePasswordHash = ({loginSalt, password}) => sha512.hex(sha512.hex(password.slice(0, 16)) + loginSalt);

export async function login({preAuthHeaders, loginSalt, login, password}) {
    const response = await fetchJson(makeApiUrl("/Authorization/Login"), {
        method: "POST",
        body: {login, password: calculatePasswordHash({loginSalt, password}), lang: "RUS"},
        headers: preAuthHeaders,
        sanitizeRequestLog: {body: {login: true, password: true}, headers: true},
        sanitizeResponseLog: {body: {result: true}},
    });
    assertResponseSuccess(response);

    return {
        accessToken: response.body.result.access_token,
        userSession: response.body.result.userSession,
    };
}

export function calculatePostAuthHeaders({preAuthHeaders, accessToken}) {
    return _.extend({}, preAuthHeaders, {"Authorization": `bearer ${accessToken}`});
}

export async function fetchCards({postAuthHeaders, userSession}) {
    const response = await fetchJson(makeApiUrl("/Cards"), {
        method: "POST",
        body: {usersession: userSession},
        headers: postAuthHeaders,
        sanitizeRequestLog: {body: {usersession: true}, headers: true},
        sanitizeResponseLog: {body: {result: {clientObject: {cardRBSNumber: true, contractNum: true, iban: true}}}},
    });
    assertResponseSuccess(response);

    return response.body.result;
}

export async function fetchCardDetails({postAuthHeaders, userSession, from = null, to = null}) {
    const body = {
        usersession: userSession,
        ids: [],
        dateFromSpecified: false,
        dateToSpecified: false,
    };
    if (from) {
        body.dateFromSpecified = true;
        body.dateFrom = from;
    }
    if (to) {
        body.dateToSpecified = true;
        body.dateTo = to;
    }
    const response = await fetchJson(makeApiUrl("/Cards/CardDesc"), {
        method: "POST",
        body,
        headers: postAuthHeaders,
        sanitizeRequestLog: {body: {usersession: true}, headers: true},
        sanitizeResponseLog: {body: {result: {contract: {addrLineA: true, addrLineB: true, addrLineC: true}}}},
    });
    assertResponseSuccess(response);
    return response.body.result;
}

const extractTransactionBuckets = (cardDetails) => {
    const abortedTransactions = cardDetails.contract.abortedContractList.map((x) => ({
        committed: false,
        items: x.abortedTransactionList,
    }));
    const regularTransactions = cardDetails.contract.account.transCardList.map((x) => ({
        committed: true,
        items: x.transactionList,
    }));
    return abortedTransactions.concat(regularTransactions);
};

const knownTransactionTypes = ["Retail", "ATM", "CH Debit"];

const normalizeSpaces = (text) => _.compact(text.split(" ")).join(" ");

function parseTransDetails(transDetails) {
    const type = knownTransactionTypes.find((type) => transDetails.startsWith(type + " "));
    if (type) {
        return {type, payee: normalizeSpaces(transDetails.slice(type.length)), comment: null};
    } else {
        return {type: null, payee: null, comment: normalizeSpaces(transDetails)};
    }
}

const normalizePreparedItem = (item, accountCurrency) => {
    const transactionCurrency = item.transCurrIso;
    const isCurrencyConversion = accountCurrency !== transactionCurrency;
    return ({
        transactionDate: new Date(item.transDate),
        transactionAmount: -item.transAmount,
        transactionCurrency: item.transCurrIso,
        accountDate: null,
        accountAmount: -item.amount,
        accountCurrency,
        details: parseTransDetails(item.transDetails),
        isCurrencyConversion,
        __sourceKind: "prepared",
        __source: item,
    });
};

const normalizeCommittedItem = (item, accountCurrency) => {
    const transactionCurrency = item.transCurrIso;
    const transactionDate = new Date(item.transDate);
    const accountDate = new Date(item.postingDate);
    const accountAmount = item.accountAmount;
    const isCurrencyConversion = accountCurrency !== transactionCurrency;
    const transactionAmount = isCurrencyConversion ? item.amount : accountAmount;
    return {
        transactionDate,
        transactionAmount,
        transactionCurrency,
        accountDate,
        accountAmount,
        accountCurrency,
        details: parseTransDetails(item.transDetails),
        isCurrencyConversion,
        __sourceKind: "committed",
        __source: item,
    };
};

const normalizeTransactionItem = ({committed, item, accountCurrency}) => committed
    ? normalizeCommittedItem(item, accountCurrency)
    : normalizePreparedItem(item, accountCurrency);

const extractAndNormalizeTransactions = (cardDetails, accountCurrency) => {
    const transactions = _.flatten(extractTransactionBuckets(cardDetails)
        .map(({committed, items}) => items
            .map((item) => normalizeTransactionItem({committed, item, accountCurrency}))
            .reverse()
        ));
    transactions.forEach(checkNormalizedTransaction);
    return _.sortBy(transactions, x => x.transactionDate);
};

const checkNormalizedTransaction = (transaction) => {
    [
        "transactionAmount",
        "accountAmount",
        "transactionCurrency",
        "accountCurrency",
        "details",
    ].forEach((key) => console.assert(transaction[key], "!" + key, transaction));
    console.assert(isValidDate(transaction.transactionDate), "transactionDate is invalid date", transaction);
    console.assert(transaction.accountDate === null || isValidDate(transaction.accountDate), "accountDate is invalid date", transaction);
    console.assert(typeof transaction.isCurrencyConversion === "boolean", "bool isCurrencyConversion", transaction);
};

export function joinTransactions({cardItems, cardDetailItems}) {
    return cardItems.map((card) => ({
        ...card,
        transactions: extractAndNormalizeTransactions(
            _.find(cardDetailItems, {id: card.clientObject.id}),
            card.clientObject.currIso
        ),
    }));
}

export function getAccountType(card) {
    if (card.clientObject.type !== 6) {
        console.error(`Unknown cardType, falling back to ccard, card=`, card.clientObject);
    }
    return "ccard";
}
