import _ from "lodash";
import {asCashTransfer, formatComment} from "../../common/converters";
import {mergeTransfers} from "../../common/mergeTransfers";
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
const amountRegExp = /(\d*?(?:\.\d+)?)/;
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

export function convertApiMovementsToReadableTransactions(apiMovements) {
    const uniqueMovements = _.uniqBy(apiMovements, x => x.key);
    const items = uniqueMovements.map((apiMovement) => ({
        apiMovement,
        readableTransaction: convertApiMovementToReadableTransaction(apiMovement),
    }));
    return mergeTransfers({
        items: items,
        selectReadableTransaction: (item) => item.readableTransaction,
        isTransferItem: ({apiMovement: {senderInfo, recipientInfo}, readableTransaction}) => {
            if (readableTransaction.type !== "transaction") {
                return false;
            }
            if (readableTransaction.posted.amount > 0) {
                return senderInfo.senderNameBank === `АО "АЛЬФА-БАНК"` && senderInfo.senderAccountNumberDescription;
            } else {
                return recipientInfo &&
                    recipientInfo.recipientNameBank === `АО "АЛЬФА-БАНК"` &&
                    recipientInfo.recipientAccountNumberDescription;
            }
        },
        makeGroupKey: (item) => {
            const {amount, instrument} = item.readableTransaction.origin || item.readableTransaction.posted;
            return `${Math.abs(amount)} ${instrument} @ ${item.readableTransaction.date}`;
        },
        selectTransactionId: (item) => item.readableTransaction.id,
    });
}
