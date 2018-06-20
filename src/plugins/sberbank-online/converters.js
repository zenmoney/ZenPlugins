import * as _ from "lodash";
import {toAtLeastTwoDigitsString} from "../../common/dates";

export function parseApiDate(str) {
    const parts = str.substring(0, 10).split(".");
    console.assert(parts.length >= 3, `unexpected date ${str}`);
    let dateStr =`${parts[2]}-${parts[1]}-${parts[0]}`;
    if (str.length > 10) {
        if (dateStr >= "2018-06-16") {
            dateStr += str.substring(10) + "+03:00";
        } else {
            dateStr += str.substring(10);
        }
    }
    const date = new Date(dateStr);
    console.assert(!isNaN(date), `unexpected date ${str}`);
    return date;
}

export function parseApiDescription(description) {
    description = description ? reduceWhitespaces(description) : null;
    if (!description) {
        return {
            description: null,
            payee: null,
        };
    }
    const parts = description.split(" ");
    let j = -1;
    for (let i = 1; 2 * i <= parts.length - 1; i++) {
        const part1 = parts.slice(0, i).join(" ");
        const part2 = parts.slice(i, 2 * i).join(" ");
        if (part1 === part2 && i > j) {
            j = i;
        }
    }
    return {
        description: j >= 0 ? parts.slice(0, j).join(" ") : description,
        payee: j >= 0 ? parts.slice(2 * j).join(" ") : null,
    };
}

export function parsePfmDescription(description) {
    if (description) {
        description = description
            .replace("VKLAD-KAR ", "VKLAD-KARTA   ")
            .replace("KARTA-VKL ", "KARTA-VKLAD   ");
    }
    const commentParts = description ? description.split("   ") : null;
    let payee = null;
    if (commentParts && commentParts.length > 1) {
        payee = reduceWhitespaces(commentParts[0]);
        description = reduceWhitespaces(commentParts.slice(1).join(" "));
    } else {
        description = reduceWhitespaces(description);
    }
    return {
        description: description ? description : null,
        payee: payee ? payee : null,
    };
}

export function convertApiTransaction(apiTransaction, zenAccount) {
    if (!apiTransaction.sum || !apiTransaction.sum.amount) {
        return null;
    }
    const origin = {
        amount: parseDecimal(apiTransaction.sum.amount),
        instrument: apiTransaction.sum.currency.code,
    };
    const transaction = {
        date: parseApiDate(apiTransaction.date),
        hold: null,
        ...parseApiDescription(apiTransaction.description),
    };
    if (origin.instrument === zenAccount.instrument) {
        transaction.posted = origin;
    } else {
        transaction.origin = origin;
    }
    return transaction;
}

export function convertPfmTransaction(pfmTransaction) {
    return {
        id: pfmTransaction.id.toFixed(0),
        date: parseApiDate(pfmTransaction.date),
        hold: false,
        categoryId: pfmTransaction.categoryId,
        ...parsePfmDescription(pfmTransaction.comment),
        merchant: pfmTransaction.merchantInfo ? reduceWhitespaces(pfmTransaction.merchantInfo.merchant) : null,
        location: pfmTransaction.merchantInfo ? pfmTransaction.merchantInfo.location || null : null,
        posted: {
            amount: parseDecimal(pfmTransaction.cardAmount.amount),
            instrument: pfmTransaction.cardAmount.currency,
        },
    };
}

export function convertLoanTransaction(apiTransaction) {
    if (apiTransaction.state !== "paid") {
        return null;
    }
    return {
        date: parseApiDate(apiTransaction.date),
        hold: false,
        posted: {
            amount: parseDecimal(apiTransaction.totalPaymentAmount.amount),
            instrument: apiTransaction.totalPaymentAmount.currency.code,
        },
    };
}

export function convertWebTransaction(webTransaction) {
    return {
        date: parseApiDate(webTransaction.date),
        hold: null,
        ...parseApiDescription(webTransaction.description),
        ...parseWebAmount(webTransaction.amount),
    };
}

export function formatDateSql(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join("-");
}

