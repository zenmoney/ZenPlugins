import * as network from "../../common/network";
import {toAtLeastTwoDigitsString} from "../../common/dates";
import {sanitizeSyncId} from "../../common/accounts";

const qs = require("querystring");

const CLIENT_ID = "sandbox";
const CLIENT_SECRET = "sandbox_secret";
const API_REDIRECT_URI = "https://zenmoney.ru/callback/tochka/";
const SANDBOX_REDIRECT_URI = "https://localhost:8000/";
const API_URI = "https://enter.tochka.com/api/v1/";
const SANDBOX_URI = "https://enter.tochka.com/sandbox/v1/";

export async function login({accessToken, refreshToken, expirationDateMs} = {}, preferences) {
    let response;
    const client_id = preferences.server === "tochka" ? CLIENT_ID : "sandbox";
    const client_secret = preferences.server === "tochka" ? CLIENT_SECRET : "sandbox_secret";
    console.log(">>> Используется сервер: "+ preferences.server);
    if (accessToken) {
        if (expirationDateMs < new Date().getTime() + 7200000) {
            console.log(">>> Авторизация: Обновляем токен, взамен протухшего.");
            response = await fetchJson("oauth2/token", {
                sandbox: client_id === "sandbox",
                ignoreErrors: true,
                body: {
                    client_id: client_id,
                    client_secret: client_secret,
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                },
                sanitizeRequestLog: {body: {refresh_token: true}},
                sanitizeResponseLog: {body: {access_token: true, refresh_token: true, sessionId: true}},
            }, null);
            if (response.body && response.body.error) {
                response = null;
                accessToken = null;
                console.log(">>> Авторизация: Не удалось обновить токен. Требуется повторный вход.");
            }
        } else {
            console.log(">>> Авторизация: Используем действующзий токен.");
            return arguments[0];
        }
    }
    if (accessToken) {
        //nothing
    } else if (ZenMoney.openWebView) {
    //} else if (true) {
        console.log(">>> Авторизация: Входим через интерфейс банка.");

        const {error, code} = await new Promise((resolve) => {
            const redirectUriWithoutProtocol = (client_id === "sandbox" ? SANDBOX_REDIRECT_URI : API_REDIRECT_URI).replace(/^https?:\/\//i, "");
            const url = client_id === "sandbox"
                ? "https://enter.tochka.com/sandbox/login/"
                : `https://enter.tochka.com/api/v1/authorize?${qs.stringify({
                    client_id: client_id,
                    response_type: "code",
                })}`;
            console.log(">>> WebView: "+ (client_id !== "sandbox" ? url.replace(client_id, "*****") : url));
            ZenMoney.openWebView(url, null, (request, callback) => {
                const i = request.url.indexOf(redirectUriWithoutProtocol);
                if (i < 0) {
                    return;
                }
                const params = qs.parse(request.url.substring(i + redirectUriWithoutProtocol.length + 1));
                if (params.code) {
                    callback(null, params.code);
                } else {
                    callback(params);
                }
            }, (error, code) => resolve({error, code}));
        });
        if (error && (!error.error || error.error === "access_denied")) {
            throw new TemporaryError("Не удалось пройти авторизацию в банке Точка. Попробуйте еще раз");
        }
        console.assert(code && !error, "non-successfull authorization", error);

        //DEBUG SANDBOX
        //const code = "lscrSeKFC3etECTdqnP0zs9X2ktfEanm";

        console.log(">>> Авторизация: Запрашиваем токен.");
        response = await fetchJson("oauth2/token", {
            sandbox: client_id === "sandbox",
            method: "POST",
            body: {
                client_id: client_id === "sandbox" ? "sandbox" : CLIENT_ID,
                client_secret: client_id === "sandbox" ? "sandbox_secret" : CLIENT_SECRET,
                grant_type: "authorization_code",
                code: code,
            },
            sanitizeRequestLog: {body: {client_id: true, client_secret:true, code: true}},
            sanitizeResponseLog: {body: {access_token: true, refresh_token: true}},
        }, null);
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

async function fetchJson(url, options = {}, predicate = () => true) {
    if (url.substr(0, 4) !== "http")
        url = (options.sandbox ? SANDBOX_URI : API_URI) + url;

    let response;
    try {
        response = await network.fetchJson(url, {
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
    } catch (e) {
        if (e.response && typeof e.response.body === "string" && e.response.body.indexOf("internal server error") >= 0) {
            throw new TemporaryError("Информация из банка Точка временно недоступна. Повторите синхронизацию через некоторое время.\n\nЕсли ошибка будет повторяться, откройте Настройки синхронизации и нажмите \"Отправить лог последней синхронизации разработчикам\".");
        } else {
            throw e;
        }
    }
    if (!options.ignoreErrors && response.body && response.body.error && response.body.error_description) {
        throw new Error("Ответ банка: "+ response.body.error_description);
    }
    if (predicate) {
        if (response.body && response.body.errorCode === "AUTH_REQUIRED") {
            throw new Error("AuthError")
        }
        console.assert(predicate(response), "non-successful response");
    }
    return response;
}

export async function fetchAccounts({accessToken}, preferences) {
    console.log(">>> Получаем список счетов");

    const response = await fetchJson("account/list", {
        sandbox: preferences.server === "sandbox",
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return response.body;
}

function formatDate(date) {
    return date.getUTCFullYear() + "-"
        + toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + "-"
        + toAtLeastTwoDigitsString(date.getUTCDate());
    //return toAtLeastTwoDigitsString(date.getUTCDate()) + "." + toAtLeastTwoDigitsString(date.getUTCMonth() + 1) + "." + date.getUTCFullYear();
}

export async function fetchStatement({ accessToken }, { account_code, bank_code }, fromDate, toDate, preferences) {
    console.log(`>>> Получаем выписку по операциям на счету '${sanitizeSyncId(account_code)}'`);

    let response = await fetchJson("statement", {
        sandbox: preferences.server === "sandbox",
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: {
            account_code: account_code,
            bank_code: bank_code,
            date_start: formatDate(fromDate),
            date_end: formatDate(toDate),
        },
        /*body: JSON.stringify({
            "account_code" : "40702810101270000000",
            "bank_code" : "044525999",
            "date_start" : "2018-09-01",
            "date_end" : "2018-09-21",
        }),*/
    }, /*response => _.get(response, "response.body.request_id")*/);
    if (response.body.message === "Bad JSON") {
        console.log(`>>> Не удалось создать выписку операций '${sanitizeSyncId(account_code)}'`);
        return {};
    }

    const request_id = response.body.request_id;
    response = await fetchJson("statement/status/"+request_id, {
        sandbox: preferences.server === "sandbox",
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    }, /*response => _.get(response, "response.body.status")*/);
    if (response.body.message === "Bad JSON") {
        console.log(">>> Не удалось получить статус выписки");
        return {};
    }

    const status = response.body.status;
    if (status === "ready") {
        response = await fetchJson("statement/result/"+request_id, {
            sandbox: preferences.server === "sandbox",
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }, /*response => _.get(response, "response.body.payments")*/);
    }
    if (response.body.message === "Bad JSON") {
        console.log(">>> Не удалось получить выписку");
        return {};
    }

    return response.body;
}
