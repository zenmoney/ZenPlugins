export function convertAccount(accountData, type) {
    const resultData = {};
    switch (type) {
        case "CreditCard": resultData.account = convertCard(accountData); break;
        case "CreditLoan": resultData.account = convertLoan(accountData); break;
        default: resultData.account = null; break;
    }
    resultData.details = getAccountDetails(accountData, type);
    return resultData;
}

export function convertCard(accountData) {
    return {
        id: accountData.account.ContractNumber,
        type: "ccard",
        syncID: accountData.account.MainCardNumber.substr(-4),
        title: accountData.account.ProductName,
        instrument: "RUB",
        balance: Math.round((accountData.account.AvailableBalance - accountData.account.CreditLimit) * 100) / 100,
        creditLimit: accountData.account.CreditLimit,
    }
}

export function convertLoan(accountData) {
    var res = {
        id: accountData.account.ContractNumber,
        type: "loan",
        syncID: accountData.account.ContractNumber.substr(-4),
        title: accountData.account.ProductName,
        instrument: "RUB",
        startDate: accountData.account.DateSign,
        startBalance: accountData.account.CreditAmount,
        endDateOffset: accountData.account.Contract.Properties.PaymentNum,
        endDateOffsetInterval: "month",
        capitalization: true,
        percent: accountData.account.CreditLoanGuiData.PercentPaid,
        payoffStep: 1,
        payoffInterval: "month",
    };
    if (accountData.details)
        res.balance = Math.round((-accountData.details.repaymentAmount + accountData.details.accountBalance) * 100) / 100;
    return res;
}

function getAccountDetails(accountData, type) {
    return {
        type: type,
        accountNumber: accountData && accountData.account.AccountNumber,
        cardNumber: accountData && accountData.account.MainCardNumber,
        contractNumber: accountData && accountData.account.ContractNumber,
    }
}

export function convertTransactions(accountData, transactions) {
    return transactions.map(transaction => {
        const tran = {
            hold: transaction.postingDate === null,
            income: transaction.creditDebitIndicator ? transaction.amount : 0,
            incomeAccount: accountData.account.id,
            outcome: transaction.creditDebitIndicator ? 0 : transaction.amount,
            outcomeAccount: accountData.account.id,
            date: new Date(transaction.valueDate),
            payee: transaction.merchantName,
        };
        if (transaction.creditDebitIndicator)
            tran.comment = transaction.shortDescription;
        if (transaction.mcc)
            tran.mcc = getMcc(transaction.mcc);
        return tran;
    });
}

export function getMcc(code) {
    switch (code) {
        case "CAR":
            return 5542;
        case "HEALTH & BEAUTY":
            return 7298;
        case "FOOD":
            return 5411;
        case "CAFES & RESTAURANTS":
            return 5812;
        case "CLOTHING SHOES & ACCESSORIES":
            return 5651;

        case "HOBBY & LEISURE":
        case "HOME & GARDEN":
        case "TRANSPORTATION":
        case "TELECOMMUNICATION":
        case "OTHER":
            return null;

        default: {
            console.log(">>> Новый МСС код !!!", code);
            return null;
        }
    }
}