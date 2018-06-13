export function convertAccount(acc, type) {
    let account;
    switch (type) {
        case "CreditCard": account = convertCard(acc); break;
        case "CreditLoan": account = convertLoan(acc); break;
        default: account = null; break;
    }
    const Account = {
        account: account,
        details: getAccountDetails(acc, type),
    };
    return Account;
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
        balance: Math.round((-acc.details.repaymentAmount + acc.details.accountBalance) * 100) / 100,
        endDateOffset: acc.account.Contract.Properties.PaymentNum,
        endDateOffsetInterval: "month",
        capitalization: true,
        percent: acc.account.CreditLoanGuiData.PercentPaid,
        payoffStep: 1,
        payoffInterval: "month",
    }
}

function getAccountDetails(acc, type) {
    return {
        type: type,
        accountNumber: acc && acc.account.AccountNumber,
        cardNumber: acc && acc.account.MainCardNumber,
        contractNumber: acc && acc.account.ContractNumber,
    }
}

export function convertTransactions(acc, transactions) {
    return transactions.map(transaction => {
        const tran = {
            hold: transaction.postingDate === null,
            income: transaction.creditDebitIndicator ? transaction.amount : 0,
            incomeAccount: acc.account.id,
            outcome: transaction.creditDebitIndicator ? 0 : transaction.amount,
            outcomeAccount: acc.account.id,
            date: new Date(transaction.valueDate),
            payee: transaction.merchantName,
        };
        if (transaction.creditDebitIndicator)
            tran.description = transaction.shortDescription;
        return tran;
    });
}

function getMcc(code) {
    switch (code) {
        case "CAR":
            return 0;

        default: return null;
    }
}