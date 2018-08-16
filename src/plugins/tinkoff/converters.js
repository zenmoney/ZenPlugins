export function convertAccount(account, initialized) {
    switch(account.accountType){
        case "Current": return getDebitCard(account, initialized); // дебетовые карты
        case "Credit": return getCreditCard(account, initialized); // кредитные карты
        case "Saving": return getSavingAccount(account); // накопительные счета
        case "Deposit": return getDepositAccount(account); // вклады
        case "MultiDeposit": return getMultiDepositAccount(account); // мультивалютные вклады
        case "CashLoan": return getCashLoan(account); // кредиты наличными
        case "KupiVKredit": return getKupiVKreditAccount(account); // потребительские кредиты
        case "Wallet": return getWalletAccount(account); // виртуальные карты
        case "Telecom": return getTelecomAccount(account); // телеком-карта
        case "ExternalAccount": // внешние счета сторонних банков, например
            return null;
        default: {
            console.log(`>>> !!! Новый счёт с типом '${account.accountType}':`, account);
            return null;
        }
    }
}

function getDebitCard(account, initialized) {
    if (account.status !== "NORM") return null;
    const result = {
        id: account.id,
        title: account.name,
        type: "ccard",
        syncID: [],
        instrument: account.moneyAmount.currency.name,
    };

    // овердрафт
    const creditLimit = account.creditLimit ? account.creditLimit.value : 0;
    if (creditLimit > 0) result.creditLimit = creditLimit;

    // контроль точности расчёта остатка
    if (!initialized || parseDecimal(account.moneyAmount.value) === parseDecimal(account.accountBalance.value - account.authorizationsAmount.value))
        result.balance = parseDecimal(account.moneyAmount.value - creditLimit);

    console.log(">>> Добавляем дебетовую карту: "+ account.name +" (#"+ account.id +") = "+ (result.balance !== null ? result.balance +" "+ result.instrument : "undefined"));

    // номера карт
    for (let k = 0; k < account.cardNumbers.length; k++) {
        const card = account.cardNumbers[k];
        if (card.activated)
            result.syncID.push(card.value.substring(card.value.length - 4))
    }
    // добавим и номер счёта карты
    result.syncID.push(account.id.substring(account.id.length - 4));

    return result;
}

function getCreditCard(account, initialized) {
    if (account.status !== "NORM") return null;
    const result = {
        id: account.id,
        title: account.name,
        type: "ccard",
        syncID: [],
        creditLimit: account.creditLimit.value,
        instrument: account.moneyAmount.currency.name,
    };

    let algorithm = "";
    // A1: перерасход кредитного лимита
    if (parseDecimal(account.moneyAmount.value) === 0) {
        result.balance = -account.debtAmount.value;
        algorithm = "A1";
    } else
    // A3: нет долга перед банком
    if (account.moneyAmount.value > account.creditLimit.value) {
        result.balance = account.moneyAmount.value - account.creditLimit.value;
        algorithm = "A3";
    } else
    // A2: нет долга перед банком
    if (account.moneyAmount.value - account.authorizationsAmount.value > account.creditLimit.value) {
        result.balance = parseDecimal(account.moneyAmount.value - account.creditLimit.value - account.authorizationsAmount.value);
        algorithm = "A2";
    } else
    // контроль точности расчёта остатка
    if (!initialized || parseDecimal(account.moneyAmount.value) === parseDecimal(account.creditLimit.value - account.debtAmount.value - account.authorizationsAmount.value)) {
        result.balance = parseDecimal(account.creditLimit.value > account.moneyAmount.value
            ? -account.debtAmount.value - account.authorizationsAmount.value
            : account.moneyAmount.value - account.creditLimit.value - account.authorizationsAmount.value);
        algorithm = "B";
    } else {
        // доверимся данным банка
        result.balance = account.moneyAmount.value - account.creditLimit.value;
        algorithm = "C";
    }

    console.log(">>> Добавляем кредитную карту: " + account.name + " (#" + account.id + ") = "+ result.balance +" "+ result.instrument +" ["+ algorithm +"]");

    // номера карт
    for (let k = 0; k < account.cardNumbers.length; k++) {
        const card = account.cardNumbers[k];
        if (card.activated)
            result.syncID.push(card.value.substring(card.value.length - 4))
    }
    // добавим и номер счёта карты
    result.syncID.push(account.id.substring(account.id.length - 4));

    return result;
}

function getSavingAccount(account){
    if (account.status !== "NORM") return null;
    console.log(">>> Добавляем накопительный счёт: "+ account.name +" (#"+ account.id +") = "+ account.moneyAmount.value +" "+ account.moneyAmount.currency.name);
    return {
        id: account.id,
        title: account.name,
        type: "checking",
        syncID: account.id.substring(account.id.length-4),
        instrument: account.moneyAmount.currency.name,
        balance: account.moneyAmount.value,
        savings: true,
    };
}