export function addTransactions(oldTransactions, newTransactions, isWebTransaction) {
    const n = oldTransactions.length;
    let i = 0;
    l: for (const newTransaction of newTransactions) {
        if (!newTransaction) {
            continue;
        }
        if (i < n) {
            for (let j = 0; j < n; j++) {
                const oldTransaction = oldTransactions[j];
                let oldDate;
                let newDate;
                if (isWebTransaction) {
                    oldDate = formatDateSql(oldTransaction.date);
                    newDate = formatDateSql(newTransaction.date);
                } else if (oldTransaction.id) {
                    continue;
                } else {
                    oldDate = oldTransaction.date.getTime();
                    newDate = newTransaction.date.getTime();
                }
                if (oldDate !== newDate
                        || newTransaction.payee !== oldTransaction.payee) {
                    continue;
                }
                if (isWebTransaction && oldTransaction.origin && !oldTransaction.posted
                        && oldTransaction.origin.instrument !== newTransaction.posted.instrument) {
                    oldTransaction.posted = newTransaction.posted;
                    i++;
                    continue l;
                }
                if (!isWebTransaction
                            && ((oldTransaction.posted && oldTransaction.posted.amount === newTransaction.posted.amount)
                            || (!oldTransaction.posted && (newTransaction.posted.instrument !== oldTransaction.origin.instrument
                                 || newTransaction.posted.amount === oldTransaction.origin.amount)))) {
                    let origin = null;
                    if (oldTransaction.origin && newTransaction.posted.instrument !== oldTransaction.origin.instrument) {
                        origin = oldTransaction.origin;
                    }
                    for (const key in oldTransaction) {
                        if (oldTransaction.hasOwnProperty(key)){
                            delete oldTransaction[key];
                        }
                    }
                    Object.assign(oldTransaction, newTransaction);
                    if (origin) {
                        oldTransaction.origin = origin;
                    }
                    i++;
                    continue l;
                }
            }
        }
        if (!isWebTransaction) {
            oldTransactions.push(newTransaction);
        }
    }
}

export function convertToZenMoneyTransaction(account, transaction) {
    const zenMoneyTransaction = {
        date: transaction.date,
        hold: transaction.hold,
        income: transaction.posted ? transaction.posted.amount > 0 ? transaction.posted.amount : 0 : null,
        incomeAccount: account.id,
        outcome: transaction.posted ? transaction.posted.amount < 0 ? -transaction.posted.amount : 0 : null,
        outcomeAccount: account.id,
    };
    if (transaction.id) {
        const origin = transaction.origin || transaction.posted;
        if (origin.amount > 0) {
            zenMoneyTransaction.incomeBankID = transaction.id;
        } else {
            zenMoneyTransaction.outcomeBankID = transaction.id;
        }
    }
    if (transaction.origin) {
        if (transaction.origin.amount > 0) {
            zenMoneyTransaction.outcome = 0;
            zenMoneyTransaction.opIncome = transaction.origin.amount;
            zenMoneyTransaction.opIncomeInstrument = transaction.origin.instrument;
        } else {
            zenMoneyTransaction.income = 0;
            zenMoneyTransaction.opOutcome = -transaction.origin.amount;
            zenMoneyTransaction.opOutcomeInstrument = transaction.origin.instrument;
        }
    }
    if (transaction.location) {
        zenMoneyTransaction.latitude = parseFloat(transaction.location.latitude);
        zenMoneyTransaction.longitude = parseFloat(transaction.location.longitude);
    }
    [
        parseCashTransaction,
        parseInnerTransfer,
        parsePayee,
    ].some(parser => parser(transaction, zenMoneyTransaction));
    return zenMoneyTransaction;
}

export function convertAccounts(apiAccountsArray, type) {
    if (type !== "card") {
        const accounts = [];
        for (const apiAccount of apiAccountsArray) {
            let zenAccount;
            switch (type) {
                case "loan":
                    zenAccount = convertLoan(apiAccount.account, apiAccount.details);
                    break;
                case "target":
                    zenAccount = convertTarget(apiAccount.account, apiAccount.details);
                    break;
                default:
                    zenAccount = apiAccount.account.rate && apiAccount.details.detail.period
                        && parseDecimal(apiAccount.account.rate) > 2
                        ? convertDeposit(apiAccount.account, apiAccount.details)
                        : convertAccount(apiAccount.account, apiAccount.details);
                    break;
            }
            if (!zenAccount) {
                continue;
            }
            accounts.push({
                ids: [apiAccount.account.id],
                type,
                zenAccount,
            });
        }
        return accounts;
    }
    return convertCards(apiAccountsArray);
}

export function toMoscowDate(date) {
    return new Date(date.getTime() + (date.getTimezoneOffset() + 180) * 60000);
}

export function convertTarget(apiTarget, details) {
    throw new Error("convertTarget not implemented");
}

