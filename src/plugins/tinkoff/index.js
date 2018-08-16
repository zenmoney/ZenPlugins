import * as Tinkoff from "./tinkoff";
import {convertAccount} from "./converters";
import _ from "lodash";

export async function scrape({preferences, fromDate, toDate, isInBackground}) {

    const pinHash = ZenMoney.getData("pinHash", null);
    const auth = await Tinkoff.login(preferences, isInBackground, {pinHash: pinHash});

    const fetchedAccounts = await Tinkoff.fetchAccounts(auth);

    const accounts = [];
    const initialized = ZenMoney.getData("initialized", false); // флаг первичной инициализации счетов, когда необходимо передать остатки всех счетов
    await Promise.all(fetchedAccounts.map(async account => {
        const converted = convertAccount(account, initialized);
        if (!converted || ZenMoney.isAccountSkipped(converted.id)) return;
        if (_.isArray(converted))
            converted.forEach(function(item){
                if (!item) return;
                accounts.push(item);
            });
        else
            accounts.push(converted);
    }));
    if (!initialized) {
        ZenMoney.setData("initialized", true);
        ZenMoney.saveData();
    }

    return {
        accounts: accounts,
        transactions: [],
    };
}
