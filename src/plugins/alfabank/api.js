import _ from "lodash";
import {fetchJson} from "../../common/network";

const appVersion = "10.8.1";
const deviceName = "Sony D6503";
const osVersion = "7.1.1";
const operationSystem = "Android";
const operationSystemVersion = "25";
const applicationId = "ru.alfabank.mobile.android";
const userAgent = "okhttp/3.8.0";

export async function getAccessToken({sessionId, deviceId, refreshToken}) {
    const response = await fetchJson("https://alfa-mobile.alfabank.ru/ALFAJMB/openid/token?refresh_token=" + refreshToken, {
        method: "GET",
        headers: {
            "APP-VERSION": appVersion,
            "OS-VERSION": osVersion,
            "OS": operationSystem.toLowerCase(),
            "DEVICE-ID": deviceId,
            "DEVICE-MODEL": deviceName,
            "applicationId": applicationId,
            "appVersion": appVersion,
            "osVersion": osVersion,
            "session_id": sessionId,
            "User-Agent": userAgent,
        },
        sanitizeRequestLog: {url: true, headers: {"DEVICE-ID": true, "session_id": true}},
        sanitizeResponseLog: {url: true, body: {access_token: true, refresh_token: true}},
    });

    console.assert(response.status === 200, "Unexpected token status", response);
    console.assert(response.body.operationId === "OpenID:TokenResult", "Unexpected response body.operationId", response);

    return {accessToken: response.body.access_token, expiresIn: response.body.expires_in, refreshToken: response.body.refresh_token};
}

export function login({sessionId, deviceId, accessToken}) {
    return callGate({
        sessionId,
        deviceId,
        accessToken,
        service: "Authorization",
        body: {
            "operationId": "Authorization:Login",
            "parameters": {
                "appVersion": appVersion,
                "deviceId": deviceId,
                "deviceName": deviceName,
                "login": "",
                "loginType": "token",
                "operationSystem": operationSystem,
                "operationSystemVersion": operationSystemVersion,
                "password": "",
            },
        },
        sanitizeRequestLog: {body: true},
        sanitizeResponseLog: {body: true, headers: {"set-cookie": true}},
    });
}

export function isExpiredLogin(loginResult) {
    return loginResult.status === 419 && loginResult.body.id === "TOKEN_EXPIRED";
}

export function assertLoginIsSuccessful(loginResponse) {
    console.assert(loginResponse.status === 200, "Unexpected login status code", loginResponse);
    console.assert(loginResponse.body.header.status === "STATUS_OK", "Unexpected login header.status", loginResponse);
    console.assert(loginResponse.body.operationId === "Authorization:LoginResult", "Unexpected login operationId", loginResponse);
}

function assertNotServerError(response) {
    if (response.status === 500 && Array.isArray(response.body.errors)) {
        const message = _.compact(response.body.errors.map((x) => x.message)).join("\n");
        throw new Error(message);
    }
}

export async function callGate({sessionId, deviceId, service, body, accessToken = null, sanitizeRequestLog = {}, sanitizeResponseLog = {}}) {
    const headers = {
        "jmb-protocol-version": "1.0",
        "jmb-protocol-service": service,
        "APP-VERSION": appVersion,
        "OS-VERSION": osVersion,
        "OS": operationSystem.toLowerCase(),
        "DEVICE-ID": deviceId,
        "DEVICE-MODEL": deviceName,
        "applicationId": applicationId,
        "appVersion": appVersion,
        "osVersion": osVersion,
        "session_id": sessionId,
        "User-Agent": userAgent,
    };
    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetchJson("https://alfa-mobile.alfabank.ru/ALFAJMB/gate", {
        method: "POST",
        headers,
        body,
        sanitizeRequestLog: _.merge({}, {headers: {Authorization: true, "DEVICE-ID": true, "session_id": true}}, sanitizeRequestLog),
        sanitizeResponseLog: sanitizeResponseLog,
    });
    assertNotServerError(response);
    return response;
}

async function getOidReference({queryRedirectParams, previousMultiFactorResponseParams}) {
    const response = await fetchJson("https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/reference", {
        method: "POST",
        body: {
            queryRedirectParams,
            previousMultiFactorResponseParams,
            type: "CARD",
        },
        sanitizeRequestLog: {body: true},
        sanitizeResponseLog: {body: true},
    });
    assertNotServerError(response);
    console.assert(response.status === 200, "getOidReference failed", response);
    const {reference: {reference}} = response.body;
    return reference;
}

async function registerCustomer({queryRedirectParams, cardExpirationDate, cardNumber, phoneNumber}) {
    const response = await fetchJson("https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/registerCustomer", {
        method: "POST",
        body: {
            "credentials": {
                "card": {
                    "expirationDate": cardExpirationDate,
                    "number": cardNumber,
                },
                "phoneNumber": phoneNumber,
                "queryRedirectParams": queryRedirectParams,
                "type": "CARD",
            },
        },
        sanitizeRequestLog: {body: true},
        sanitizeResponseLog: {body: true},
    });
    assertNotServerError(response);
    console.assert(response.status === 200, "registerCustomer failed", response);

    const {params: previousMultiFactorResponseParams} = response.body;
    previousMultiFactorResponseParams.reference = await getOidReference({queryRedirectParams, previousMultiFactorResponseParams});
    return {previousMultiFactorResponseParams};
}

