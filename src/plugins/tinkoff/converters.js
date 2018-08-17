import _ from "lodash";

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

export function convertTransaction(transaction, accountId) {
    const tran = {};

    // дата привязана к часовому поясу Москвы
    const dt = new Date(transaction.operationTime.milliseconds + (180 + new Date().getTimezoneOffset()) * 60000);
    tran.date = dt.getFullYear() + "-" + n2(dt.getMonth() + 1) + "-" + n2(dt.getDate());
    tran.time = n2(dt.getHours()) + ":" + n2(dt.getMinutes() + 1) + ":" + n2(dt.getSeconds()); // для внутреннего использования
    tran.created = transaction.operationTime.milliseconds;

    // Внутренний ID операции
    /*const tranId = transaction.payment && transaction.payment.paymentId
        // если есть paymentId, объединяем по нему, отделяя комиссии от переводов
        ? (transaction.group === "CHARGE" ? "f" : "p") + transaction.payment.paymentId
        // либо работаем просто как с операциями, разделяя их на доходы и расходы
        : transaction.id;*/

    // отделяем акцепт от холда временем дебетового списания
    tran.id = transaction.debitingTime ? transaction.id : "tmp#" + transaction.id;
    tran.hold = !transaction.debitingTime;

    // флаг операции в валюте
    const foreignCurrency = transaction.accountAmount.currency.name !== transaction.amount.currency.name;

    // mcc-код операции
    let mcc = transaction.mcc ? parseInt(transaction.mcc, 10) : -1;
    if (!mcc) mcc = -1;

    // флаг card2card переводов
    const c2c = [6538, 6012].indexOf(mcc) >= 0;

    // доход -------------------------------------------------------------------------
    if (transaction.type === "Credit") {
        tran.income = transaction.accountAmount.value;
        tran.incomeAccount = accountId;
        tran.outcome = 0;
        tran.outcomeAccount = tran.incomeAccount;

        if (transaction.group) {
            switch (transaction.group) {
                // пополнение наличными
                case "CASH":
                    if (!c2c) {
                        // операция с наличными
                        tran.outcomeAccount = "cash#" + transaction.amount.currency.name;
                        tran.outcome = transaction.amount.value;
                    } else
                    // card2card-перевод
                    if (transaction.payment && transaction.payment.cardNumber) {
                        tran.outcomeAccount = "ccard#" + transaction.amount.currency.name + "#" + transaction.payment.cardNumber.substring(transaction.payment.cardNumber.length - 4);
                        tran.outcome = transaction.amount.value;
                        tran.hold = null;
                    }
                    break;

                case "INCOME":
                    if (c2c && transaction.payment && transaction.payment.cardNumber && transaction.payment.cardNumber.length > 4) {
                        tran.comment = transaction.description;
                        tran.outcome = transaction.amount.value;
                        tran.outcomeAccount = "ccard#" + transaction.amount.currency.name + "#" + transaction.payment.cardNumber.substring(transaction.payment.cardNumber.length - 4);
                    } else if (transaction.senderDetails)
                        tran.payee = transaction.senderDetails;
                    break;

                // Если совсем ничего не подошло
                default:
                    if (transaction.subgroup) {
                        switch (transaction.subgroup.id) {
                            // перевод от другого клиента банка
                            case "C4":
                                tran.payee = transaction.description;
                                break;
                            default:
                                break;
                        }
                    }

                    if (!tran.payee) {
                        if (transaction.operationPaymentType === "TEMPLATE")
                            tran.comment = transaction.description; // наименование шаблона
                        else {
                            tran.comment = "";
                            if (transaction.merchant)
                                tran.comment = transaction.merchant.name + ": ";
                            tran.comment += transaction.description;
                        }
                    } else {
                        // если получатель определился, то нет необходимости писать его и в комментарии
                        if (transaction.merchant)
                            tran.comment = transaction.merchant.name;
                    }
            }
        } else {
            tran.comment = "";
            if (transaction.merchant)
                tran.comment = transaction.merchant.name + ": ";
            tran.comment += transaction.description;
        }

        // операция в валюте
        if (foreignCurrency) {
            tran.opIncome = transaction.amount.value;
            tran.opIncomeInstrument = transaction.amount.currency.name;
        }
    } else
    // расход -----------------------------------------------------------------
    if (transaction.type === "Debit") {
        tran.outcome = transaction.accountAmount.value;
        tran.outcomeAccount = accountId;
        tran.income = 0;
        tran.incomeAccount = tran.outcomeAccount;

        if (transaction.group) {
            switch (transaction.group) {
                // Снятие наличных
                case "CASH":
                    if (!c2c) {
                        // операция с наличными
                        tran.incomeAccount = "cash#" + transaction.amount.currency.name;
                        tran.income = transaction.amount.value;
                    } else
                    // card2card-перевод
                    if (transaction.payment && transaction.payment.cardNumber) {
                        tran.incomeAccount = "ccard#" + transaction.amount.currency.name + "#" + transaction.payment.cardNumber.substring(transaction.payment.cardNumber.length - 4);
                        tran.income = transaction.amount.value;
                    }
                    break;

                // Перевод
                case "TRANSFER":
                    if (transaction.payment && transaction.payment.fieldsValues) {
                        if (transaction.payment.fieldsValues.addressee)
                            tran.payee = transaction.payment.fieldsValues.addressee;
                        else if (transaction.payment.fieldsValues.lastName)
                            tran.payee = transaction.payment.fieldsValues.lastName;
                    }

                    if (transaction.operationPaymentType === "TEMPLATE")
                        tran.comment = transaction.description; // наименование шаблона
                    else {
                        tran.comment = "";
                        if (transaction.merchant)
                            tran.comment = transaction.merchant.name + ": ";
                        tran.comment += transaction.description;
                    }
                    break;

                // Плата за обслуживание
                case "CHARGE":
                    tran.comment = transaction.description;
                    break;

                // Платеж
                case "PAY":
                    if (transaction.operationPaymentType && transaction.operationPaymentType === "REGULAR") {
                        tran.payee = transaction.brand ? transaction.brand.name : transaction.description;
                    } else {
                        tran.payee = transaction.merchant ? transaction.merchant.name : transaction.description;
                    }

                    // MCC
                    if (mcc > 99) {
                        tran.mcc = mcc; // у Тинькова mcc-коды используются для своих нужд
                    }

                    break;

                // Если совсем ничего не подошло
                default:
                    tran.comment = transaction.description;
            }
        }

        // операция в валюте
        if (foreignCurrency) {
            tran.opOutcome = transaction.amount.value;
            tran.opOutcomeInstrument = transaction.amount.currency.name;
        }

        // местоположение
        if (transaction.locations && _.isArray(transaction.locations) && transaction.locations.length > 0) {
            tran.latitude = transaction.locations[0].latitude;
            tran.longitude = transaction.locations[0].longitude;
        }
    }

    var hold = tran.hold ? " [H] " : "";
    console.log(`>>> Добавляем операцию: ${tran.date}, ${tran.time}, ${hold}${transaction.description}, ${transaction.type === "Credit" ? "+" : (transaction.type === "Debit" ? "-" : "")}${transaction.accountAmount.value}`);

    return tran;
}

