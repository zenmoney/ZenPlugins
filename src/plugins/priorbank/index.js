import {convertToZenMoneyTransaction} from "./mappingUtils";
import * as prior from "./prior";
const calculateAccountId = (card) => String(card.clientObject.id);

function convertToZenMoneyData(card) {
    const accountId = calculateAccountId(card);
    return {
        account: {
            id: accountId,
            title: card.clientObject.customSynonym || card.clientObject.defaultSynonym,
            type: prior.getAccountType(card),
            syncID: [card.clientObject.cardMaskedNumber.slice(-4)],
            instrument: card.clientObject.currIso,
            balance: card.balance.available,
        },
        transactions: card.transactions.map((transaction) => convertToZenMoneyTransaction(accountId, transaction)),
    };
}

export async function scrape({fromDate, toDate}) {
    const {login, password} = ZenMoney.getPreferences();
    const preAuthHeaders = await prior.fetchPreAuthHeaders();
    const loginSalt = await prior.fetchLoginSalt({preAuthHeaders, login});
    const {accessToken, userSession} = await prior.login({preAuthHeaders, loginSalt, login, password});
    const postAuthHeaders = prior.calculatePostAuthHeaders({preAuthHeaders, accessToken});

    const [cardItems, cardDetailItems] = await Promise.all([
        prior.fetchCards({postAuthHeaders, userSession}),
        prior.fetchCardDetails({postAuthHeaders, userSession, fromDate, toDate}),
    ]);
    const cards = prior.joinTransactions({cardItems, cardDetailItems});
    return cards
        .filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card)))
        .map(convertToZenMoneyData);
}
