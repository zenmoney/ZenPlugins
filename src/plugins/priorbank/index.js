import _ from "lodash";
import {convertToZenMoneyTransaction} from "./mappingUtils";
import * as prior from "./prior";

const calculateAccountId = (card) => String(card.clientObject.id);

function convertToZenMoneyAccount(card) {
    return {
        id: calculateAccountId(card),
        title: card.clientObject.customSynonym || card.clientObject.defaultSynonym,
        type: prior.getAccountType(card),
        syncID: [card.clientObject.cardMaskedNumber.slice(-4)],
        instrument: card.clientObject.currIso,
        balance: card.balance.available,
    };
}

const convertToZenMoneyTransactions = (accountId, transactions) => transactions.map((transaction) => convertToZenMoneyTransaction(accountId, transaction));

export async function scrape({fromDate, toDate}) {
    const {login: rawLogin, password} = ZenMoney.getPreferences();
    const login = rawLogin.trim();
    const preAuthHeaders = await prior.fetchPreAuthHeaders();
    const loginSalt = await prior.fetchLoginSalt({preAuthHeaders, login});
    const {accessToken, userSession} = await prior.login({preAuthHeaders, loginSalt, login, password});
    const postAuthHeaders = prior.calculatePostAuthHeaders({preAuthHeaders, accessToken});

    const [cardItems, cardDetailItems] = await Promise.all([
        prior.fetchCards({postAuthHeaders, userSession}),
        prior.fetchCardDetails({postAuthHeaders, userSession, fromDate, toDate}),
    ]);
    const cards = prior.joinTransactions({cardItems, cardDetailItems});
    return {
        accounts: cards.map((card) => convertToZenMoneyAccount(card)),
        transactions: _.flatMap(
            cards.filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card))),
            (card) => convertToZenMoneyTransactions(calculateAccountId(card), card.transactions),
        ),
    };
}
