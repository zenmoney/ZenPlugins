import {fetchJson as rawFetchJson} from "../../common/network";

async function fetchJson(url, options = {}, condition = null, retryCount = 3) {
    options = Object.assign({
        method: "GET",
        log: true,
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
    let error;
    try {
        response = await rawFetchJson(url, options);
        error = null;
    } catch (e) {
        response = null;
        error = e;
    }
    if ((response === null || response.status === 502) && retryCount > 1) {
        return fetchJson(url, options, condition, retryCount - 1);
    }
    if (response === null) {
        throw error;
    }
    if (condition !== false) {
        validateResponse(response, condition);
    }
    return response;
}

function validateResponse(response, condition) {
    console.assert(
        response.status === 200 && response.body && !response.body.error && (!condition || condition(response)),
        "non-successful response",
        response
    );
}

async function login(login, password) {
    const response = await fetchJson("https://sso.raiffeisen.ru/oauth/token", {
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
    }, false);
    if (response.status === 401) {
        throw new ZenMoney.Error("Райффайзенбанк: Неверный логин или пароль", true);
    }
    validateResponse(response, response => response.body.access_token);
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
    await fetchJson("https://sso.raiffeisen.ru/rest/loan?alien=false", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    //TODO process loans
    return {};
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
