import * as prior from "./prior";
import adaptScrape from "./adaptScrape";

const calculateAccountId = (card) => String(card.clientObject.id);

const convertToZenMoneyTransaction = (accountId, {
    transactionCurrency,
    transactionAmount,
    accountAmount,
    transactionDate,
    details,
    isCurrencyConversion,
}) => {
    const zenMoneyTransaction = {date: transactionDate, payee: details.payee};

    const commentLines = [];
    if (isCurrencyConversion) {
        commentLines.push(`${Math.abs(transactionAmount).toFixed(2)} ${transactionCurrency}`);
        commentLines.push(`(rate=${(transactionAmount / accountAmount).toFixed(4)})`);
    }
    if (details.comment) {
        commentLines.push(details.comment);
    }

    if (transactionAmount >= 0) {
        zenMoneyTransaction.income = Math.abs(accountAmount);
        zenMoneyTransaction.incomeAccount = accountId;
        if (details.type === "ATM") {
            zenMoneyTransaction.outcome = Math.abs(transactionAmount);
            zenMoneyTransaction.outcomeAccount = `cash#${transactionCurrency}`;
        } else {
            zenMoneyTransaction.outcome = 0;
            zenMoneyTransaction.outcomeAccount = accountId;
        }
    } else {
        zenMoneyTransaction.outcome = Math.abs(accountAmount);
        zenMoneyTransaction.outcomeAccount = accountId;
        if (details.type === "ATM") {
            zenMoneyTransaction.income = Math.abs(transactionAmount);
            zenMoneyTransaction.incomeAccount = `cash#${transactionCurrency}`;
        } else {
            zenMoneyTransaction.income = 0;
            zenMoneyTransaction.incomeAccount = accountId;
        }
    }

    if (isCurrencyConversion) {
        if (transactionAmount >= 0) {
            zenMoneyTransaction.opIncome = Math.abs(transactionAmount);
            zenMoneyTransaction.opIncomeInstrument = transactionCurrency;
        } else {
            zenMoneyTransaction.opOutcome = Math.abs(transactionAmount);
            zenMoneyTransaction.opOutcomeInstrument = transactionCurrency;
        }
    }

    if (commentLines.length > 0) {
        zenMoneyTransaction.comment = commentLines.join("\n");
    }

    return zenMoneyTransaction;
};

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
    }
}

export async function scrape({from, to}) {
    const {login, password} = ZenMoney.getPreferences();
    if (!login || !password) {
        throw new Error("login and password should be provided");
    }

    const preAuthHeaders = await prior.fetchPreAuthHeaders();
    const loginSalt = await prior.fetchLoginSalt({preAuthHeaders, login});
    const {accessToken, userSession} = await prior.login({preAuthHeaders, loginSalt, login, password});
    const postAuthHeaders = prior.calculatePostAuthHeaders({preAuthHeaders, accessToken});

    const [cardItems, cardDetailItems] = await Promise.all([
        prior.fetchCards({postAuthHeaders, userSession}),
        prior.fetchCardDetails({postAuthHeaders, userSession, from, to}),
    ]);
    const cards = prior.joinTransactions({cardItems, cardDetailItems});
    return cards
        .filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card)))
        .map(convertToZenMoneyData);
}

export const main = adaptScrape(scrape);
