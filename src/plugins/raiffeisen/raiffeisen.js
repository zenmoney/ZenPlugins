import {toAtLeastTwoDigitsString} from "../../common/dates";
import * as network from "../../common/network";
import * as retry from "../../common/retry";

async function fetchJson(url, options = {}, predicate = () => true) {
    options = Object.assign({
        method: "GET",
        sanitizeRequestLog: {headers: {"Authorization": true}},
    }, options);
    options.headers = Object.assign({
        "Host": "online.raiffeisen.ru",
        "Content-Type": "application/json",
        "RC-Device": "android",
        "Accept-Encoding": "gzip",
        "Accept": "application/json",
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 6.0; Android SDK built for x86_64 Build/MASTER)",
        "Accept-Language": "ru",
    }, options.headers || {});

    let response;
    try {
        response = (await retry.retry({
            getter: retry.toNodeCallbackArguments(() => network.fetchJson(url, options)),
            predicate: ([error, response]) => !error && response && response.status < 500,
            maxAttempts: 10,
        }))[1];
    } catch (e) {
        let err = e;
        if (err instanceof retry.RetryError) {
            err = err.failedResults.find(([error, response]) => error !== null);
            err = err ? err[0] : new TemporaryError("[NER]");
        }
        throw err;
    }

    if (predicate) {
        validateResponse(response, response => response.body && !response.body.error && predicate(response));
    }

    return response;
}

function validateResponse(response, predicate) {
    console.assert(!predicate || predicate(response), "non-successful response");
}

export async function login(login, password) {
    let response = await fetchJson("https://online.raiffeisen.ru/oauth/token", {
        method: "POST",
        headers: {
            "Authorization": "Basic b2F1dGhVc2VyOm9hdXRoUGFzc3dvcmQhQA==",
        },
        body: {
            "grant_type": "password",
            "password": password,
            "platform": "android",
            "username": login,
            "version": "497",
        },
        sanitizeRequestLog:  {body: {username: true, password: true}},
        sanitizeResponseLog: {body: {username: true, access_token: true, resource_owner: true}},
    }, null);

    if (response.status === 401) {
        throw new TemporaryError("Неверный логин или пароль");
    }
    if (response.status === 222) {
        throw new TemporaryError("Пароль устарел. Смените его в приложении банка, а потом обновите в настройках подключения.");
    }
    if (response.status === 267) {
        const confirmData = (await fetchJson("https://online.raiffeisen.ru/oauth/entry/confirm/sms", {
            method: "POST",
        }, response => response.body.requestId && response.body.methods)).body;
        if (!confirmData.methods.some(method => method.method === "SMSOTP")) {
            throw new Error("Райффайзенбанк: Неизвестный способ подтверждения входа");
        }
        const prompt = "Райффайзенбанк: Для подтверждения входа и импорта из банка введите код из СМС";
        const code = ZenMoney.retrieveCode(prompt, null, {
            inputType: "numberDecimal",
            time: confirmData["await"] || 120000,
        });
        response = await fetchJson(`https://online.raiffeisen.ru/oauth/entry/confirm/${confirmData.requestId}/sms`, {
            method: "PUT",
            body: {
                code: code,
            },
            sanitizeResponseLog: {body: {username: true, access_token: true, resource_owner: true}},
        }, null);
        if (response.status !== 200) {
            throw new TemporaryError("Введён неверный код подтверждения. Запустите импорт ещё раз.");
        }
    }
    if (response.body &&
        response.body.error === "invalid_request" &&
        response.body.error_description === "Missing grant type") {
        throw new TemporaryError("У вас старая версия приложения Дзен-мани. Для корректной работы плагина обновите приложение до последней версии");
    }

    validateResponse(response, response => response.body && !response.body.error && response.body.access_token);

    return {
        accessToken: response.body.access_token,
    };
}

export async function fetchAccounts(token) {
    const response = await fetchJson("https://online.raiffeisen.ru/rest/account?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    }, response => Array.isArray(response.body));
    return response.body;
}

export async function fetchCards(token) {
    const response = await fetchJson("https://online.raiffeisen.ru/rest/card?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    }, response => Array.isArray(response.body));
    return response.body;
}

export async function fetchDepositsWithTransactions(token) {
    const response = await fetchJson("https://online.raiffeisen.ru/rest/deposit?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    }, response => Array.isArray(response.body));
    return response.body;
}

export async function fetchLoans(token) {
    const response = await fetchJson("https://online.raiffeisen.ru/rest/loan?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    }, response => Array.isArray(response.body));
    return response.body;
}

async function fetchTransactionsPaged(token, page, limit) {
    const response = await fetchJson(`https://online.raiffeisen.ru/rest/transaction?size=${limit}&sort=date&page=${page}&order=desc`, {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    }, response => response.body.list);
    return response.body.list;
}

export async function fetchTransactions(token, fromDate) {
    const fromDateStr = fromDate.getFullYear() + "-" +
        toAtLeastTwoDigitsString(fromDate.getMonth() + 1) + "-" +
        toAtLeastTwoDigitsString(fromDate.getDate());
    const limit = 25;
    let transactions = [];
    let page = 0;
    while (true) {
        const batch = await fetchTransactionsPaged(token, page++, limit);
        transactions = transactions.concat(batch.filter(transaction => transaction.date.substring(0, 10) >= fromDateStr));
        if (batch.length <= 0 || batch[batch.length - 1].date.substring(0, 10) < fromDateStr) {
            break;
        }
    }
    return transactions;
}