function getDepositAccount(account){
    if (account.status !== "ACTIVE") return null;
    console.log(">>> Добавляем депозит: "+ account.name +" (#"+ account.id +") = "+ account.moneyAmount.value +" "+ account.moneyAmount.currency.name);
    return {
        id: account.id,
        title: account.name,
        type: "deposit",
        syncID: account.id.substring(account.id.length-4),
        instrument: account.moneyAmount.currency.name,
        balance: account.moneyAmount.value,
        percent: account.depositRate,
        capitalization:	account.typeOfInterest === "TO_DEPOSIT",
        startDate: account.openDate.milliseconds,
        endDateOffsetInterval: "month",
        endDateOffset:	account.period,
        payoffInterval:	"month",
        payoffStep: 1,
    };
}

function getMultiDepositAccount(account){
    if (!account.accounts) return null;
    const accDict = [];
    for (let k=0; k<account.accounts.length; k++) {
        const deposit = account.accounts[k];
        const currency = deposit.moneyAmount.currency.name;
        const name = account.name + " (" + currency + ")";
        const id = account.id + "_" + currency;
        const syncid = account.id.substring(account.id.length - 4) + "_" + currency;
        console.log(">>> Добавляем мультивалютный вклад: "+ name +" (#"+ id +") = "+ deposit.moneyAmount.value +" "+ deposit.moneyAmount.currency.name);
        accDict.push({
            id: id,
            title: name,
            type: "deposit",
            syncID: syncid,
            instrument: deposit.moneyAmount.currency.name,
            balance: deposit.moneyAmount.value,
            percent: deposit.depositRate,
            capitalization:	deposit.typeOfInterest === "TO_DEPOSIT",
            startDate: account.openDate.milliseconds,
            endDateOffsetInterval: "month",
            endDateOffset:	account.period,
            payoffInterval:	"month",
            payoffStep: 1,
        });
    }
    return accDict;
}

function getCashLoan(account){
    if (account.status !== "NORM") return null;
    if (account.debtAmount.value <= 0) {
        console.log(">>> Пропускаем кредит наличными " + account.name + " (#" + account.id + "), так как он уже закрыт");
        return null;
    }

    console.log(">>> Добавляем кредит наличными: " + account.name + " (#" + account.id + ") = -" + account.debtAmount.value + " " + account.debtAmount.currency.name);
    return {
        id: account.id,
        title: account.name,
        type: "loan",
        syncID: account.id.substring(account.id.length - 4),
        instrument: account.debtAmount.currency.name,
        balance: account.debtAmount.value,
        startBalance: account.creditAmount.value,
        startDate: account.creationDate.milliseconds,
        percent: account.tariffInfo.interestRate,
        capitalization: true,
        endDateOffsetInterval: "month",
        endDateOffset: account.remainingPaymentsCount,
        payoffInterval: "month",
        payoffStep: 1,
    };
}

function getKupiVKreditAccount(account){
    if (!account.creditAccounts) return null;
    const accDict = [];
    for (let j=0; j<account.creditAccounts.length; j++) {
        const vkredit = account.creditAccounts[j];
        console.log(">>> Добавляем потребительский кредит: " + vkredit.name + " (#" + vkredit.account + ") = " + vkredit.balance.value + " " + vkredit.balance.currency.name);
        accDict.push({
            id: vkredit.account,
            title: vkredit.name,
            type: "loan",
            syncID: vkredit.account.substring(account.id.length-4),
            instrument: vkredit.balance.currency.name,
            balance: vkredit.balance.value,
            startBalance: vkredit.amount.value,
            startDate: Date.now(), // ToDO: нужно разобраться как достать параметры потребительского кредита
            percent: 1,
            capitalization:	true,
            endDateOffsetInterval: "month",
            endDateOffset:	1,
            payoffInterval:	"month",
            payoffStep: 1,
        });
    }
    return accDict;
}

function getWalletAccount(account){
    if (account.status !== "NORM") return null;
    const result = {
        id: account.id,
        title: account.name,
        type: "ccard",
        syncID: [],
        instrument: account.moneyAmount.currency.name,
        balance: account.moneyAmount.value,
    };
    console.log(">>> Добавляем виртуальную карту: "+ account.name +" (#"+ account.id +") = "+ result.balance +" "+ result.instrument);

    // номера карт
    for (let k = 0; k < account.cardNumbers.length; k++) {
        const card = account.cardNumbers[k];
        if (card.activated)
            result.syncID.push(card.value.substring(card.value.length - 4))
    }
    // добавим и номер счёта карты
    result.syncID.push(account.id.substring(account.id.length - 4));

    return result;
}

function getTelecomAccount(account){
    if (account.status !== "NORM") return null;
    const result = {
        id: account.id,
        title: account.name,
        type: "ccard",
        syncID: [],
        instrument: account.moneyAmount.currency.name,
        balance: account.moneyAmount.value,
    };
    console.log(">>> Добавляем телеком-карту: "+ account.name +" (#"+ account.id +") = "+ result.balance +" "+ result.instrument);

    // номера карт
    for (let k = 0; k < account.cardNumbers.length; k++) {
        const card = account.cardNumbers[k];
        if (card.activated)
            result.syncID.push(card.value.substring(card.value.length - 4))
    }
    // добавим и номер счёта карты
    result.syncID.push(account.id.substring(account.id.length - 4));

    return result;
}

function parseDecimal(str) {
    return Number(str.toFixed(2).replace(/\s/g, "").replace(/,/g, "."));
}