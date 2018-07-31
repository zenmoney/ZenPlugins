import currencies from "../belswissbank/codeToCurrencyLookup";

export function convertAccount(apiAccount) {
    return {
        id: apiAccount.accountNumber,
        type: "checking",
        title: apiAccount.name,
        instrument: currencies[apiAccount.currency],
        balance: apiAccount.balance.otb,
    };
}

export function convertTransaction(apiTransaction) {
    return {
        date: apiTransaction.date,
        income: apiTransaction.amount,
        incomeAccount: apiTransaction.recipientAccount,
        outcome: apiTransaction.amount,
        outcomeAccount: apiTransaction.payerAccount,
        payee: apiTransaction.payerName ? apiTransaction.payerName : null,
    };
}