export function convertCards(apiCardsArray, nowDate = new Date()) {
    apiCardsArray = _.sortBy(apiCardsArray,
        json => json.account.mainCardId || json.account.id,
        json => json.account.mainCardId ? 1 : 0);
    const accounts = [];
    const mskDate = toMoscowDate(nowDate);
    const minExpireDate = mskDate.getFullYear() + "-" + toAtLeastTwoDigitsString(mskDate.getMonth() + 1);
    for (const apiCard of apiCardsArray) {
        if (apiCard.account.state !== "active" || parseExpireDate(apiCard.account.expireDate) < minExpireDate) {
            continue;
        }
        if (apiCard.account.mainCardId) {
            const account = accounts[accounts.length - 1];
            console.assert(account.ids[0] === apiCard.account.mainCardId, `unexpected additional card ${apiCard.account.id}`);
            account.ids.push(apiCard.account.id);
            account.zenAccount.syncID.splice(account.zenAccount.syncID.length - 2, 0, apiCard.account.number);
            continue;
        }
        const zenAccount = {
            id: "card:" + apiCard.account.id,
            type: "ccard",
            title: apiCard.account.name,
            instrument: apiCard.account.availableLimit.currency.code,
            syncID: [apiCard.account.number],
            balance: parseDecimal(apiCard.account.availableLimit.amount),
        };
        if (apiCard.account.type === "credit") {
            const creditLimit = parseDecimal(apiCard.details.detail.creditType.limit.amount);
            if (creditLimit > 0) {
                zenAccount.creditLimit = creditLimit;
                zenAccount.balance = parseDecimal(zenAccount.balance - zenAccount.creditLimit);
            }
        } else if (apiCard.account.cardAccount) {
            zenAccount.syncID.push(apiCard.account.cardAccount);
        }
        accounts.push({
            ids: [apiCard.account.id],
            type: "card",
            zenAccount,
        });
    }
    return accounts;
}

export function convertAccount(apiAccount) {
    if (apiAccount.state !== "OPENED") {
        return null;
    }
    return {
        id: apiAccount.id,
        type: "checking",
        title: apiAccount.name,
        instrument: apiAccount.balance.currency.code,
        balance: parseDecimal(apiAccount.balance.amount),
        syncID: [
            apiAccount.number,
        ],
    };
}

export function convertLoan(apiLoan, details) {
    if (!details.extDetail || !details.extDetail.origianlAmount) {
        return null;
    }
    const account = {
        id: "loan:" + apiLoan.id,
        type: "loan",
        title: apiLoan.name,
        instrument: details.extDetail.origianlAmount.currency.code,
        startDate: parseDate(details.detail.termStart),
        startBalance: parseDecimal(apiLoan.amount
            ? apiLoan.amount.amount
            : details.extDetail.origianlAmount.amount),
        balance: -parseDecimal(details.extDetail.remainAmount
            ? details.extDetail.remainAmount.amount
            : details.extDetail.origianlAmount.amount),
        capitalization: details.detail.repaymentMethod === "аннуитетный",
        percent: details.extDetail.rate
            ? parseDecimal(details.extDetail.rate)
            : 1,
        syncID: [
            details.detail.accountNumber,
        ],
        payoffStep: 1,
        payoffInterval: "month",
    };
    parseDuration(details.detail.termDuration, account);
    return account;
}

export function convertDeposit(apiDeposit, details) {
    const account = {
        id: "account:" + apiDeposit.id,
        type: "deposit",
        title: apiDeposit.name,
        instrument: apiDeposit.balance.currency.code,
        startDate: parseDate(details.detail.open),
        startBalance: 0,
        balance: parseDecimal(apiDeposit.balance.amount),
        capitalization: true,
        percent: parseDecimal(apiDeposit.rate),
        syncID: [
            apiDeposit.number,
        ],
        payoffStep: 1,
        payoffInterval: "month",
    };
    parseDuration(details.detail.period, account);
    return account;
}

function parseDuration(duration, account) {
    const parts = duration.split("-").map(parseDecimal);
    console.assert(parts.length === 3, `unexpected duration of account ${account.id}`);
    if (parts[1] === 0 && parts[2] === 0) {
        account.endDateOffsetInterval = "year";
        account.endDateOffset = parts[0];
    } else if (parts[2] === 0) {
        account.endDateOffsetInterval = "month";
        account.endDateOffset = parts[0] * 12 + parts[1];
    } else {
        account.endDateOffsetInterval = "day";
        account.endDateOffset = parts[0] * 365 + parts[1] * 30 + parts[2];
    }
}

