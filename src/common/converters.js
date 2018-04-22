import _ from "lodash";
import {isValidDate} from "./dates";

export function formatRate({originAmount, postedAmount}) {
    const rate = originAmount / postedAmount;
    return rate < 1
        ? `1/${(1 / rate).toFixed(4)}`
        : rate.toFixed(4);
}

export function formatComment({posted, origin}) {
    if (!origin || origin.instrument === posted.instrument) {
        return null;
    }
    return `${Math.abs(origin.amount).toFixed(2)} ${origin.instrument}\n(rate=${formatRate({originAmount: origin.amount, postedAmount: posted.amount})})`;
}

const accountTypes = ["cash", "ccard", "checking", "loan", "deposit"];

function makeZenmoneyAccountReference(account) {
    console.assert(_.isPlainObject(account), "account must be Object:", account);
    const {id, type, instrument, syncID, ...rest} = account;
    assertRestIsEmpty(rest, "account props", account);
    if (id && !type && !instrument && !syncID) {
        console.assert(_.isString(id), "account.id must be String:", account);
        console.assert(accountTypes.every((t) => !id.includes(t)), "account.id must not be used to provide weak reference. Use account weak-referencing type, instrument[, syncID] props instead.");
        return id;
    } else if (!id && type) {
        console.assert(accountTypes.includes(type), `Unknown account.type "${type}". Supported values are`, accountTypes);
        console.assert(_.isString(instrument), "instrument must be String currency code", account);
        // syncID is optional, allows to narrow cards lookup
        if (type === "cash") {
            console.assert(_.isUndefined(syncID), "cash account cannot have syncID", account);
        } else {
            console.assert(!_.isUndefined(syncID) && (syncID === null || (syncID && _.isString(syncID))), "syncID must be non-empty String", account);
        }
        return syncID
            ? `${type}#${instrument}#${syncID}`
            : `${type}#${instrument}`;
    } else {
        console.assert(false, "Either provide specific accounts' id, or provide weak-referencing type, instrument[, syncID]", account);
    }
}

export function convertReadableTransactionToReadableTransferSide({id, account, posted}) {
    return {
        id,
        account,
        amount: posted.amount,
        instrument: posted.instrument,
    };
}

export function asCashTransfer(readableTransaction) {
    const target = readableTransaction.origin || readableTransaction.posted;
    return {
        type: "transfer",
        date: readableTransaction.date,
        hold: readableTransaction.hold,
        sides: [
            {
                id: null,
                account: {type: "cash", instrument: target.instrument},
                amount: -target.amount,
                instrument: target.instrument,
            },
            convertReadableTransactionToReadableTransferSide(readableTransaction),
        ],
        comment: readableTransaction.comment,
    };
}

function makeZenmoneyTransfer(transfer) {
    const {
        type,
        date,
        hold,
        sides,
        comment,
        ...rest,
    } = transfer;

    console.assert(type === "transfer", `type must be equal to "transfer"`);
    console.assert(isValidDate(date), "date must be defined Date:", transfer);
    console.assert(!_.isUndefined(hold) && (hold === null || _.isBoolean(hold)), "hold must be defined Boolean:", transfer);

    console.assert(_.isArray(sides), "sides must be Array:", transfer);
    console.assert(sides.length === 2, "transfer sides must contain two items: sender and receiver", transfer);
    sides.forEach((side, index) => {
        const details = {transfer, side, index};
        console.assert(_.isPlainObject(side), "side must be Object:", details);
        const {id, account, amount, instrument, ...rest} = side;
        console.assert(!_.isUndefined(id), "side.id must be defined:", details);
        console.assert(_.isNumber(amount), "side.amount must be Number:", details);
        console.assert(_.isString(instrument), "side.instrument must be String:", details);
        assertRestIsEmpty(rest, `side props`, details);
    });
    const [outcome, income] = _.sortBy(sides, (x) => x.amount >= 0);
    console.assert(outcome.amount < 0, "one side must be sender (outcome)");
    console.assert(income.amount >= 0, "one side must be receiver (income)");

    console.assert(!_.isUndefined(comment), `comment must be defined:`, transfer);

    assertRestIsEmpty(rest, "props", transfer);

    const absOutcomeAmount = Math.abs(outcome.amount);
    const result = {
        date,
        outcome: absOutcomeAmount,
        outcomeAccount: makeZenmoneyAccountReference(outcome.account),
        outcomeBankID: outcome.id,
        income: income.amount,
        incomeAccount: makeZenmoneyAccountReference(income.account),
        incomeBankID: income.id,
        comment,
    };
    if (outcome.instrument !== income.instrument) {
        Object.assign(result, {
            opOutcome: income.amount,
            opOutcomeInstrument: income.instrument,
            opIncome: absOutcomeAmount,
            opIncomeInstrument: outcome.instrument,
        });
    }
    return result;
}

