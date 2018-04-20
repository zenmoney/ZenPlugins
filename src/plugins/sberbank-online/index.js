import {login} from "./sberbank";

export async function scrape({preferences, fromDate, toDate}) {
    if (!preferences.login) {
        throw new ZenMoney.Error("Введите логин!", null, true);
    }
    if (!preferences.password) {
        throw new ZenMoney.Error("Введите пароль!", null, true);
    }
    await login(preferences.login, preferences.pin);
    //TODO get accounts and transactions
    return {
        accounts: [],
        transactions: []
    };
}