export function parseDecimal(str) {
    if (typeof str === "number") {
        return Math.round(str * 100) / 100;
    }
    const number = Number(str.replace(/\s/g, "")
        .replace(/,/g, ".")
        .replace("−", "-")
        .replace("&minus;", "-"));
    console.assert(!isNaN(number), `could not parse decimal ${str}`);
    return number;
}

export function parseDate(str) {
    const parts = str.substring(0, 10).split(".");
    console.assert(parts.length === 3, `unexpected date ${str}`);
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function parseExpireDate(str) {
    const parts = str.split("/");
    console.assert(parts.length === 2 && parts[0].length === 2 && parts[1].length === 4, `unexpected expire date ${str}`);
    return `${parts[1]}-${parts[0]}`;
}

function parseCashTransaction(transaction, zenMoneyTransaction) {
    if (transaction.categoryId) {
        if (transaction.categoryId !== 203 && transaction.categoryId !== 214) {
            return false;
        }
    } else {
        if (!transaction.description
                || !["ATM", "ITT", "Note Acceptance"].some(word => transaction.description.indexOf(word) >= 0)) {
            return false;
        }
    }
    const origin = transaction.origin || transaction.posted;
    if (origin) {
        if (origin.amount > 0) {
            zenMoneyTransaction.outcomeAccount = "cash#" + origin.instrument;
            zenMoneyTransaction.outcome = origin.amount;
        } else {
            zenMoneyTransaction.incomeAccount = "cash#" + origin.instrument;
            zenMoneyTransaction.income = -origin.amount;
        }
    }
    return true;
}

function parseInnerTransfer(transaction, zenMoneyTransaction) {
    //         "Credit", // оплата в кредит
    //         "CH Debit", // поступление
    //         "CH Payment", // списание
    //         "BP Billing Transfer", // платёж в Сбербанк Онлайн
    //         "BP Card - Acct", // дополнительный взнос на вклад
    //         "BP Acct - Card", // частичное снятие со вклада
    if (transaction.categoryId) {
        if (transaction.categoryId !== 1475 && transaction.categoryId !== 1476) {
            return false;
        }
    } else {
        if (!transaction.description
                || ![
                    "BP Card - Acct",
                    "BP Acct - Card",
                    "CH Debit",
                    "CH Payment",
                ].some(word => transaction.description.indexOf(word) >= 0)) {
            return false;
        }
    }
    const origin = transaction.origin || transaction.posted;
    if (transaction.payee) {
        zenMoneyTransaction.comment = transaction.payee;
    }
    zenMoneyTransaction._transferId = `${Math.round(transaction.date.getTime())}_${origin.instrument}_${parseDecimal(Math.abs(origin.amount))}`;
    zenMoneyTransaction._transferType = origin.amount > 0 ? "outcome" : "income";
    return true;
}

function parsePayee(transaction, zenMoneyTransaction) {
    if (transaction.payee) {
        if ([
            "Оплата услуг",
            "Сбербанк Онлайн",
            "SBOL",
            "SBERBANK ONL@IN PLATEZH RU",
        ].indexOf(transaction.payee) >= 0) {
            zenMoneyTransaction.comment = transaction.payee;
        } else {
            zenMoneyTransaction.payee = transaction.merchant || transaction.payee;
        }
    }
}

export function reduceWhitespaces(text) {
    return text.replace(/\s+/g, " ").trim();
}

export function parseWebAmount(text) {
    text = reduceWhitespaces(text);
    const match = text.match(/(.+)\s\((.+)\)/i);
    if (match && match.length === 3) {
        try {
            const res = {
                posted: parseRegularAmount(match[2]),
                origin: parseRegularAmount(match[1]),
            };
            res.posted.amount = res.posted.amount * Math.sign(res.origin.amount);
            return res;
        } catch (e) {
            console.assert(e === null, `could not parse amount ${text}`);
        }
    }
    return {
        posted: parseRegularAmount(text),
    };
}

function parseRegularAmount(text) {
    const i = text.lastIndexOf(" ");
    console.assert(i >= 0 && i < text.length - 1, `could not parse amount ${text}`);
    const amount = parseDecimal(text.substring(0, i));
    console.assert(!isNaN(amount), `could not parse amount ${text}`);
    let instrument = text.substring(i + 1);
    if (instrument === "$") {
        instrument = "USD";
    } else if (instrument === "руб.") {
        instrument = "RUB";
    } else if (instrument === "€") {
        instrument = "EUR";
    }
    return {
        amount,
        instrument,
    };
}
