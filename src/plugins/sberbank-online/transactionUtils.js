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

export function trackLastCurrencyTransaction(zenMoneyTransaction, accountData) {
    const origin = getOriginAmount(zenMoneyTransaction);
    if (origin) {
        if (accountData.currencyTransaction === null
                && zenMoneyTransaction.income !== null && zenMoneyTransaction.outcome !== null) {
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
            || !areEqualTransactions(previousAccountData.currencyTransaction, accountData.currencyTransaction)
            || previousAccountData.currencyTransaction.income === null
            || previousAccountData.currencyTransaction.outcome === null) {
        delete accountData.currencyTransaction;
        return;
    }
    const delta = accountData.balance - previousAccountData.balance;
    const transaction = previousAccountData.currencyTransaction;

    if (Math.abs(delta) < 0.01) {
        accountData.currencyTransaction.income = transaction.income;
        accountData.currencyTransaction.outcome = transaction.outcome;
        return;
    }

    const holdCorrectionRate = 0.05;
    if (transaction.incomeAccount === account.id && transaction.income > 0 && transaction.opIncome > 0
            && Math.abs(delta) / transaction.income < holdCorrectionRate) {
        accountData.currencyTransaction.income = parseDecimal(transaction.income + delta);
    } else if (transaction.outcomeAccount === account.id && transaction.outcome > 0 && transaction.opOutcome > 0
            && Math.abs(delta) / transaction.outcome < holdCorrectionRate) {
        accountData.currencyTransaction.outcome = parseDecimal(transaction.outcome - delta);
    }
    delete accountData.currencyTransaction;
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
        && transaction1.date === transaction2.date
        && transaction1.incomeAccount === transaction2.incomeAccount
        && transaction1.outcomeAccount === transaction2.outcomeAccount
        && transaction1.opIncome === transaction2.opIncome
        && transaction1.opIncomeInstrument === transaction2.opIncomeInstrument
        && transaction1.opOutcome === transaction2.opOutcome
        && transaction1.opOutcomeInstrument === transaction2.opOutcomeInstrument
        && (transaction1.income === null || transaction2.income === null || transaction1.income === transaction2.income)
        && (transaction2.outcome === null || transaction2.outcome === null || transaction1.outcome === transaction2.outcome);
}
