/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {getMcc} from "../homecredit/converters";

export function toCard(data) {
    let account = {
        id: data.contractNumber,
        title: data.productName,
        syncID: [
            data.cardNumber.substr(-4),
        ],
        type: "ccard",
        balance: data.availableBalance,
        startBalance: 0,
        instrument: data.currency === "RUR" ? "RUB" : data.currency,
    };

    return account;
}

export function toTransaction(data, accountId) {
    let transaction = {
        id: data.movementNumber,
        hold: data.postingDate === null,
        income: data.creditDebitIndicator ? data.amount : 0,
        incomeAccount: accountId,
        outcome: data.creditDebitIndicator ? 0 : data.amount,
        outcomeAccount: accountId,
        date: new Date(data.valueDate.time),
        payee: data.merchant,
        description: data.description,
    };

    if (data.transactionTypeIBS === 0) {
        transaction.comment = data.description;
    }

    if (data.transactionTypeIBS === 5) {
        transaction.payee = data.merchantName;
    }

    if (data.mcc) {
        transaction.mcc = getMcc(data.mcc);
    }

    return transaction;
}
