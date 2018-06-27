import _ from "lodash";
import {asCashTransfer, formatComment} from "../../common/converters";
import {mergeTransfers as commonMergeTransfers} from "../../common/mergeTransfers";

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

const knownTransactionTypes = ["Retail", "ATM", "CH Debit", "CH Payment", "Cash"];

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

export function chooseDistinctCards(cardsBodyResult) {
    const cardsToEvict = _.flatMap(
        _.toPairs(_.groupBy(cardsBodyResult, (x) => x.clientObject.cardContractNumber)),
        ([cardContractNumber, cards]) => _.sortBy(cards, [
            (x) => x.clientObject.cardStatus === 1 ? 0 : 1,
            (x) => x.clientObject.defaultSynonym,
        ]).slice(1),
    );
    return cardsBodyResult.filter((card) => !cardsToEvict.includes(card));
}

export const convertApiAbortedTransactionToReadableTransaction = ({accountId, accountCurrency, abortedTransaction}) => {
    const details = parseTransDetails(abortedTransaction.transDetails);
    const sign = abortedTransaction.transDetails === "CH Debit BLR MINSK P2P SDBO NO FEE"
        ? Math.sign(abortedTransaction.amount)
        : Math.sign(-abortedTransaction.transAmount);
    const posted = {amount: sign * Math.abs(abortedTransaction.amount), instrument: accountCurrency};
    const origin = abortedTransaction.transCurrIso === accountCurrency
        ? null
        : {amount: sign * Math.abs(abortedTransaction.transAmount), instrument: abortedTransaction.transCurrIso};
    return {
        type: "transaction",
        id: null,
        account: {id: accountId},
        date: new Date(abortedTransaction.transDate),
        hold: true,
        posted,
        origin,
        payee: details.payee,
        mcc: null,
        location: null,
        comment: _.compact([details.comment, formatComment({posted, origin})]).join("\n") || null,
    };
};

const convertApiTransactionToReadableTransaction = (apiTransaction) => {
    const accountCurrency = apiTransaction.card.clientObject.currIso;
    const accountId = calculateAccountId(apiTransaction.card);
    if (apiTransaction.type === "abortedTransaction") {
        return convertApiAbortedTransactionToReadableTransaction({accountId, accountCurrency, abortedTransaction: apiTransaction.payload});
    }
    if (apiTransaction.type === "regularTransaction") {
        const regularTransaction = apiTransaction.payload;
        const details = parseTransDetails(regularTransaction.transDetails);
        const amount = regularTransaction.accountAmount;
        const posted = {amount, instrument: accountCurrency};
        const origin = regularTransaction.transCurrIso === accountCurrency
            ? null
            : {
                amount: extractRegularTransactionAmount({accountCurrency, regularTransaction}),
                instrument: regularTransaction.transCurrIso,
            };
        return {
            type: "transaction",
            id: null,
            account: {id: calculateAccountId(apiTransaction.card)},
            date: new Date(regularTransaction.transDate),
            hold: false,
            posted,
            origin,
            payee: details.payee,
            mcc: null,
            location: null,
            comment: _.compact([details.comment, formatComment({posted, origin})]).join("\n") || null,
        };
    }
    throw new Error(`apiTransaction.type "${apiTransaction.type}" not implemented`);
};

export function mergeTransfers({items}) {
    return commonMergeTransfers({
        items,
        selectReadableTransaction: (item) => item.readableTransaction,
        isTransferItem: (item) =>
            item.apiTransaction.payload.transDetails.includes("P2P SDBO") ||
            item.apiTransaction.payload.transDetails.includes("P2P_SDBO"),
        makeGroupKey: (item) => {
            const {amount, instrument} = item.readableTransaction.origin || item.readableTransaction.posted;
            return `${Math.abs(amount)} ${instrument} @ ${item.readableTransaction.date} ${item.apiTransaction.payload.transTime}`;
        },
        selectTransactionId: (item) => {
            if (item.readableTransaction.type === "transfer") { // e.g. Cash, ATM
                return null;
            }
            const {amount, instrument} = item.readableTransaction.posted;
            const sign = amount >= 0 ? "+" : "-";
            return `${Math.abs(amount)} ${instrument} @ ${item.readableTransaction.date} ${item.apiTransaction.payload.transTime} ${sign}`;
        },
    });
}

export function convertApiCardsToReadableTransactions({cardsBodyResultWithoutDuplicates, cardDescBodyResult}) {
    const items = _.sortBy(_.flatMap(cardsBodyResultWithoutDuplicates, (card) => {
        const cardDesc = cardDescBodyResult.find((x) => x.id === card.clientObject.id);
        const abortedTransactions = _.flatMap(cardDesc.contract.abortedContractList, (x) => x.abortedTransactionList.reverse())
            .map((abortedTransaction) => ({type: "abortedTransaction", payload: abortedTransaction, card}));
        const regularTransactions = _.flatMap(cardDesc.contract.account.transCardList, (x) => x.transactionList.reverse())
            .map((regularTransaction) => ({type: "regularTransaction", payload: regularTransaction, card}));
        return abortedTransactions.concat(regularTransactions)
            .map((apiTransaction) => {
                const readableTransaction = convertApiTransactionToReadableTransaction(apiTransaction);
                if (["ATM", "Cash"].includes(parseTransDetails(apiTransaction.payload.transDetails).type)) {
                    return {apiTransaction, readableTransaction: asCashTransfer(readableTransaction)};
                }
                return {apiTransaction, readableTransaction};
            });
    }), x => x.readableTransaction.date);
    return mergeTransfers({items});
}
