import currencies from "../belswissbank/codeToCurrencyLookup";

export function convertAccount(apiAccount) {
    return {
        id: apiAccount.accountNumber,
        type: "checking",
        title: apiAccount.name,
        instrument: currencies[apiAccount.currency],
        balance: apiAccount.balance.otb,
        syncID: [apiAccount.accountNumber],
    };
}

export function convertTransaction(apiTransaction, account) {
    const payee = apiTransaction.payerAccount === account.id ? apiTransaction.recipient : apiTransaction.payerName;
    const transaction = {
        date: apiTransaction.date,
        income: apiTransaction.amount,
        incomeAccount: apiTransaction.recipientAccount,
        outcome: apiTransaction.amount,
        outcomeAccount: apiTransaction.payerAccount,
        payee: payee || null,
        comment: apiTransaction.paymentPurpose || null,
    };
    [
        parseCardTransfer,
        parsePayee,
    ].some(parser => parser(transaction, account));
    return transaction;
}

function parsePayee(transaction, account) {
    if (!transaction.payee) {
        return;
    }
    for (const regex of [
        /^ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ\s+(.+)/i,
        /^(.+)\s\/\/\s/i,
        /^(.+)\s*р\/с/i,
    ]) {
        const match = transaction.payee.match(regex);
        if (match) {
            transaction.payee = match[1];
            return false;
        }
    }
    return false;
}

function parseCardTransfer(transaction, account) {
    if (!transaction.comment) {
        return false;
    }
    for (const regex of [
        /^Перевод с карты \*(\d{4})/i,
    ]) {
        const match = transaction.comment.match(regex);
        if (match) {
            if (transaction.incomeAccount === account.id) {
                transaction.outcomeAccount = `ccard#${account.instrument}#${match[1]}`;
            } else {
                transaction.incomeAccount = `ccard#${account.instrument}#${match[1]}`;
            }
            return false;
        }
    }
}
