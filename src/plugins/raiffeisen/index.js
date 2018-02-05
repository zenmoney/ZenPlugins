import * as network from "../../common/network";
import * as retry   from "../../common/retry";

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
            maxAttempts: 3
        }))[1];
    } catch (e) {
        if (e instanceof retry.RetryError) {
            e = e.failedResults.some(([error, response]) => error !== null) || new ZenMoney.Error("[NER]", true);
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
            throw new ZenMoney.Error("Райффайзенбанк: Неверный код подтверждения.", true);
        }
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
    const accounts = {};
    for (const json of response.body) {
        const account = parseAccount(json);
        if (account) {
            Object.assign(accounts, account);
        }
    }
    return accounts;
}

export function parseAccount(json) {
    if (!json.account || !json.account.id) {
        return null;
    }
    const account = {
        id: "ACCOUNT_" + json.account.id,
        instrument: json.account.currency.shortName,
        syncID: [json.account.cba.substring(json.account.cba.length - 4)],
        balance: json.balance,
        type: "checking"
    };
    const accounts = {};
    accounts[account.id] = account;
    if (json.cards && json.cards.length > 0) {
        for (const card of json.cards) {
            accounts["CARD_" + card.id] = account;
            account.syncID.push(card.pan.substring(card.pan.length - 4));
            if (json.cards.length === 1) {
                account.type = "ccard";
                account.title = (card.product ? card.product + " " : "") + "*" + account.syncID[account.syncID.length - 1];
            }
        }
    }
    if (!account.title) {
        account.title = "" + account.syncID[0];
    }
    return accounts;
}

async function fetchDeposits(token) {
    await fetchJson("https://sso.raiffeisen.ru/rest/deposit?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    //TODO process deposits
    return {};
}

async function fetchLoans(token) {
    const response = await fetchJson("https://sso.raiffeisen.ru/rest/loan?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }, response => Array.isArray(response.body));
    const loans = {};
    for (const json of response.body) {
        const loan = parseLoan(json);
        if (loan) {
            Object.assign(loans, loan);
        }
    }
    return loans;
}

export function parseLoan(json) {
    if (!json.docNumber) {
        return null;
    }
    const startDate = new Date(json.open.substr(0, 10)).getTime() / 1000;
    const endDate = new Date(json.close.substr(0, 10)).getTime() / 1000;
    const dateOffset = Math.round((endDate - startDate) / (30 * 24 * 60 * 60));
    const loan = {
        id: "LOAN_" + json.docNumber,
        instrument: json.currency.shortName,
        syncID: [json.docNumber],
        balance: -json.leftDebt,
        type: "loan",
        percent: json.rate,
        startDate: startDate,
        endDateOffset: dateOffset,
        endDateOffsetInterval: 'month',
        capitalization: true,
        payoffStep: 1,
        payoffInterval: 'month'
    };
    const loans = {};
    loans[loan.id] = loan;
    loan.title = "" + loan.syncID[0];
    return loans;
}

export function parseLoanPayment(json) {
    return {
        date: json.date.substring(0, 10),
        hold: false,
        comment: json.relatedDescription.name,
        income:         json.amount > 0 ? json.amount : 0,
        incomeAccount:  json.relation + "_" + json.relatedName.name,
        outcome:        json.amount < 0 ? -json.amount : 0,
        outcomeAccount: json.relation + "_" + json.relatedName.name
    };
}

async function fetchTransactionsPaged(token, page, limit) {
    const response = await fetchJson(`https://sso.raiffeisen.ru/rest/transaction?detailRequired=1&order=asc&page=${page}&size=${limit}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }, response => response.body.list);
    const transactions = [];
    for (const json of response.body.list) {
        const transaction = parseTransaction(json);
        if (transaction) {
            transactions.push(transaction);
        }
    }
    return transactions;
}

export function parseTransaction(json) {
    if (json.relation === "LOAN") {
        return parseLoanPayment(json);
    }
    
    const transaction = {
        date: json.date.substring(0, 10),
        hold: json.type !== "TRANSACTION",
        income:         json.billAmount > 0 ? json.billAmount : 0,
        incomeAccount:  json.relation + "_" + json.relatedId,
        outcome:        json.billAmount < 0 ? -json.billAmount : 0,
        outcomeAccount: json.relation + "_" + json.relatedId
    };
    if (json.currencyId !== json.billCurrencyId) {
        if (json.amount > 0) {
            transaction.opIncome = json.amount;
            transaction.opIncomeInstrument = json.currency.shortName;
        } else if (json.amount < 0) {
            transaction.opOutcome = -json.amount;
            transaction.opOutcomeInstrument = json.currency.shortName;
        }
    }
    const payee = json.merchant ? json.merchant.trim() : null;
    if (payee) {
        transaction.payee = payee;
    }
    if (json.note && (!transaction.payee || json.note.indexOf(transaction.payee) < 0)) {
        transaction.comment = json.note;
    }
    if (json.parentCategoryId === 13) {
        transaction.payee = null;
        if (transaction.outcome > 0) {
            transaction.incomeAccount = "cash#" + json.currency.shortName;
            transaction.income = -json.amount;
        } else {
            transaction.outcomeAccount = "cash#" + json.currency.shortName;
            transaction.outcome = json.amount;
        }
    }
    return transaction;
}

async function fetchTransactions(token, fromDate) {
    const fromDateStr = fromDate.getFullYear() + "-" + n2(fromDate.getMonth() + 1) + "-" + n2(fromDate.getDate());
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
    for (const transaction of transactions) {
        const incomeAccount  = accounts[transaction.incomeAccount];
        const outcomeAccount = accounts[transaction.outcomeAccount];
        if (incomeAccount) {
            transaction.incomeAccount = incomeAccount.id;
        }
        if (outcomeAccount) {
            transaction.outcomeAccount = outcomeAccount.id;
        }
    }
    return transactions;
}

export function adjustAccounts(accounts) {
    const filtered = [];
    for (const id in accounts) {
        const account = accounts[id];
        if (account.id === id) {
            filtered.push(account);
        }
    }
    return filtered;
}

function n2(n) {
    return n < 10 ? "0" + n : "" + n;
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
    const accounts = Object.assign(
        await fetchAccounts(token),
        await fetchDeposits(token),
        await fetchLoans(token)
    );
    const transactions = await fetchTransactions(token, fromDate);
    return {
        accounts:     adjustAccounts(accounts),
        transactions: adjustTransactions(transactions, accounts)
    };
}
