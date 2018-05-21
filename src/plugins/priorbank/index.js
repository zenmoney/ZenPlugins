import {toZenmoneyTransaction} from "../../common/converters";
import {convertApiCardsToReadableTransactions, toZenmoneyAccount} from "./converters";
import {calculatePostAuthHeaders, fetchCardDesc, fetchCards, fetchLoginSalt, fetchPreAuthHeaders, login} from "./prior";

export async function scrape({preferences, fromDate, toDate}) {
    const preAuthHeaders = await fetchPreAuthHeaders();
    const loginSalt = await fetchLoginSalt({
        preAuthHeaders,
        login: preferences.login.trim(),
    });
    const {accessToken, userSession} = await login({
        preAuthHeaders,
        loginSalt,
        login: preferences.login.trim(),
        password: preferences.password,
    });
    const postAuthHeaders = calculatePostAuthHeaders({preAuthHeaders, accessToken});
    const [cardsBodyResult, cardDescBodyResult] = await Promise.all([
        fetchCards({postAuthHeaders, userSession}),
        fetchCardDesc({postAuthHeaders, userSession, fromDate, toDate}),
    ]);

    const readableTransactions = convertApiCardsToReadableTransactions({cardsBodyResult, cardDescBodyResult});
    console.debug({readableTransactions});

    return {
        accounts: cardsBodyResult.map(toZenmoneyAccount),
        transactions: readableTransactions.map(toZenmoneyTransaction),
    };
}
