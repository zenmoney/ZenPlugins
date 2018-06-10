import * as HomeCredit from "./homecredit";
import {convertAccounts} from "./converters";
import _ from "lodash";

export async function scrape({preferences, fromDate, toDate}) {
    if (!preferences.birth) throw new ZenMoney.Error("Укажите дату рождения в параметрах подключения", null, true);
    if (!preferences.phone) throw new ZenMoney.Error("Укажите номер телефона в параметрах подключения", null, true);
    if (!preferences.pin) throw new ZenMoney.Error("Укажите пин-код от приложения банка 'Мой кредит' в параметрах подключения", null, true);

    await HomeCredit.login(preferences);
    const fetchedAccounts = await HomeCredit.fetchAccounts();
    const accounts = _.flattenDeep(await Promise.all(Object.keys(fetchedAccounts).map(type => {
        return Promise.all(fetchedAccounts[type].map(async account => convertAccounts(await HomeCredit.fetchDetails(account, type), type)));
    })));

    return {
        accounts: accounts,
        transactions: [],
    };

}
