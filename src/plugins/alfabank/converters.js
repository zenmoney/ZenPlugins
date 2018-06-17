import _ from "lodash";
import {ensureSyncIDsAreUniqueButSanitized} from "../../common/accounts";
import {asCashTransfer, formatComment} from "../../common/converters";
import {mergeTransfers} from "../../common/mergeTransfers";
import {formatWithCustomInspectParams} from "../../consoleAdapter";
import {parseApiAmount} from "./api";

const trimPostfix = (string, postfix) => {
    if (!string.endsWith(postfix)) {
        throw new Error(`${JSON.stringify(string)} does not end with ${postfix}`);
    }
    return string.slice(0, -postfix.length);
};

function convertCreditApiAccount(apiAccount) {
    const {
        "Кредитный продукт и валюта": typeWithDashAndInstrument,
        "Доступный лимит": availableWithInstrument,
        "Установленный лимит": creditLimitWithInstrument,
    } = apiAccount.accountDetailsCreditInfo;
    const instrumentPostfix = " " + apiAccount.currencyCode;
    if (availableWithInstrument && creditLimitWithInstrument) {
        return {
            available: parseApiAmount(trimPostfix(availableWithInstrument, instrumentPostfix)),
            creditLimit: parseApiAmount(trimPostfix(creditLimitWithInstrument, instrumentPostfix)),
        };
    } else if (typeWithDashAndInstrument.startsWith("Кредит наличными")) {
        return {
            startBalance: 0,
            balance: parseApiAmount(apiAccount.amount),
        };
    } else {
        console.error({apiAccount});
        throw new Error(`Unhandled credit account named ${apiAccount.description} (see logs)`);
    }
}

function convertNonCreditApiAccount(apiAccount) {
    return {
        balance: parseApiAmount(apiAccount.amount),
    };
}

export function toZenmoneyAccount(apiAccount) {
    const {description, number, currencyCode, creditInfo} = apiAccount;
    return {
        type: "ccard",
        id: number,
        title: description,
        syncID: [number],
        instrument: currencyCode,
        ...creditInfo
            ? convertCreditApiAccount(apiAccount)
            : convertNonCreditApiAccount(apiAccount),
    };
}

export const convertApiAccountsToAccountTuples = (apiAccounts) => {
    const zenMoneyAccounts = ensureSyncIDsAreUniqueButSanitized({
        accounts: apiAccounts.map(toZenmoneyAccount),
        sanitizeSyncId: (syncID) => syncID.slice(-8),
    });
    return apiAccounts.map((apiAccount, index) => {
        const zenMoneyAccount = zenMoneyAccounts[index];
        console.assert(zenMoneyAccount.id === apiAccount.number, "invariant: ensureSyncIDsAreUniqueButSanitized changed order");
        return {apiAccount, zenMoneyAccount};
    });
};

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

const findAccountTupleByLast4 = ({accountTuples, last4}) => {
    const matchingAccounts = accountTuples.filter((x) => x.apiAccount.number.endsWith(last4));
    if (matchingAccounts.length !== 1) {
        console.error({last4, matchingAccounts});
        throw new Error("cannot match account id unambiguously (see logs)");
    }
    return matchingAccounts[0];
};

function findMovementAccountTuple(apiMovement, accountTuples) {
    const parsedAmount = parseApiAmount(apiMovement.amount);
    const candidates = parsedAmount > 0
        ? [
            apiMovement.recipientInfo && apiMovement.recipientInfo.recipientAccountNumberDescription,
            apiMovement.recipientInfo && apiMovement.recipientInfo.recipientValue,
        ] : [
            apiMovement.senderInfo && apiMovement.senderInfo.senderAccountNumberDescription,
        ];
    const candidatesLast4Chars = _.uniq(_.compact(candidates).map((x) => x.slice(-4)));
    if (candidatesLast4Chars.length === 1) {
        return findAccountTupleByLast4({accountTuples, last4: candidatesLast4Chars[0]});
    }
    if (candidatesLast4Chars.length === 0) {
        const nonOwnSharedAccountTuples = accountTuples.filter((x) => x.apiAccount.sharedAccountInfo && !x.apiAccount.sharedAccountInfo.isOwn);
        if (nonOwnSharedAccountTuples.length === 1) {
            return nonOwnSharedAccountTuples[0];
        }
    }
    throw new Error(formatWithCustomInspectParams(
        `cannot determine ${parsedAmount > 0 ? "recipient" : "sender"} account id`,
        {apiMovement, candidatesLast4Chars},
    ));
}

