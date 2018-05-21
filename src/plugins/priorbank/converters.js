import _ from "lodash";
import {asCashTransfer, formatComment} from "../../common/converters";

const calculateAccountId = (card) => String(card.clientObject.id);

export function toZenmoneyAccount(card) {
    // card.clientObject.type === 5 for credit card (limits source unknown, thus non-specified)
    // card.clientObject.type === 6 for debit card
    return {
        id: calculateAccountId(card),
        title: card.clientObject.customSynonym || card.clientObject.defaultSynonym,
        type: "ccard",
        syncID: [card.clientObject.cardMaskedNumber.slice(-4)],
        instrument: card.clientObject.currIso,
        balance: card.balance.available,
    };
}

const knownTransactionTypes = ["Retail", "ATM", "CH Debit", "Cash"];

const normalizeSpaces = (text) => _.compact(text.split(" ")).join(" ");

function parseTransDetails(transDetails) {
    const type = knownTransactionTypes.find((type) => transDetails.startsWith(type + " "));
    if (type) {
        return {type, payee: normalizeSpaces(transDetails.slice(type.length)), comment: null};
    } else {
        return {type: null, payee: null, comment: normalizeSpaces(transDetails)};
    }
}

const extractRegularTransactionAmount = ({accountCurrency, regularTransaction}) => {
    if (accountCurrency === regularTransaction.transCurrIso) {
        return regularTransaction.accountAmount;
    }
    if (regularTransaction.amount === 0) {
        if (regularTransaction.feeAmount !== 0) {
            return regularTransaction.feeAmount;
        }
        console.error({accountCurrency, regularTransaction});
        throw new Error("Cannot handle corrupted transaction amounts");
    }
    return Math.sign(regularTransaction.accountAmount) * Math.abs(regularTransaction.amount);
};

const convertApiCardToReadableTransactions = (cardDetails, accountCurrency) => {
    const abortedTransactions = _.flatMap(cardDetails.contract.abortedContractList, (x) => x.abortedTransactionList.reverse())
        .map((abortedTransaction) => {
            const details = parseTransDetails(abortedTransaction.transDetails);
            const posted = {amount: -abortedTransaction.amount, instrument: accountCurrency};
            const origin = abortedTransaction.transCurrIso === accountCurrency
                ? null
                : {
                    amount: -abortedTransaction.transAmount,
                    instrument: abortedTransaction.transCurrIso,
                };
            const readableTransaction = {
                type: "transaction",
                id: null,
                account: {id: String(cardDetails.id)},
                date: new Date(abortedTransaction.transDate),
                hold: true,
                posted,
                origin,
                payee: details.payee,
                mcc: null,
                location: null,
                comment: _.compact([details.comment, formatComment({posted, origin})]).join("\n") || null,
            };
            return {readableTransaction, details, item: abortedTransaction};
        });
    const regularTransactions = _.flatMap(cardDetails.contract.account.transCardList, (x) => x.transactionList.reverse())
        .map((regularTransaction) => {
            const details = parseTransDetails(regularTransaction.transDetails);
            const amount = regularTransaction.accountAmount;
            const posted = {amount, instrument: accountCurrency};
            const origin = regularTransaction.transCurrIso === accountCurrency
                ? null
                : {
                    amount: extractRegularTransactionAmount({accountCurrency, regularTransaction}),
                    instrument: regularTransaction.transCurrIso,
                };
            const readableTransaction = {
                type: "transaction",
                id: null,
                account: {id: String(cardDetails.id)},
                date: new Date(regularTransaction.transDate),
                hold: false,
                posted,
                origin,
                payee: details.payee,
                mcc: null,
                location: null,
                comment: _.compact([details.comment, formatComment({posted, origin})]).join("\n") || null,
            };
            return {readableTransaction, details, item: regularTransaction};
        });
    const readableTransactions = abortedTransactions.concat(regularTransactions)
        .map(({readableTransaction, details}) => {
            if (details.type === "ATM" || details.type === "Cash") {
                return asCashTransfer(readableTransaction);
            }
            return readableTransaction;
        });
    return _.sortBy(readableTransactions, x => x.date);
};

export function convertApiCardsToReadableTransactions({cardsBodyResult, cardDescBodyResult}) {
    return _.flatMap(cardsBodyResult, (card) => convertApiCardToReadableTransactions(
        cardDescBodyResult.find((x) => x.id === card.clientObject.id),
        card.clientObject.currIso,
    ));
}
