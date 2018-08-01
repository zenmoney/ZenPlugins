import * as HomeCredit from "./homecredit";
import {convertAccount, convertTransactions} from "./converters";
import _ from "lodash";

export async function scrape({preferences, fromDate, toDate}) {
    const auth = await HomeCredit.login(preferences);
    const fetchedAccounts = await HomeCredit.fetchAccounts(auth);
    console.log(">>> Полученные счета", fetchedAccounts);

    // счета
    let accountsData = _.flattenDeep(await Promise.all(Object.keys(fetchedAccounts).map(type => {
        return Promise.all(fetchedAccounts[type].map(async account => convertAccount(await HomeCredit.fetchDetails(auth, account, type), type)));
    })));

    // операции
    const transactions = _.flattenDeep(await Promise.all(accountsData.map(async account => convertTransactions(account, await HomeCredit.fetchTransactions(auth, account, fromDate, toDate)))));

    const accounts = accountsData.map(account => account.account);
    return {
        accounts: accounts ? accounts : [],
        transactions: transactions,
    };
}
