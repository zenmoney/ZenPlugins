import {formatDateSql, parseDecimal} from "./converters";

export function getAccountData(account) {
    const balance = typeof account.balance === "number"
        ? account.balance
        : account.available || null;
    if (balance === null) {
        return null;
    }
    return {
        transactionHashes: {},
        currencyMovements: {},
        currencyTransaction: null,
        balance,
    };
}

export function saveAccountData(accountData) {
    delete accountData.currencyMovements;
    if (accountData.currencyTransaction
            && (accountData.currencyTransaction.income === null
            || accountData.currencyTransaction.outcome === null)) {
        accountData.currencyTransaction = null;
    }
    if (!accountData.currencyTransaction) {
        delete accountData.currencyTransaction;
    }
}

export function loadAccountData(previousAccountData) {
    if (!previousAccountData) {
        return null;
    }
    if (previousAccountData.currencyTransaction
            && (previousAccountData.currencyTransaction.income === null
            || previousAccountData.currencyTransaction.outcome === null)) {
        delete previousAccountData.currencyTransaction;
    }
    if (previousAccountData.currencyTransaction
            && !(previousAccountData.currencyTransaction.date instanceof Date)) {
        previousAccountData.currencyTransaction.date = new Date(previousAccountData.currencyTransaction.date);
    }
    return previousAccountData;
}

export function trackLastCurrencyTransaction(zenMoneyTransaction, accountData) {
    const origin = getOriginAmount(zenMoneyTransaction);
    if (origin) {
        if (accountData.currencyTransaction === null) {
            accountData.currencyTransaction = zenMoneyTransaction;
        } else {
            delete accountData.currencyTransaction;
            return true;
        }
    }
    return false;
}

export function trackCurrencyMovement({transaction, previousAccountData, accountData}) {
    let {amount, instrument} = transaction.origin || transaction.posted;
    const hash = `${formatDateSql(transaction.date)}_${instrument}_${amount}`;
    if (accountData.transactionHashes[hash]) {
        accountData.transactionHashes[hash]++;
    } else {
        accountData.transactionHashes[hash] = 1;
    }
    if (previousAccountData && previousAccountData.balance !== null
            && (previousAccountData.transactionHashes[hash] || 0) - accountData.transactionHashes[hash] < 0) {
        if (transaction.posted) {
            amount = transaction.posted.amount;
            instrument = transaction.posted.instrument;
        }
        const currencyMovement = accountData.currencyMovements[instrument];
        if (currencyMovement) {
            currencyMovement.amount += amount;
            currencyMovement.transactions.push(transaction);
        } else {
            accountData.currencyMovements[instrument] = {amount, instrument, transactions: [transaction]};
        }
    }
}

export function addDeltaToLastCurrencyTransaction({account, accountData, previousAccountData}) {
    if (accountData.balance === null
            || previousAccountData === null
            || previousAccountData.balance === null
            || !areEqualTransactions(previousAccountData.currencyTransaction, accountData.currencyTransaction)) {
        return null;
    }
    const delta = accountData.balance - previousAccountData.balance;
    const oldTransaction = previousAccountData.currencyTransaction;
    const newTransaction = accountData.currencyTransaction;

    if (Math.abs(delta) < 0.01) {
        newTransaction.income = oldTransaction.income;
        newTransaction.outcome = oldTransaction.outcome;
        return null;
    }

    const holdCorrectionRate = 0.05;
    if (oldTransaction.incomeAccount === account.id && oldTransaction.income > 0 && oldTransaction.opIncome > 0
            && Math.abs(delta) / oldTransaction.income < holdCorrectionRate) {
        newTransaction.income = parseDecimal(oldTransaction.income + delta);
    } else if (oldTransaction.outcomeAccount === account.id && oldTransaction.outcome > 0 && oldTransaction.opOutcome > 0
            && Math.abs(delta) / oldTransaction.outcome < holdCorrectionRate) {
        newTransaction.outcome = parseDecimal(oldTransaction.outcome - delta);
    }
    delete accountData.currencyTransaction;

    return newTransaction;
}

export const RestoreResult = {
    ERROR: 0,
    UNCHANGED: 1,
    RESTORED: 2,
};

export function restoreNewCurrencyTransactions({account, accountData, previousAccountData}) {
    if (accountData.balance === null
            || !previousAccountData || previousAccountData.balance === null) {
        return RestoreResult.ERROR;
    }

    let delta = accountData.balance - previousAccountData.balance;
    const accountCurrencyMovement = accountData.currencyMovements[account.instrument];
    if (accountCurrencyMovement) {
        delta -= accountCurrencyMovement.amount;
        delete accountData.currencyMovements[account.instrument];
    }

    const instruments = Object.keys(accountData.currencyMovements);
    if (instruments.length > 1) {
        return RestoreResult.ERROR;
    }
    if (instruments.length === 0) {
        return RestoreResult.UNCHANGED;
    }

    const currencyMovement = accountData.currencyMovements[instruments[0]];
    if (Math.sign(currencyMovement.amount) !== Math.sign(delta)
            || Math.abs(currencyMovement.amount) < 0.01
            || Math.abs(delta) < 0.01) {
        return RestoreResult.ERROR;
    }

    const rate = delta / currencyMovement.amount;
    const n = currencyMovement.transactions.length;
    currencyMovement.transactions.forEach((transaction, i) => {
        if (!transaction.posted) {
            transaction.posted = {
                amount: i === n - 1
                    ? parseDecimal(Math.sign(transaction.origin.amount) * Math.max(0.01, Math.abs(delta)))
                    : parseDecimal(transaction.origin.amount * rate),
                instrument: account.instrument,
            };
        }
        delta -= transaction.posted.amount;
    });

    return RestoreResult.RESTORED;
}

function getOriginAmount(transaction) {
    if (transaction.opIncome) {
        return {amount: transaction.opIncome, instrument: transaction.opIncomeInstrument};
    } else if (transaction.opOutcome) {
        return {amount: -transaction.opOutcome, instrument: transaction.opOutcomeInstrument};
    } else {
        return null;
    }
}

function areEqualTransactions(transaction1, transaction2) {
    return transaction1 && transaction2
        && formatDateSql(transaction1.date) === formatDateSql(transaction2.date)
        && transaction1.incomeAccount === transaction2.incomeAccount
        && transaction1.outcomeAccount === transaction2.outcomeAccount
        && transaction1.opIncome === transaction2.opIncome
        && transaction1.opIncomeInstrument === transaction2.opIncomeInstrument
        && transaction1.opOutcome === transaction2.opOutcome
        && transaction1.opOutcomeInstrument === transaction2.opOutcomeInstrument
        && (transaction1.income === null || transaction2.income === null || transaction1.income === transaction2.income)
        && (transaction2.outcome === null || transaction2.outcome === null || transaction1.outcome === transaction2.outcome);
}
