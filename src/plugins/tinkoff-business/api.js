import {Base64} from "jshashes";
import * as network from "../../common/network";
import {getUid} from "../sberbank-online/sberbank";
import {toAtLeastTwoDigitsString} from "../../common/dates";

const base64 = new Base64();

const qs = require("querystring");

const CLIENT_SECRET = "";
const CLIENT_ID = "";
const REDIRECT_URI = "";

async function fetchJson(url, options = {}) {
    return await network.fetchJson(url, {
        method: "POST",
        sanitizeRequestLog: {headers: {Authorization: true}},
        sanitizeResponseLog: {headers: {"set-cookie": true}},
        ...options,
        stringify: qs.stringify,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...options.headers,
        },
    });
}

export async function login({accessToken, refreshToken, expirationDateMs} = {}) {
    let response;
    if (accessToken) {
        const expirationDate = new Date(expirationDateMs);
        if (expirationDate < new Date() + 60000) {
            response = await fetchJson("https://sso.tinkoff.ru/secure/token", {
                headers: {
                    "Host": "sso.tinkoff.ru",
                },
                body: {
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                    fingerprint: "{}",
                },
            });
        } else {
            return arguments[0];
        }
    } else if (ZenMoney.openWebView) {
        const {error, code} = await new Promise((resolve) => {
            const state = getUid(16);
            const redirectUriWithoutProtocol = REDIRECT_URI.replace(/^https?:\/\//i, "");
            const url = `https://sso.tinkoff.ru/authorize?${qs.stringify({
                "client_id": CLIENT_ID,
                "redirect_uri": REDIRECT_URI,
                "state": state,
            })}`;
            ZenMoney.openWebView(url, null, (request, callback) => {
                const i = request.url.indexOf(redirectUriWithoutProtocol);
                if (i < 0) {
                    return;
                }
                const params = qs.parse(request.url.substring(i + redirectUriWithoutProtocol.length + 1));
                if (params.code && params.state === state) {
                    callback(null, params.code);
                } else {
                    callback(params);
                }
            }, (error, code) => resolve({error, code}));
        });
        if (error && (!error.error || error.error === "access_denied")) {
            throw new TemporaryError("Не удалось пройти авторизацию в Тинькофф Бизнес. Попробуйте еще раз");
        }
        console.assert(code && !error, "non-successfull authorization", error);
        response = await fetchJson("https://sso.tinkoff.ru/secure/token", {
            headers: {
                "Host": "sso.tinkoff.ru",
                "Authorization": `Basic ${base64.encode(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
            },
            body: {
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI,
            },
        });
    } else {
        throw new TemporaryError("У вас старая версия приложения Дзен-мани. Для корректной работы плагина обновите приложение до последней версии.");
    }
    console.assert(response.body
        && response.body.access_token
        && response.body.refresh_token
        && response.body.expires_in, "non-successfull authorization", response);
    return {
        accessToken: response.body.access_token,
        refreshToken: response.body.refresh_token,
        expirationDateMs: new Date().getTime() + response.body.expires_in * 1000,
    };
}

export async function fetchAccounts({accessToken}, {inn}) {
    const response = await fetchJson(`https://sme-partner.tinkoff.ru/api/v1/partner/company/${inn}/accounts`, {
        method: "GET",
        headers: {
            Host: "sme-partner.tinkoff.ru",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return response.body;
}

function formatDate(date) {
    return date.getUTCFullYear() + "-"
        + toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + "-"
        + toAtLeastTwoDigitsString(date.getUTCDate()) + "+00:00:00";
}

export async function fetchTransactions({accessToken}, {inn}, {id}, fromDate, toDate) {
    const response = await fetchJson(`https://sme-partner.tinkoff.ru/api/v1/partner/company/${inn}/excerpt?`
        + `accountNumber=${id}`
        + `&from=${encodeURIComponent(formatDate(fromDate))}`
        + `&till=${encodeURIComponent(formatDate(toDate))}`, {
        method: "GET",
        headers: {
            Host: "sme-partner.tinkoff.ru",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return response.body.operation;
}
