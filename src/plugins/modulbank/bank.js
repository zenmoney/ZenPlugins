import * as network from "../../common/network";

const baseURL = "https://api.modulbank.ru/v1/";

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