export const normalizeIsoDate = (isoDate) => isoDate.replace(/([+-])(\d{2})(\d{2})$/, "$1$2:$3");

function convertApiMovementToReadableTransaction(apiMovement, accountId) {
    const posted = {amount: parseApiAmount(apiMovement.amount), instrument: apiMovement.currency};
    const {mcc, origin} = parseApiMovementDescription(apiMovement.description, Math.sign(posted.amount));
    const readableTransaction = {
        type: "transaction",
        id: apiMovement.key,
        account: {id: accountId},
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

const neverLosingDataMergeCustomizer = function(valueInA, valueInB, key, objA, objB) {
    if (valueInA && valueInB && valueInA !== valueInB && !(_.isPlainObject(valueInA) && _.isPlainObject(valueInB))) {
        if (key === "recipientAccountNumberDescription" && objA.recipientValue && valueInB.endsWith(objA.recipientValue.slice(-4))) {
            return;
        }
        console.assert(false, key, `has ambiguous values:`, [valueInA, valueInB], `objects:`, [objA, objB]);
    }
};

function complementSides(apiMovements) {
    const relatedMovementsByReferenceLookup = _.fromPairs(_.toPairs(_.groupBy(apiMovements, x => {
        delete x.actions;
        return x.reference;
    })).filter(([key, items]) => key !== "HOLD" && !key.startsWith("CASHIN") && items.length === 2));
    return apiMovements.map((apiMovement) => {
        const relatedMovements = relatedMovementsByReferenceLookup[apiMovement.reference];
        if (!relatedMovements) {
            return apiMovement;
        }
        const senderInfo = _.mergeWith({}, ...relatedMovements.map((x) => x.senderInfo), neverLosingDataMergeCustomizer);
        const recipientInfo = _.mergeWith({}, ...relatedMovements.map((x) => x.recipientInfo), neverLosingDataMergeCustomizer);
        return {...apiMovement, senderInfo, recipientInfo};
    });
}

export function convertApiMovementsToReadableTransactions(apiMovements, accountTuples) {
    const movementsWithoutDuplicates = _.uniqBy(apiMovements, x => x.key);
    const movementsWithCompleteSides = complementSides(movementsWithoutDuplicates);
    const processedMovements = movementsWithCompleteSides.map((apiMovement) => {
        const {apiAccount, zenMoneyAccount} = findMovementAccountTuple(apiMovement, accountTuples);
        return {
            apiMovement,
            apiAccount,
            readableTransaction: convertApiMovementToReadableTransaction(apiMovement, zenMoneyAccount.id),
        };
    });
    const processedMovementsWithoutNonAccountableArtifacts = processedMovements.filter(({apiMovement, apiAccount}) => {
        if (!apiAccount.accountDetailsCreditInfo || !apiAccount.accountDetailsCreditInfo["Кредитный продукт и валюта"].startsWith("Кредитная карта")) {
            return true;
        }
        return !apiMovement.shortDescription || !apiMovement.shortDescription.startsWith("Погашение ");
    });
    return mergeTransfers({
        items: processedMovementsWithoutNonAccountableArtifacts,
        selectReadableTransaction: (item) => item.readableTransaction,
        isTransferItem: ({apiMovement: {senderInfo, recipientInfo, reference, description}, readableTransaction}) => {
            if (readableTransaction.type !== "transaction") {
                return false;
            }
            if (description.startsWith("Внутрибанковский перевод между счетами")) {
                return true;
            }
            if (readableTransaction.posted.amount > 0) {
                return senderInfo.senderNameBank === `АО "АЛЬФА-БАНК"`;
            } else {
                return recipientInfo && recipientInfo.recipientNameBank === `АО "АЛЬФА-БАНК"`;
            }
        },
        makeGroupKey: (item) => item.apiMovement.reference,
        selectTransactionId: (item) => item.readableTransaction.id,
    });
}
