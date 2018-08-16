import * as Tinkoff from "./tinkoff";
import {convertAccount, convertTransaction} from "./converters";
import _ from "lodash";

export async function scrape({preferences, fromDate, toDate, isInBackground}) {

    const pinHash = ZenMoney.getData("pinHash", null);
    const auth = await Tinkoff.login(preferences, isInBackground, {pinHash: pinHash});
    const fetchedData = await Tinkoff.fetchAccountsAndTransactions(auth, fromDate, toDate);

    const accounts = [];
    const initialized = ZenMoney.getData("initialized", false); // флаг первичной инициализации счетов, когда необходимо передать остатки всех счетов
    await Promise.all(fetchedData.accounts.map(async account => {
        const acc = convertAccount(account, initialized);
        if (!acc || ZenMoney.isAccountSkipped(acc.id)) return;
        if (_.isArray(acc))
            acc.forEach(function(item){
                if (!item) return;
                accounts.push(item);
            });
        else
            accounts.push(acc);
    }));
    if (!initialized) {
        ZenMoney.setData("initialized", true);
        ZenMoney.saveData();
    }

    const transactions = [];
    await Promise.all(fetchedData.transactions.map(async t => {
        // работаем только по активным счетам
        let tAccount = t.account;
        if (!in_accounts(tAccount, accounts)) {
            tAccount = t.account + "_" + t.amount.currency.name;
            if (!in_accounts(tAccount, accounts)) return;
        }

        // учитываем только успешные операции
        if ((t.status && t.status === "FAILED")
            || t.accountAmount.value == 0)
            return;

        const tran = convertTransaction(t, tAccount);
        transactions.push(tran);

    }));

    return {
        accounts: accounts,
        transactions: transactions,
    };
}

function in_accounts(id, accounts) {
    const length = accounts.length;
    for(var i = 0; i < length; i++)
        if(accounts[i].id == id) return true;
    return false;
}
