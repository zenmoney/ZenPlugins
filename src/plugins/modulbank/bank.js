import * as network from "../../common/network";

const qs = require("querystring");
const baseURL = "https://api.modulbank.ru/v1/";

const CLIENT_ID = "";
const CLIENT_SECRET = "";
const REDIRECT_URI = "";

export async function login() {
    if (!ZenMoney.openWebView) {
        throw new TemporaryError("У вас старая версия приложения Дзен-мани. Для корректной работы плагина обновите приложение до последней версии.");
    }
    const {error, code} = await new Promise((resolve) => {
        const redirectUriWithoutProtocol = REDIRECT_URI.replace(/^https?:\/\//i, "");
        const url = `https://oauth.modulbank.ru/?${qs.stringify({
            "clientId": CLIENT_ID,
            "redirectUri": REDIRECT_URI,
            "scope": "account-info operation-history",
        })}`;
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
        throw new TemporaryError("Не удалось пройти авторизацию в Тинькофф Бизнес. Попробуйте еще раз");
    }
    console.assert(code && !error, "non-successfull authorization", error);
    const response = await network.fetchJson("https://api.modulbank.ru/v1/oauth/token", {
        headers: {
            "Host": "api.modulbank.ru",
        },
        body: {
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            redirectUri: REDIRECT_URI,
            code,
        },
        sanitizeRequestLog: {body: true},
        sanitizeResponseLog: {body: {accessToken: true, access_token: true}},
    });
    const accessToken = response.body
        ? response.body.accessToken || response.body.access_token
        : null;
    console.assert(accessToken, "non-successfull authorization");
    return accessToken;
}

export async function fetchAccounts(token) {
    console.log("Запрашиваем данные по счетам...");
    const response = await fetchJson("account-info", {}, token);
    if (response.status === 401) {
        // Not Authorized
        throw new InvalidPreferencesError("Неверный токен авторизации");
    }
    const companies = response.body;
    const accounts = [];
    companies.forEach(company => {
        Array.prototype.push.apply(accounts, company.bankAccounts)
    });
    console.log(`Получено счетов: ${accounts.length}`);
    return accounts;
}

export async function fetchTransactions(token, accounts, fromDate) {
    console.log(`Запрашиваем операции с ${fromDate.toLocaleString()}`);
    const allTransactions = [];
    for (let account of accounts) {
        let skip = 0;
        let transactions;
        do {
            let response = await fetchJson(
                `operation-history/${account.id}`,
                { from: fromDate.toISOString().slice(0, 10), skip },
                token);
            if (response.status === 401) {
                // Not Authorized
                throw new InvalidPreferencesError("Неверный токен авторизации");
            }
            transactions = response.body;
            Array.prototype.push.apply(allTransactions, transactions);
            skip += transactions.length
        } while (transactions.length)
    }
    console.log(`Получено операций: ${allTransactions.length}`);
    return allTransactions;
}

async function fetchJson(path, body, token) {
    const options = {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body,
        sanitizeResponseLog: {headers: {Authorization: true}},
    };
    return network.fetchJson(baseURL + path, options);
}
