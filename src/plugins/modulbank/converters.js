export function convertAccount(account) {
    // Расчетный счет
    if (account.category === "CheckingAccount") {
        return {
            id: account.id,
            title: account.accountName,
            syncID: [account.number.substring(account.number.length - 4)],

            instrument: convertCurrencyName(account.currency),
            type: "checking",

            balance: account.balance,
            startBalance: 0,
            creditLimit: 0,

            savings: false,
        }
    }

    // Дебетовая карта
    if (account.category === "CardAccount") {
        return {
            id: account.id,
            title: account.accountName,
            syncID: [account.number.slice(-4)],

            instrument: convertCurrencyName(account.currency),
            type: "ccard",

            balance: account.balance,
            startBalance: 0,
            creditLimit: 0,

            savings: false,
        }
    }

    // Неизвестный тип счета
    console.log(`Cчет ${account.accountName} имеет неподдерживаемый тип ${account.category}`);
    return null;
}

export function convertTransaction(json, accounts) {
    if (json.status !== "Executed" && json.status !== "Received") {
        console.log(`Пропускаем операцию с состоянием '${json.status}'`);
        return null;
    }
    if (json.category !== "Debet" && json.category !== "Credit") {
        console.log(`Пропускаем операцию категории '${json.category}'`);
        return null;
    }

    const syncID = json.bankAccountNumber.slice(-4);
    const account = accounts.find(acc => acc.syncID.indexOf(syncID) !== -1);
    if (!account) {
        console.log(`Пропускаем операцию c неизвестным счетом 'syncID'`);
        return null;
    }
    const transaction = {
        id: json.id,
        payee: json.contragentName ?
            json.contragentName : json.contragentBankAccountNumber,
        date: new Date(json.executed),
        incomeAccount: account.id,
        outcomeAccount: account.id,
    }
    if (json.category === "Debet") {
        transaction.income = json.amountWithCommission || json.amount;
        transaction.opIncomeInstrument = convertCurrencyName(json.currency || account.instrument);
        transaction.outcome = 0;
    } else if (json.category === "Credit") {
        transaction.outcome = json.amountWithCommission || json.amount;
        transaction.opOutcomeInstrument = convertCurrencyName(json.currency || account.instrument);
        transaction.income = 0;
    }
    return transaction;
}

function convertCurrencyName(currency) {
    return currency === "RUR" ? "RUB" : currency;
}
