import currencies from "../belswissbank/codeToCurrencyLookup";

export function convertAccounts(apiAccounts, walletId) {
    const accounts = [];
    for (const apiAccount of apiAccounts) {
        if (apiAccount.type.id !== "WALLET") {
            continue;
        }
        accounts.push({
            id: getAccountId(walletId, apiAccount.currency),
            type: "checking",
            title: "QIWI (" + currencies[apiAccount.currency] + ")",
            instrument: currencies[apiAccount.currency],
            syncID: [walletId.toString().slice(-4)],
            balance: apiAccount.balance.amount,
        });
    }
    return accounts;
}

export function convertTransactions(apiTransactions, walletId) {
    const transactions = [];
    for (const apiTransaction of apiTransactions) {
        if (apiTransaction.status === "ERROR") {
            continue;
        }
        const accountId = getAccountId(walletId, apiTransaction.sum.currency);
        const transaction = {
            id: apiTransaction.txnId.toFixed(0),
            hold: apiTransaction.status !== "SUCCESS",
            date: new Date(apiTransaction.date),
            income: apiTransaction.type === "IN" ? apiTransaction.sum.amount : 0,
            incomeAccount: accountId,
            outcome: apiTransaction.type === "IN" ? 0 : apiTransaction.sum.amount,
            outcomeAccount: accountId,
            comment: apiTransaction.comment,
        };
        switch (apiTransaction.provider.id) {
            case 7: //QIWI wallet
            case 1099: //QIWI wallet currency conversion
                break;
            case 99: //transfer to another QIWI wallet
                transaction.payee = `QIWI ${apiTransaction.view.account}`;
                break;
            default:
                if (apiTransaction.account === "Платежная система") {
                    if (!transaction.comment) {
                        transaction.comment = "Пополнение";
                    }
                } else {
                    transaction.payee = apiTransaction.provider.shortName;
                }
                break;
        }
        switch (apiTransaction.source.id) {
            case 99: //income transfer from another QIWI wallet
                if (apiTransaction.provider.id === 7) {
                    transaction.payee = `QIWI ${apiTransaction.view.account}`;
                }
                break;
            default:
                break;
        }
        transactions.push(transaction);
    }
    return transactions;
}

function getAccountId(walletId, currency) {
    return `${walletId}_${currency}`;
}
