import _ from "lodash";
import {asCashTransfer, convertReadableTransactionToReadableTransferSide, formatComment} from "../../common/converters";

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

const convertApiTransactionToReadableTransaction = (apiTransaction, accountCurrency, accountId) => {
    if (apiTransaction.type === "abortedTransaction") {
        const abortedTransaction = apiTransaction.payload;
        const details = parseTransDetails(abortedTransaction.transDetails);
        const posted = {amount: -abortedTransaction.amount, instrument: accountCurrency};
        const origin = abortedTransaction.transCurrIso === accountCurrency
            ? null
            : {
                amount: -abortedTransaction.transAmount,
                instrument: abortedTransaction.transCurrIso,
            };
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
            account: {id: accountId},
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

function defaultIsTransferTuple({apiTransaction}) {
    return apiTransaction.payload.transDetails.includes("P2P SDBO") || apiTransaction.payload.transDetails.includes("P2P_SDBO   ");
}

const defaultMakeTransferId = ({apiTransaction, readableTransaction}) => {
    const {amount, instrument} = readableTransaction.origin || readableTransaction.posted;
    return `${Math.abs(amount)} ${instrument} @ ${readableTransaction.date} ${apiTransaction.payload.transTime}`;
};

const defaultMakeTransactionId = (x) => {
    if (x.readableTransaction.type === "transfer") { // e.g. Cash, ATM
        return "transfer";
    }
    return `${defaultMakeTransferId(x)} ${x.readableTransaction.posted.amount >= 0 ? "+" : "-"} `;
};

// FIXME subject for generalization (see alfabank, belswissbank using similar algos, this one is stricter and verbose)
function mergeTransactionPairsIntoTransfers(tuples, isTransferTuple = defaultIsTransferTuple, makeTransferId = defaultMakeTransferId, makeTransactionId = defaultMakeTransactionId) {
    const potentialTransferTuples = tuples.filter(isTransferTuple);

    const [pairs, nonPairs] = _.partition(
        Object.entries(_.groupBy(potentialTransferTuples, (x) => makeTransferId(x))),
        ([transferId, items]) => items.length === 2,
    );

    if (nonPairs.length > 0) {
        const [singles, collisiveBuckets] = _.partition(nonPairs, ([transferId, items]) => items.length === 1);
        if (singles.length > 0) {
            console.debug("Cannot find a pair for singles looking like transfers:", JSON.stringify(singles, null, 2));
        }
        if (collisiveBuckets.length > 0) {
            throw new Error("Transactions have collisive transferId:" + JSON.stringify(collisiveBuckets, null, 2));
        }
    }

    const replacementsByTransactionIdLookup = pairs.reduce((lookup, [transferId, items]) => {
        const transfer = {
            type: "transfer",
            date: items[0].readableTransaction.date, // we may choose any date (they are equal)
            hold: items.some(({readableTransaction}) => readableTransaction.hold),
            sides: items.map(({readableTransaction}) => convertReadableTransactionToReadableTransferSide(readableTransaction)),
            comment: null,
        };
        return items.reduce((lookup, item, index) => {
            const id = makeTransactionId(item);
            console.assert(_.isUndefined(lookup[id]), "transfer side replacement is already defined");
            lookup[id] = index === 0 ? transfer : null;
            return lookup;
        }, lookup);
    }, {});
    const readableTransactions = _.compact(tuples.map((x) => {
        const replacement = replacementsByTransactionIdLookup[makeTransactionId(x)];
        return _.isUndefined(replacement) ? x.readableTransaction : replacement;
    }));
    console.assert(readableTransactions.length === tuples.length - pairs.length, "transactions count checksum mismatch", {
        readableTransactionsLength: readableTransactions.length,
        tuplesLength: tuples.length,
        transfersLength: pairs.length,
    });
    return readableTransactions;
}

export function convertApiCardsToReadableTransactions({cardsBodyResult, cardDescBodyResult}) {
    const tuples = _.sortBy(_.flatMap(cardsBodyResult, (card) => {
        const cardDesc = cardDescBodyResult.find((x) => x.id === card.clientObject.id);
        const abortedTransactions = _.flatMap(cardDesc.contract.abortedContractList, (x) => x.abortedTransactionList.reverse())
            .map((abortedTransaction) => ({type: "abortedTransaction", payload: abortedTransaction}));
        const regularTransactions = _.flatMap(cardDesc.contract.account.transCardList, (x) => x.transactionList.reverse())
            .map((regularTransaction) => ({type: "regularTransaction", payload: regularTransaction}));
        return abortedTransactions.concat(regularTransactions)
            .map((apiTransaction) => {
                const readableTransaction = convertApiTransactionToReadableTransaction(apiTransaction, card.clientObject.currIso, calculateAccountId(card));
                if (["ATM", "Cash"].includes(parseTransDetails(apiTransaction.payload.transDetails).type)) {
                    return {apiTransaction, readableTransaction: asCashTransfer(readableTransaction)};
                }
                return {apiTransaction, readableTransaction};
            });
    }), x => x.readableTransaction.date);
    return mergeTransactionPairsIntoTransfers(tuples);
}
