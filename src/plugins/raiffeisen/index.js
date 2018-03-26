import * as network from "../../common/network";
import * as retry from "../../common/retry";
import {convertAccountMapToArray, convertAccountSyncID} from "../../common/accounts";
import {toAtLeastTwoDigitsString} from "../../common/dates";
import {convertTransactionAccounts} from "../../common/transactions";
import {
    convertAccounts,
    convertCards,
    convertDepositsWithTransactions,
    convertLoans,
    convertTransactions
} from "./converters";

async function fetchJson(url, options = {}, predicate = () => true) {
    options = Object.assign({
        method: "GET",
        sanitizeRequestLog: {headers: {"Authorization": true}}
    }, options);
    options.headers = Object.assign({
        "Host": "sso.raiffeisen.ru",
        "Content-Type": "application/json",
        "RC-Device": "ios",
        "Accept-Encoding": "br, gzip, deflate",
        "Accept": "application/json",
        "User-Agent": "Raiffeisen 5.0.4 (140) / iPhone (iOS 11.2.2) / iPhone10,4",
        "Accept-Language": "ru;q=1"
    }, options.headers || {});

    let response;
    try {
        response = (await retry.retry({
            getter: retry.toNodeCallbackArguments(() => network.fetchJson(url, options)),
            predicate: ([error, response]) => !error && response && response.status < 500,
            maxAttempts: 10
        }))[1];
    } catch (e) {
        if (e instanceof retry.RetryError) {
            e = e.failedResults.find(([error, response]) => error !== null);
            e = e ? e[0] : new ZenMoney.Error("[NER]", true);
        }
        throw e;
    }

    if (predicate) {
        validateResponse(response, response => response.body && !response.body.error && predicate(response));
    }

    return response;
}

function validateResponse(response, predicate) {
    console.assert(!predicate || predicate(response), "non-successful response");
}

async function login(login, password) {
    let response = await fetchJson("https://sso.raiffeisen.ru/oauth/token", {
        method: "POST",
        headers: {
            "Authorization": "Basic b2F1dGhVc2VyOm9hdXRoUGFzc3dvcmQhQA=="
        },
        body: {
            "grant_type": "password",
            "password": password,
            "platform": "ios",
            "username": login,
            "version": "140"
        },
        sanitizeRequestLog:  {body: {username: true, password: true}},
        sanitizeResponseLog: {body: {access_token: true, resource_owner: true}},
    }, null);

    if (response.status === 401) {
        throw new ZenMoney.Error("Райффайзенбанк: Неверный логин или пароль", true);
    }
    if (response.status === 267) {
        const confirmData = (await fetchJson("https://sso.raiffeisen.ru/oauth/entry/confirm/sms", {
            method: "POST"
        }, response => response.body.requestId && response.body.methods)).body;
        if (!confirmData.methods.some(method => method.method === "SMSOTP")) {
            throw new ZenMoney.Error("Райффайзенбанк: Неизвестный способ подтверждения входа");
        }
        const prompt = "Райффайзенбанк: Для подтверждения входа и импорта из банка введите код из СМС";
        const code = ZenMoney.retrieveCode(prompt, null, {
            inputType: "numberDecimal",
            time: confirmData["await"] || 120000,
        });
        response = await fetchJson(`https://sso.raiffeisen.ru/oauth/entry/confirm/${confirmData.requestId}/sms`, {
            method: "PUT",
            body: {
                code: code
            },
            sanitizeResponseLog: {body: {access_token: true, resource_owner: true}}
        }, null);
        if (response.status !== 200) {
            throw new ZenMoney.Error("Райффайзенбанк: Введён неверный код подтверждения. Запустите импорт ещё раз.", true);
        }
    }
    if (response.body &&
            response.body.error === "invalid_request" &&
            response.body.error_description === "Missing grant type") {
        throw new ZenMoney.Error("Райффайзенбанк: У вас старая версия приложения Дзен-мани. Для корректной работы плагина обновите приложение до последней версии", true);
    }

    validateResponse(response, response => response.body && !response.body.error && response.body.access_token);

    return {
        accessToken: response.body.access_token
    };
}

async function fetchAccounts(token) {
    const response = await fetchJson("https://sso.raiffeisen.ru/rest/account?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }, response => Array.isArray(response.body));
    return convertAccounts(response.body);
}

async function fetchCards(token, accounts) {
    const response = await fetchJson("https://sso.raiffeisen.ru/rest/card?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }, response => Array.isArray(response.body));
    return convertCards(response.body, accounts);
}

async function fetchDepositsWithTransactions(token, fromDate) {
    const response = await fetchJson("https://sso.raiffeisen.ru/rest/deposit?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }, response => Array.isArray(response.body));
    const fromDateStr = fromDate.getFullYear() + "-" +
        toAtLeastTwoDigitsString(fromDate.getMonth() + 1) + "-" +
        toAtLeastTwoDigitsString(fromDate.getDate());
    const result = convertDepositsWithTransactions(response.body);
    result.transactions = result.transactions.filter(transaction => transaction.date >= fromDateStr);
    return result;
}

async function fetchLoans(token) {
    const response = await fetchJson("https://sso.raiffeisen.ru/rest/loan?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }, response => Array.isArray(response.body));
    return convertLoans(response.body);
}

async function fetchTransactionsPaged(token, page, limit) {
    const response = await fetchJson(`https://sso.raiffeisen.ru/rest/transaction?detailRequired=1&order=asc&page=${page}&size=${limit}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }, response => response.body.list);
    return convertTransactions(response.body.list);
}

async function fetchTransactions(token, fromDate) {
    const fromDateStr = fromDate.getFullYear() + "-" +
        toAtLeastTwoDigitsString(fromDate.getMonth() + 1) + "-" +
        toAtLeastTwoDigitsString(fromDate.getDate());
    const limit = 25;
    let transactions = [];
    let page = 0;
    while (true) {
        const batch = await fetchTransactionsPaged(token, page++, limit);
        transactions = transactions.concat(batch.filter(transaction => transaction.date >= fromDateStr));
        if (batch.length <= 0 || batch[batch.length - 1].date < fromDateStr) {
            break;
        }
    }
    return transactions;
}

export function adjustTransactions(transactions, accounts) {
    return convertTransactionAccounts(transactions, accounts);
}

export function adjustAccounts(accounts) {
    return convertAccountSyncID(convertAccountMapToArray(accounts));
}

export async function scrape({fromDate, toDate}) {
    const preferences = ZenMoney.getPreferences();
    if (!preferences.login) {
        throw new ZenMoney.Error("Введите логин в интернет-банк!", null, true);
    }
    if (!preferences.password) {
        throw new ZenMoney.Error("Введите пароль в интернет-банк!", null, true);
    }
    let oldPluginLastSyncDate = ZenMoney.getData("last_sync", 0);
    if (oldPluginLastSyncDate && oldPluginLastSyncDate > 0) {
        oldPluginLastSyncDate = oldPluginLastSyncDate - 24 * 60 * 60 * 1000;
        fromDate = new Date(oldPluginLastSyncDate);
        ZenMoney.setData("last_sync", null);
    }
    const token = (await login(preferences.login, preferences.password)).accessToken;
    const accounts = await fetchAccounts(token);
    let {accounts: deposits, transactions} = await fetchDepositsWithTransactions(token, fromDate);
    Object.assign(accounts, deposits,
        await fetchCards(token, accounts),
        await fetchLoans(token)
    );
    transactions = transactions.concat(await fetchTransactions(token, fromDate));
    return {
        accounts:     adjustAccounts(accounts),
        transactions: adjustTransactions(transactions, accounts)
    };
}