function assertRestIsEmpty(rest, kind, kindInstance) {
    const propsThatMakeNoDifference = Object.keys(rest);
    console.assert(propsThatMakeNoDifference.length === 0, propsThatMakeNoDifference, kind, "are unknown:", kindInstance);
}

function makeZenmoneyTransaction(transaction) {
    const {
        type,
        id,
        account,
        date,
        hold,
        posted,
        origin,
        payee,
        mcc,
        location,
        comment,
        ...rest,
    } = transaction;

    console.assert(type === "transaction", `type must be equal to "transaction"`);
    console.assert(
        !_.isUndefined(id) && (id === null || _.isString(id)),
        "id must be defined String:",
        transaction,
    );

    console.assert(isValidDate(date), "date must be defined Date:", transaction);
    console.assert(!_.isUndefined(hold) && (hold === null || _.isBoolean(hold)), "hold must be defined Boolean:", transaction);

    console.assert(
        !_.isUndefined(payee) && (payee === null || _.isString(payee)),
        "payee must be defined String:",
        transaction,
    );

    console.assert(
        !_.isUndefined(mcc) && (mcc === null || _.isNumber(mcc)),
        "mcc must be defined String:",
        transaction,
    );

    console.assert(
        !_.isUndefined(comment) && (comment === null || _.isString(comment)),
        "comment must be defined String:",
        transaction,
    );

    console.assert(_.isPlainObject(posted), "posted must be Object:", transaction);
    const {amount: postedAmount, instrument: postedInstrument, ...postedRest} = posted;
    console.assert(_.isNumber(postedAmount), "posted.amount must be Number:", transaction);
    console.assert(_.isString(postedInstrument), "posted.instrument must be String:", transaction);
    assertRestIsEmpty(postedRest, "posted props", transaction);

    assertRestIsEmpty(rest, "props", transaction);

    const result = {
        id,
        date,
        payee,
        mcc,
        comment,
    };
    const zenmoneyAccountReference = makeZenmoneyAccountReference(account);
    if (postedAmount >= 0) {
        result.income = Math.abs(postedAmount);
        result.incomeAccount = zenmoneyAccountReference;
        result.outcome = 0;
        result.outcomeAccount = zenmoneyAccountReference;
    } else {
        result.income = 0;
        result.incomeAccount = zenmoneyAccountReference;
        result.outcome = Math.abs(postedAmount);
        result.outcomeAccount = zenmoneyAccountReference;
    }

    console.assert(origin === null || _.isPlainObject(origin), "origin must be Object:", transaction);
    if (origin !== null && origin.instrument !== postedInstrument) {
        const {
            instrument: originInstrument,
            amount: originAmount,
            ...originRest,
        } = origin;
        console.assert(_.isNumber(originAmount), "origin.amount must be Number:", transaction);
        console.assert(_.isString(originInstrument), "origin.instrument must be String:", transaction);
        assertRestIsEmpty(originRest, "origin props", transaction);

        console.assert(Math.sign(originAmount) === Math.sign(postedAmount), "posted and origin amounts have contradictory signs:", transaction);
        console.assert(
            originInstrument !== postedInstrument || originAmount === postedAmount,
            "posted and origin amounts are contradictory (must be equal if instruments are same):",
            transaction,
        );

        if (postedAmount >= 0) {
            result.opIncome = Math.abs(originAmount);
            result.opIncomeInstrument = originInstrument;
        } else {
            result.opOutcome = Math.abs(originAmount);
            result.opOutcomeInstrument = originInstrument;
        }
    }

    console.assert(!_.isUndefined(location) && (location === null || _.isPlainObject(location)), "location must be defined Object:", transaction);
    if (location !== null) {
        const {latitude, longitude, locationRest} = location;
        console.assert(_.isNumber(latitude), "location.latitude must be Number:", transaction);
        console.assert(_.isNumber(longitude), "location.longitude must be Number:", transaction);
        assertRestIsEmpty(locationRest, "location props", transaction);
        result.latitude = latitude;
        result.longitude = longitude;
    }
    return result;
}

export function toZenmoneyTransaction(readableDto) {
    return readableDto.type === "transfer"
        ? makeZenmoneyTransfer(readableDto)
        : makeZenmoneyTransaction(readableDto);
}
