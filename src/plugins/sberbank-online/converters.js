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
    description = description ? description : null;
    const result = {description, payee: null};
    if (!description) {
        return result;
    }
    for (const parser of [
        {getPosition: (p, i, n) => p * i},
        {getPosition: (p, i, n) => p === 0 ? 0 : n - i, isDuplicatePayee: true},
    ]) {
        const parts = parseDuplicates(description, parser.getPosition);
        if (parts) {
            result.payee = parser.isDuplicatePayee ? parts.duplicate : parts.rest;
            result.description = parser.isDuplicatePayee ? parts.rest : parts.duplicate;
            break;
        }
    }
    return result;
}

function parseDuplicates(str, getPosition) {
    let j = -1;
    let j1;
    let j2;
    let duplicate;

    const parts = str.split(" ");

    for (let i = 1; 2 * i <= parts.length; i++) {
        let i1 = getPosition(0, i, parts.length);
        let i2 = getPosition(1, i, parts.length);
        if (i2 < i1) {
            const k = i1;
            i1 = i2;
            i2 = k;
        }
        if (i1 >= 0 && i1 < i && i2 >= 0 && i2 + i <= parts.length) {
            const part1 = parts.slice(i1, i).join(" ");
            const part2 = parts.slice(i2, i2 + i).join(" ");
            if (part1 === part2 && i > j) {
                j = i;
                j1 = i1;
                j2 = i2;
                duplicate = part1;
            }
        }
    }

    if (j >= 0) {
        // Ensure that the rest is continuous and doesn't have gaps
        if (j1 === 0) {
            if (j2 === j) {
                return {
                    duplicate,
                    rest: j2 + j < parts.length ? parts.slice(j2 + j).join(" ") : null,
                };
            } else if (j2 === parts.length - j) {
                return {
                    duplicate,
                    rest: j1 + j < j2 ? parts.slice(j1 + j, j2).join(" ") : null,
                };
            }
        } else {
            if (j2 === j1 + j && j2 + j === parts.length) {
                return {
                    duplicate,
                    rest: j1 > 0 ? parts.slice(0, j1).join(" ") : null,
                };
            }
        }
    }

    return null;
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
                if (isWebTransaction) {
                    const oldDate = formatDateSql(oldTransaction.date);
                    const newDate = formatDateSql(newTransaction.date);
                    if (oldDate !== newDate) {
                        continue;
                    }
                } else if (oldTransaction.id) {
                    continue;
                } else {
                    const oldDate = oldTransaction.date.getTime();
                    const newDate = newTransaction.date.getTime();
                    if (Math.abs(oldDate - newDate) > 60000) {
                        continue;
                    }
                }
                if (newTransaction.payee !== oldTransaction.payee) {
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
            let account;
            switch (type) {
                case "loan":
                    account = convertLoan(apiAccount.account, apiAccount.details);
                    break;
                case "target":
                    account = convertTarget(apiAccount.account, apiAccount.details);
                    break;
                default:
                    account = apiAccount.account.rate && apiAccount.details.detail.period
                        && parseDecimal(apiAccount.account.rate) > 2
                        ? convertDeposit(apiAccount.account, apiAccount.details)
                        : convertAccount(apiAccount.account, apiAccount.details);
                    break;
            }
            if (!account) {
                continue;
            }
            accounts.push(account);
        }
        return accounts;
    }
    return convertCards(apiAccountsArray);
}

export function toMoscowDate(date) {
    return new Date(date.getTime() + (date.getTimezoneOffset() + 180) * 60000);
}

export function convertTarget(apiTarget, details) {
    if (apiTarget.status === "accountDisabled") {
        return null;
    }
    return {
        ids: [apiTarget.account.id],
        type: "account",
        zenAccount: {
            id: "account:" + apiTarget.account.id,
            type: "checking",
            title: apiTarget.comment || apiTarget.name,
            instrument: apiTarget.account.value.currency.code,
            balance: parseDecimal(apiTarget.account.value.amount),
            savings: true,
            syncID: [
                apiTarget.id,
            ],
        },
    };
}

export function convertCards(apiCardsArray, nowDate = new Date()) {
    apiCardsArray = _.sortBy(apiCardsArray,
        json => json.account.mainCardId || json.account.id,
        json => json.account.mainCardId ? 1 : 0);
    const accounts = [];
    const mskDate = toMoscowDate(nowDate);
    const minExpireDate = mskDate.getFullYear() + "-" + toAtLeastTwoDigitsString(mskDate.getMonth() + 1);
    for (const apiCard of apiCardsArray) {
        if (apiCard.account.state !== "active"
                || apiCard.account.statusWay4 !== "+-КАРТОЧКА ОТКРЫТА"
                || parseExpireDate(apiCard.account.expireDate) < minExpireDate) {
            continue;
        }
        if (apiCard.account.mainCardId) {
            const account = accounts[accounts.length - 1];
            console.assert(account.ids[0] === apiCard.account.mainCardId, `unexpected additional card ${apiCard.account.id}`);
            account.ids.push(apiCard.account.id);
            account.zenAccount.syncID.splice(account.zenAccount.syncID.length - 2, 0,
                removeWhitespaces(apiCard.account.number));
            continue;
        }
        const zenAccount = {
            id: "card:" + apiCard.account.id,
            type: "ccard",
            title: apiCard.account.name,
            instrument: apiCard.account.availableLimit.currency.code,
            syncID: [removeWhitespaces(apiCard.account.number)],
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
        ids: [apiAccount.id],
        type: "account",
        zenAccount: {
            id: "account:" + apiAccount.id,
            type: "checking",
            title: apiAccount.name,
            instrument: apiAccount.balance.currency.code,
            balance: parseDecimal(apiAccount.balance.amount),
            savings: apiAccount.rate && parseDecimal(apiAccount.rate) >= 1,
            syncID: [
                apiAccount.number,
            ],
        },
    };
}

export function convertLoan(apiLoan, details) {
    if (!details.extDetail || !details.extDetail.origianlAmount) {
        return null;
    }
    const zenAccount = {
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
    parseDuration(details.detail.termDuration, zenAccount);
    return {
        ids: [apiLoan.id],
        type: "loan",
        zenAccount,
    };
}

export function convertDeposit(apiDeposit, details) {
    const zenAccount = {
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
    parseDuration(details.detail.period, zenAccount);
    return {
        ids: [apiDeposit.id],
        type: "account",
        zenAccount,
    };
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
            "Mobile Fee",
            "Payment To",
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

export function removeWhitespaces(text) {
    return text.replace(/\s+/g, "").trim();
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
