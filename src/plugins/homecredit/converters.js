import _ from "lodash";

export function convertAccounts(acc, type) {
    switch (type) {
        case "CreditCard": return convertCard(acc);
        case "CreditLoan": return convertLoan(acc);
        default: return null;
    }
}

export function convertCard(acc) {
    return {
        id: acc.account.ContractNumber,
        type: "ccard",
        syncID: acc.account.MainCardNumber.substr(-4),
        title: acc.account.ProductName,
        instrument: "RUB",
        balance: Math.round((acc.account.AvailableBalance - acc.account.CreditLimit) * 100) / 100,
        creditLimit: acc.account.CreditLimit,
    }
}

export function convertLoan(acc) {
    return {
        id: acc.account.ContractNumber,
        type: "loan",
        syncID: acc.account.ContractNumber.substr(-4),
        title: acc.account.ProductName,
        instrument: "RUB",
        startDate: acc.account.DateSign,
        startBalance: acc.account.CreditAmount,
        balance: acc.details.repaymentAmount,
        endDateOffset: acc.account.Contract.Properties.PaymentNum,
        endDateOffsetInterval: "month",
        capitalization: true,
        percent: acc.account.CreditLoanGuiData.PercentPaid,
        payoffStep: 1,
        payoffInterval: "month",
    }
}

export function convertTransaction(json, accounts) {
    const transaction = {
        hold: json.type !== "TRANSACTION",
        income: json.accountAmount.value > 0 ? json.accountAmount.value : 0,
        incomeAccount: json.relationId,
        outcome: json.accountAmount.value < 0 ? -json.accountAmount.value : 0,
        outcomeAccount: json.relationId,
        date: new Date(json.operationTime),
    };
    if (!transaction.hold) {
        transaction.id = json.id;
    }
    if (json.accountAmount.currency.shortName !== json.amount.currency.shortName) {
        if (json.amount.value > 0) {
            transaction.opIncome = json.amount.value;
            transaction.opIncomeInstrument = json.amount.currency.shortName;
        } else {
            transaction.opOutcome = -json.amount.value;
            transaction.opOutcomeInstrument = json.amount.currency.shortName;
        }
    }
    return transaction;
}
