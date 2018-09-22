export function convertAccount(apiAccount) {
    return {
        id: apiAccount.bank_code,
        type: "checking",
        title: apiAccount.account_code,
        syncID: [apiAccount.account_code],
    };
}

export function convertTransaction(apiTransaction, account) {
    // ToDO
    return null;
    /*const payee = apiTransaction.payerAccount === account.id ? apiTransaction.recipient : apiTransaction.payerName;
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
    return transaction;*/
}
