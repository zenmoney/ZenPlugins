import * as Tinkoff from "./tinkoff";

export async function scrape({isInBackground, preferences, fromDate, toDate}) {
    await Tinkoff.login(preferences);

    return {
        accounts: [],
        transactions: [],
    };
}
