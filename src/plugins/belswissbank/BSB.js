import padLeft from "pad-left";
import {isValidDate} from "../../common/dates";
import {fetchJson} from "../../common/network";
import retry from "../../common/retry";
import codeToCurrencyLookup from "./codeToCurrencyLookup";

const transactionTypeFactors = {
    "Возврат": 1,
    "Vozvrat": 1,
    "Возврат средств": 1,
    "Vozvrat sredstv": 1,
    "Пополнение": 1,
    "Popolnenie": 1,
    "Service payment to card": 1,
    "Зачисление": 1,
    "Zachislenie": 1,
    "Товары и услуги": -1,
    "Tovary i uslugi": -1,
    "Банкомат": -1,
    "Bankomat": -1,
    "Наличные": -1,
    "Nalichnye": -1,
};

const rejectedTransactionTypes = [
    "Отказ",
    "Otkaz",
];

const cashTransferTransactionTypes = [
    "Пополнение",
    "Popolnenie",
    "Банкомат",
    "Bankomat",
    "Наличные",
    "Nalichnye",
];

export const getTransactionFactor = (transaction) => {
    console.assert(transaction.transactionType in transactionTypeFactors, "unknown transactionType in transaction:", transaction);
    return transactionTypeFactors[transaction.transactionType];
};

export const isElectronicTransferTransaction = (transaction) => transaction.transactionDetails === "PERSON TO PERSON I-B BSB";

export const isCashTransferTransaction = (transaction) => cashTransferTransactionTypes.indexOf(transaction.transactionType) !== -1;

export const isRejectedTransaction = (transaction) => rejectedTransactionTypes.indexOf(transaction.transactionType.trim()) !== -1;

export function formatBsbApiDate(userDate) {
    if (!isValidDate(userDate)) {
        throw new Error("valid date should be provided");
    }
    // day.month.year in bank timezone (+3)
    const bankTimezone = 3 * 3600 * 1000;
    const date = new Date(userDate.valueOf() + bankTimezone);
    return [
        date.getUTCDate(),
        date.getUTCMonth() + 1,
        date.getUTCFullYear(),
    ].map((number) => padLeft(number, 2, "0")).join(".");
}

export const assertResponseSuccess = function(response) {
    console.assert(response.status === 200, "non-successful response", response);
};

const makeApiUrl = (path) => `https://24.bsb.by/mobile/api${path}?lang=ru`;

export async function authorize(username, password, deviceId) {
    const BSB_AUTH_URL = makeApiUrl("/authorization");
    await fetchJson(BSB_AUTH_URL, {
        method: "DELETE",
    });

    const authStatusResponse = await retry({
        getter: () => fetchJson(BSB_AUTH_URL, {
            method: "POST",
            body: {
                "username": username,
                "password": password,
                "deviceId": deviceId,
                "applicationVersion": "Web 5.8.1",
                "osType": 3,
                "currencyIso": "BYN",
            },
            sanitizeRequestLog: {body: {username: true, password: true, deviceId: true}},
            sanitizeResponseLog: {body: {birthDate: true, eripId: true, fio: true, mobilePhone: true, sessionId: true, username: true}},
        }),
        predicate: (response) => response.status !== 415,
        maxAttempts: 10,
    });
    assertResponseSuccess(authStatusResponse);
    return authStatusResponse.body;
}

export async function confirm(deviceId, confirmationCode) {
    const response = await fetchJson(makeApiUrl(`/devices/${deviceId}`), {
        method: "POST",
        body: confirmationCode,
        sanitizeRequestLog: {body: true},
    });
    console.assert(response.body.deviceStatus === "CONFIRMED", "confirmation failed:", response);
}

export async function fetchCards() {
    const response = await fetchJson(makeApiUrl("/cards"), {
        method: "GET",
        sanitizeResponseLog: {body: {contract: true, maskedCardNumber: true, ownerName: true, ownerNameLat: true, rbsContract: true}},
    });
    assertResponseSuccess(response);
    return response.body;
}

export async function fetchTransactions(cardId, fromDate, toDate) {
    const response = await fetchJson(makeApiUrl(`/cards/${cardId}/sms`), {
        method: "POST",
        body: {
            fromDate: formatBsbApiDate(fromDate),
            toDate: formatBsbApiDate(toDate || new Date()),
        },
        sanitizeResponseLog: {body: {last4: true}},
    });
    assertResponseSuccess(response);
    return response.body;
}

export function currencyCodeToIsoCurrency(currencyCode) {
    console.assert(currencyCode in codeToCurrencyLookup, "unknown currency", currencyCode);
    return codeToCurrencyLookup[currencyCode];
}

function getAccountRest({transactions, index, accountCurrency}) {
    console.assert(0 <= index && index < transactions.length, "index out of range");
    const transaction = transactions[index];
    if (transaction.accountRest === null) {
        if (transaction.transactionCurrency === accountCurrency && index > 0) {
            const previousAccountRest = getAccountRest({
                transactions,
                index: index - 1,
                accountCurrency,
            });
            if (previousAccountRest !== null) {
                return previousAccountRest + getTransactionFactor(transactions[index]) * transactions[index].transactionAmount;
            }
        }
    }
    return transaction.accountRest;
}

export function figureOutAccountRestsDelta({transactions, index, accountCurrency}) {
    console.assert(0 <= index && index < transactions.length, "index out of range");
    if (index === 0) {
        return null;
    }
    const previousAccountRest = getAccountRest({transactions, index: index - 1, accountCurrency});
    const currentAccountRest = getAccountRest({transactions, index, accountCurrency});
    return previousAccountRest === null || currentAccountRest === null ? null : currentAccountRest - previousAccountRest;
}
