import _ from "lodash";
import {asCashTransfer, convertReadableTransactionToReadableTransferSide, formatComment} from "../../common/converters";
import {parseApiAmount} from "./api";

function convertCreditApiAccount(apiAccount) {
    const amount = parseApiAmount(apiAccount.amount);
    const debtAmount = parseApiAmount(apiAccount.creditInfo.amountDebt);
    console.assert(debtAmount >= 0, "Unexpected negative debtAmount", debtAmount);
    return {
        available: amount,
        creditLimit: debtAmount + amount,
    };
}

function convertNonCreditApiAccount(apiAccount) {
    const amount = parseApiAmount(apiAccount.amount);
    return {
        balance: amount,
    };
}

export function toZenmoneyAccount(apiAccount) {
    const {description, number, currencyCode} = apiAccount;
    return {
        type: "ccard",
        id: number.slice(-4),
        title: description,
        syncID: [number.slice(-4)],
        instrument: currencyCode,
        ...apiAccount.creditInfo
            ? convertCreditApiAccount(apiAccount)
            : convertNonCreditApiAccount(apiAccount),
    };
}

const dateRegExp = /\d{2}\.\d{2}\.\d{2}/;
const spaceRegExp = /\s+/;
const amountRegExp = /((?:\d+)?\.\d+)/;
const currencyRegExp = /(\w{3})/;
const optionalMccRegExp = /(?:\s+MCC(\d+))?/;

// poor mans parser generator
const descriptionRegExp = new RegExp([
    dateRegExp,
    spaceRegExp,
    amountRegExp,
    spaceRegExp,
    currencyRegExp,
    optionalMccRegExp,
].map((x) => x.source).join(""));

export function parseApiMovementDescription(description, sign) {
    const match = description.match(descriptionRegExp);
    if (!match) {
        return {
            origin: null,
            mcc: null,
        };
    }
    const [, amount, currency, mcc] = match;
    return {
        origin: {
            amount: sign * Number(amount),
            instrument: currency,
        },
        mcc: mcc ? Number(mcc) : null,
    };
}

function calculateAccountId(parsedAmount, apiMovement) {
    if (parsedAmount > 0) {
        const recipientAccountId = apiMovement.recipientInfo.recipientAccountNumberDescription;
        console.assert(recipientAccountId, "recipientAccountId is unknown", apiMovement);
        return recipientAccountId.slice(-4);
    } else {
        const senderAccountId = apiMovement.senderInfo.senderAccountNumberDescription;
        console.assert(senderAccountId, "senderAccountId is unknown", apiMovement);
        return senderAccountId.slice(-4);
    }
}

export const normalizeIsoDate = (isoDate) => isoDate.replace(/([+-])(\d{2})(\d{2})$/, "$1$2:$3");

export function convertApiMovementToReadableTransaction(apiMovement) {
    const posted = {amount: parseApiAmount(apiMovement.amount), instrument: apiMovement.currency};
    const {mcc, origin} = parseApiMovementDescription(apiMovement.description, Math.sign(posted.amount));
    const readableTransaction = {
        type: "transaction",
        id: apiMovement.key,
        account: {id: calculateAccountId(posted.amount, apiMovement)},
        date: new Date(normalizeIsoDate(apiMovement.createDate)),
        hold: apiMovement.hold,
        posted,
        origin,
        payee: (apiMovement.recipientInfo && apiMovement.recipientInfo.recipientName) || apiMovement.shortDescription || null,
        mcc,
        location: null,
        comment: formatComment({posted, origin}),
    };
    if (apiMovement.shortDescription === "Снятие наличных в банкомате" ||
        apiMovement.description.startsWith("Внесение наличных рублей") ||
        apiMovement.description.includes("Внесение средств через устройство")) {
        return asCashTransfer(readableTransaction);
    }
    // TODO transfers from other banks can be handled
    return readableTransaction;
}

const bankName = `АО "АЛЬФА-БАНК"`;

function isTransferTuple({apiMovement: {senderInfo, recipientInfo}, readableTransaction}) {
    if (readableTransaction.type !== "transaction") {
        return false;
    }
    if (readableTransaction.posted.amount > 0) {
        return senderInfo.senderNameBank === bankName;
    } else {
        return recipientInfo &&
            recipientInfo.recipientNameBank === bankName &&
            recipientInfo.recipientAccountNumberDescription;
    }
}

function mergeTransactionPairsIntoTransfers(tuples) {
    const potentialTransfers = tuples.filter(isTransferTuple).map(({apiMovement, readableTransaction}) => {
        const {amount, instrument} = readableTransaction.origin || readableTransaction.posted;
        return {
            transferId: `${Math.abs(amount)} ${instrument} @ ${apiMovement.createDate}`,
            apiMovement,
            readableTransaction,
        };
    });

    const [pairs, nonPairs] = _.partition(
        _.toPairs(_.groupBy(potentialTransfers, (x) => x.transferId)),
        ([transferId, items]) => items.length === 2,
    );

    if (nonPairs.length > 0) {
        console.error("Cannot merge these ambiguous transaction pairs into transfers:", JSON.stringify(nonPairs, null, 2));
    }

    const transfers = pairs.map(([transferId, items]) => {
        return {
            type: "transfer",
            date: items[0].readableTransaction.date, // we may choose any date (they are equal)
            hold: items.some(({readableTransaction}) => readableTransaction.hold),
            sides: items.map(({readableTransaction}) => convertReadableTransactionToReadableTransferSide(readableTransaction)),
            comment: null,
        };
    });

    const replacementsByTransactionIdLookup = transfers.reduce((lookup, transfer) => {
        transfer.sides.forEach(({id}, index) => {
            console.assert(id, "transfer side id must be provided");
            console.assert(_.isUndefined(lookup[id]), "transfer side replacement is already defined");
            lookup[id] = index === 0 ? transfer : null;
        });
        return lookup;
    }, {});

    const readableTransactions = _.compact(tuples.map(({readableTransaction}) => {
        const replacement = replacementsByTransactionIdLookup[readableTransaction.id];
        return _.isUndefined(replacement) ? readableTransaction : replacement;
    }));

    console.assert(readableTransactions.length === tuples.length - transfers.length, "transactions count checksum failed", {
        readableTransactionsLength: readableTransactions.length,
        tuplesLength: tuples.length,
        transfersLength: transfers.length,
    });

    return readableTransactions;
}

export function convertApiMovementsToReadableTransactions(apiMovements) {
    const uniqueMovements = _.uniqBy(apiMovements, x => x.key);
    const tuples = uniqueMovements.map((apiMovement) => ({
        apiMovement,
        readableTransaction: convertApiMovementToReadableTransaction(apiMovement),
    }));
    return mergeTransactionPairsIntoTransfers(tuples);
}
