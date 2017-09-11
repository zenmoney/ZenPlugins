import padLeft from "pad-left";
import {isValidDate} from "../../common/dates";
import {fetchJson} from "../../common/network";
import retry from "../../common/retry";
import codeToCurrencyLookup from "./codeToCurrencyLookup";

export const transactionTypeFactors = {
    "Vozvrat": 1,
    "Vozvrat sredstv": 1,
    "Popolnenie": 1,
    "Service payment to card": 1,
    "Zachislenie": 1,
    "Tovary i uslugi": -1,
    "Bankomat": -1,
    "Nalichnye": -1,
};

export const ownCashTransferTransactionTypes = [
    "Popolnenie",
    "Bankomat",
    "Nalichnye",
];

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

export const bankBirthday = new Date(1033977600000);

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
                "applicationVersion": "Web 5.3.12",
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
        body: confirmationCode.toString(),
        sanitizeRequestLog: {body: true},
    });
    console.assert(response.body.deviceStatus === "CONFIRMED", "confirmation failed:", response);
}

export async function getCards() {
    const response = await fetchJson(makeApiUrl("/cards"), {
        method: "GET",
        sanitizeResponseLog: {body: {contract: true, maskedCardNumber: true, ownerName: true, ownerNameLat: true, rbsContract: true}},
    });
    assertResponseSuccess(response);
    return response.body;
}

export async function getTransactions(cardId, from, to) {
    const response = await fetchJson(makeApiUrl(`/cards/${cardId}/sms`), {
        method: "POST",
        body: {
            fromDate: formatBsbApiDate(from),
            toDate: formatBsbApiDate(to),
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
