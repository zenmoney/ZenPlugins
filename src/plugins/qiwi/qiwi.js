import {fetchJson} from "../../common/network";
import {toAtLeastTwoDigitsString} from "../../common/dates";

function defaultOptions(token) {
    return {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Host": "edge.qiwi.com",
        },
        sanitizeRequestLog: {headers: {Authorization: true}},
    };
}

function formatDate(date) {
    return date.getUTCFullYear()
        + "-" + toAtLeastTwoDigitsString(date.getUTCMonth() + 1)
        + "-" + toAtLeastTwoDigitsString(date.getUTCDate() + 1)
        + "T" + toAtLeastTwoDigitsString(date.getUTCHours())
        + ":" + toAtLeastTwoDigitsString(date.getUTCMinutes())
        + ":" + toAtLeastTwoDigitsString(date.getUTCSeconds())
        + "+00:00";
}

export async function login(token) {
    const response = await fetchJson("https://edge.qiwi.com/person-profile/v1/profile/current", {
        ...defaultOptions(token),
        sanitizeResponseLog: {body: true},
    });
    if (response.status === 401) {
        throw new InvalidPreferencesError("Токен просрочен либо введен неверно. Настройте подключение заново.");
    }
    return {walletId: response.body.authInfo.personId, token};
}

export async function fetchAccounts({token, walletId}) {
    const response = await fetchJson(`https://edge.qiwi.com/funding-sources/v2/persons/${walletId}/accounts`,
        defaultOptions(token));
    return response.body.accounts;
}

export async function fetchTransactions({token, walletId}, fromDate, toDate) {
    toDate = toDate || new Date();
    return fetchTransactionPaged({token, walletId}, fromDate, toDate);
}

async function fetchTransactionPaged({token, walletId}, fromDate, toDate) {
    const response = await fetchJson(
        `https://edge.qiwi.com/payment-history/v2/persons/${walletId}/payments?rows=50`
        + `&startDate=${encodeURIComponent(formatDate(fromDate))}`
        + (toDate ? `&endDate=${encodeURIComponent(formatDate(toDate))}` : ""),
        defaultOptions(token));
    return response.body.data;
}