export async function register({deviceId, cardNumber, cardExpirationDate, phoneNumber}) {
    const queryRedirectParams = {
        "acr_values": "card_account:sms",
        "client_id": "mobile-app",
        "device_id": deviceId,
        "is_webview": "true",
        "non_authorized_user": "true",
        "scope": "openid mobile-bank",
    };

    const {previousMultiFactorResponseParams} = await registerCustomer({queryRedirectParams, cardExpirationDate, cardNumber, phoneNumber});
    const confirmationCode = await ZenMoney.readLine("Введите код из СМС сообщения", {inputType: "number"});
    const {redirectUrl} = await finishCustomerRegistration({confirmationCode, queryRedirectParams, previousMultiFactorResponseParams});
    const redirectedResponse = await fetchJson(redirectUrl, {
        sanitizeRequestLog: true,
        sanitizeResponseLog: true,
    });
    const [, accessToken] = redirectedResponse.url.match(/access_token=(.+?)&/);
    const [, refreshToken] = redirectedResponse.url.match(/refresh_token=(.+?)&/);
    return {accessToken, refreshToken};
}

export async function finishCustomerRegistration({confirmationCode, queryRedirectParams, previousMultiFactorResponseParams}) {
    const response = await fetchJson("https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/finishCustomerRegistration", {
        method: "POST",
        body: {
            "credentials": {
                code: confirmationCode,
                queryRedirectParams,
                previousMultiFactorResponseParams,
                type: "CARD",
            },
        },
        sanitizeRequestLog: {body: true},
        sanitizeResponseLog: {url: true, body: true, headers: {"set-cookie": true}},
    });
    assertNotServerError(response);
    console.assert(response.status === 200, "finishCustomerRegistration failed", response);
    const {params: {code}, redirectUrl} = response.body;
    return {code, redirectUrl};
}

export async function getCommonAccounts({sessionId, deviceId}) {
    const response = await callGate({
        sessionId,
        deviceId,
        service: "Budget",
        body: {"operationId": "Budget:GetCommonAccounts", "parameters": {"operation": "mainPage"}},
    });

    console.assert(response.status === 200, "Unexpected response status code", response);
    console.assert(response.body.operationId === "Budget:GetCommonAccountsResult", "Unexpected response body.operationId", response);

    return response.body.accounts;
}

// note: API filters movements by date and respects time+timezone only for determining specific day
const formatApiDate = (date) => date ? date.toISOString().replace(/Z$/, "+0000") : null;

async function getCommonMovements({sessionId, deviceId, startDate = null, endDate = null, offset, count}) {
    const response = await callGate({
        sessionId,
        deviceId,
        service: "Budget",
        body: {
            "operationId": "Budget:GetCommonMovements",
            "operation": "commonStatement",
            "filters": [],
            "tagsCloud": [],

            // e.g. "2018-03-01T00:00:00.000+0300", null
            "startDate": formatApiDate(startDate),
            // e.g. "2018-03-08T23:59:59.999+0300", null
            "endDate": formatApiDate(endDate),

            "offset": offset,
            "count": count,
            "forceCache": false,
        },
    });
    console.assert(response.status === 200, "Unexpected response status code", response);
    return response;
}

const initialRequestedCount = 1024;
const minRequestedCount = 1;

export async function getAllCommonMovements({sessionId, deviceId, startDate = null, endDate = null}) {
    // We receive WS_CALL_ERROR somewhere at the end of the list
    // I found no ways to figure out where logical end is, so we stop when querying minRequestedCount items gives us "WS_CALL_ERROR"
    // Maybe we should limit ourselves by account creation date?
    let pagesOfMovements = [];
    let offset = 0;
    let count = initialRequestedCount;
    const haveReceivedIncompletePage = () => pagesOfMovements.length > 0 && _.last(pagesOfMovements).length < count;
    do {
        const response = await getCommonMovements({sessionId, deviceId, startDate, endDate, offset, count});
        console.assert(response.status === 200, "Unexpected response status code", response);
        if (response.body.header && response.body.header.faultCode === "WS_CALL_ERROR") {
            console.error(`get failed`, {offset, count});
            count /= 2;
        } else {
            console.warn(`get passed`, {offset, count});
            const {operationId, movements} = response.body;
            console.assert(operationId === "Budget:GetCommonMovementsResult", "Unexpected response body.operationId", response);
            pagesOfMovements.push(movements);
            offset += movements.length;
        }
    } while (!haveReceivedIncompletePage() && count >= minRequestedCount);
    return _.flatten(pagesOfMovements);
}

export const parseApiAmount = (apiAmount) => {
    const number = Number(apiAmount.replace(/\s/g, ""));
    console.assert(!isNaN(number), "Cannot parse amount", apiAmount);
    return number;
};