export function convertTransactionToTransfer(tranId, tran1, tran2) {
    // доходная часть перевода ---
    if (tran2.income > 0 && tran1.income == 0 && tran1.incomeAccount != tran2.incomeAccount) {
        tran1.income = tran2.income;
        tran1.incomeAccount = tran2.incomeAccount;
        if (tran2.opOutcome) tran1.opOutcome = tran2.opOutcome;
        if (tran2.opOutcomeInstrument) tran1.opOutcomeInstrument = tran2.opOutcomeInstrument;

        tran1.incomeBankID = tran2.id;
        tran1.outcomeBankID = tran1.id;
        delete tran1.id;

    } else
    // расходная часть перевода ----
    if (tran2.outcome > 0 && tran1.outcome == 0 && tran1.outcomeAccount != tran2.outcomeAccount) {
        tran1.outcome = tran2.outcome;
        tran1.outcomeAccount = tran2.outcomeAccount;
        if (tran2.opOutcome) tran1.opOutcome = tran2.opOutcome;
        if (tran2.opOutcomeInstrument) tran1.opOutcomeInstrument = tran2.opOutcomeInstrument;

        // при объединении в перевод всегда берём комментарий из расходной части
        tran1.comment = tran2.comment;

        tran1.incomeBankID = tran1.id;
        tran1.outcomeBankID = tran2.id;
        delete tran1.id;
    }
    if (tran1.payee) delete tran1.payee; // в переводах получателя нет
    console.log(">>> Объединили операцию в перевод с имеющейся ID " + tranId);
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

function n2(n) {
    return n < 10 ? "0" + n : String(n);
}
