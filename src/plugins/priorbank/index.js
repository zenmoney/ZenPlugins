import {toZenmoneyTransaction} from "../../common/converters";
import {chooseDistinctCards, convertApiCardsToReadableTransactions, toZenmoneyAccount} from "./converters";
import {normalizePreferences} from "./preferences";
import {assertResponseSuccess, authLogin, getCardDesc, getCards, getMobileToken, getSalt} from "./prior";

async function refreshAuth({preferences: {login, password}}) {
    const {authAccessToken, clientSecret} = await getMobileToken();
    const loginSalt = await getSalt({authAccessToken, clientSecret, login});
    const {accessToken, userSession} = await authLogin({authAccessToken, clientSecret, loginSalt, login, password});
    return {
        registered: true,
        accessToken,
        clientSecret,
        userSession,
    };
}

async function refreshAndPersistAuth({preferences}) {
    const pluginData = await refreshAuth({preferences: normalizePreferences(preferences)});
    Object.keys(pluginData).forEach((key) => ZenMoney.setData(key, pluginData[key]));
    ZenMoney.saveData();
    return pluginData;
}

export async function scrape({preferences, fromDate, toDate}) {
    let pluginData = {
        registered: ZenMoney.getData("registered", false),
        accessToken: ZenMoney.getData("accessToken", null),
        clientSecret: ZenMoney.getData("clientSecret", null),
        userSession: ZenMoney.getData("userSession", null),
    };
    if (!pluginData.registered) {
        pluginData = await refreshAndPersistAuth({preferences: normalizePreferences(preferences)});
    }
    let responses = await Promise.all([
        getCards({accessToken: pluginData.accessToken, clientSecret: pluginData.clientSecret, userSession: pluginData.userSession}),
        getCardDesc({accessToken: pluginData.accessToken, clientSecret: pluginData.clientSecret, userSession: pluginData.userSession, fromDate, toDate}),
    ]);
    if (responses.some((response) => response.status === 401)) {
        pluginData = await refreshAndPersistAuth({preferences: normalizePreferences(preferences)});
        responses = await Promise.all([
            getCards({accessToken: pluginData.accessToken, clientSecret: pluginData.clientSecret, userSession: pluginData.userSession}),
            getCardDesc({accessToken: pluginData.accessToken, clientSecret: pluginData.clientSecret, userSession: pluginData.userSession, fromDate, toDate}),
        ]);
    }
    responses.forEach((response) => assertResponseSuccess(response));
    const [cardsBodyResult, cardDescBodyResult] = responses.map((x) => x.body.result);

    const cardsBodyResultWithoutDuplicates = chooseDistinctCards(cardsBodyResult);
    const readableTransactions = convertApiCardsToReadableTransactions({cardsBodyResultWithoutDuplicates, cardDescBodyResult});
    console.debug({readableTransactions});

    return {
        accounts: cardsBodyResultWithoutDuplicates.map(toZenmoneyAccount),
        transactions: readableTransactions.map(toZenmoneyTransaction),
    };
}
