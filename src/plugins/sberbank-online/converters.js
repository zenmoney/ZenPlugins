import * as _ from "lodash";

function getOpAmount(transaction, account) {
    let sum;
    let instrument;
    if (transaction.income && transaction.incomeAccount === account.id) {
        sum = transaction.income;
        instrument = account.instrument;
    } else if (transaction.outcome && transaction.outcomeAccount === account.id) {
        sum = -transaction.outcome;
        instrument = account.instrument;
    } else if (transaction.opIncome) {
        sum = transaction.opIncome;
        instrument = transaction.opIncomeInstrument;
    } else if (transaction.opOutcome) {
        sum = -transaction.opOutcome;
        instrument = transaction.opOutcomeInstrument;
    }
    return {sum, instrument};
}

export function getAccountData(account) {
    const balance = typeof account.balance === "number"
        ? account.balance
        : account.available || null;
    if (balance === null) {
        return null;
    }
    return {
        transactionHashes: {},
        currencyMovements: {},
        balance,
    };
}

export function updateAccountData({transaction, account, currAccountData, prevAccountData}) {
    const {sum, instrument} = getOpAmount(transaction, account);
    const hash = `${transaction.date}_${instrument}_${sum}`;
    if (prevAccountData && prevAccountData.balance !== null) {
        // Our goal is to restore currency transactions. If there is no previous balance then we failed
        if (prevAccountData.transactionHashes[hash]) {
            prevAccountData.transactionHashes[hash]--;
        } else {
            let currencyMovement = currAccountData.currencyMovements[instrument];
            if (currencyMovement) {
                currencyMovement.sum += sum;
                currencyMovement.transactions.push(transaction);
            } else {
                currAccountData.currencyMovements[instrument] = {sum, instrument, transactions: [transaction]};
            }
        }
    }
    if (currAccountData.transactionHashes[hash]) {
        currAccountData.transactionHashes[hash]++;
    } else {
        currAccountData.transactionHashes[hash] = 1;
    }
}

export function restoreCutCurrencyTransactions({account, currAccountData, prevAccountData, transactions}) {
    let delta = currAccountData.balance - prevAccountData.balance;
    const accountCurrencyMovement = currAccountData.currencyMovements[account.instrument];
    if (accountCurrencyMovement) {
        delta -= accountCurrencyMovement.sum;
        delete currAccountData.currencyMovements[account.instrument];
    }

    const instruments = Object.keys(currAccountData.currencyMovements);
    if (instruments.length > 1) {
        return false;
    }
    if (instruments.length === 0) {
        return true;
    }

    const currencyMovement = currAccountData.currencyMovements[instruments[0]];
    if (Math.sign(currencyMovement.sum) !== Math.sign(delta)
            || Math.abs(currencyMovement.sum) < 0.01
            || Math.abs(delta) < 0.01) {
        return false;
    }

    const rate = delta / currencyMovement.sum;
    let i = -1;
    for (const transaction of currencyMovement.transactions) {
        i++;
        if (transaction.opIncome) {
            if (i === currencyMovement.transactions.length - 1) {
                transaction.income = parseDecimal(Math.max(0.01, delta));
            } else {
                transaction.income = parseDecimal(transaction.opIncome * rate);
            }
            delta -= transaction.income;
        } else {
            if (i === currencyMovement.transactions.length - 1) {
                transaction.outcome = parseDecimal(Math.max(0.01, -delta));
            } else {
                transaction.outcome = parseDecimal(transaction.opOutcome * rate);
            }
            delta += transaction.outcome;
        }
        transactions.push(transaction);
    }

    return true;
}

export function isCutCurrencyTransaction(transaction) {
    return transaction.income === null || transaction.outcome === null;
}

export function convertTransaction(json, account) {
    const sum = parseDecimal(json.sum.amount);
    if (Math.abs(sum) < 0.01) {
        return null;
    }
    const transaction = {
        date: parseDate(json.date),
        income: 0,
        incomeAccount: account.id,
        outcome: 0,
        outcomeAccount: account.id,
        comment: json.description || null,
    };
    if (json.sum.currency.code !== account.instrument) {
        if (sum > 0) {
            transaction.income = null;
            transaction.opIncome = sum;
            transaction.opIncomeInstrument = json.sum.currency.code;
        } else {
            transaction.outcome = null;
            transaction.opOutcome = -sum;
            transaction.opOutcomeInstrument = json.sum.currency.code;
        }
    } else {
        if (sum > 0) {
            transaction.income = sum;
        } else {
            transaction.outcome = -sum;
        }
    }
    if (transaction.comment) {
        const opAmount = {
            sum,
            instrument: json.sum.currency.code,
        };
        [
            parseCashWithdrawal,
            parseCashReplenishment,
            parsePayee,
            parseComment,
        ].some(parser => parser(transaction, opAmount));
    }
    return transaction;
}

export function convertAccounts(jsonArray, type) {
    if (type !== "card") {
        const accounts = [];
        for (const json of jsonArray) {
            const zenAccount = type === "account"
                ? json.account.rate && parseDecimal(json.account.rate) > 0
                    ? convertDeposit(json.account, json.details)
                    : convertAccount(json.account, json.details)
                : convertLoan(json.account, json.details);
            if (!zenAccount) {
                continue;
            }
            accounts.push({
                ids: [json.account.id],
                type,
                zenAccount,
            });
        }
        return accounts;
    }
    return convertCards(jsonArray);
}

export function convertCards(jsonArray) {
    jsonArray = _.sortBy(jsonArray,
        json => json.account.mainCardId || json.account.id,
        json => json.account.mainCardId ? 1 : 0);
    const accounts = [];
    for (const json of jsonArray) {
        if (json.account.state !== "active") {
            continue;
        }
        if (json.account.mainCardId) {
            const account = accounts[accounts.length - 1];
            console.assert(account.ids[0] === json.account.mainCardId, `unexpected additional card ${json.account.id}`);
            account.ids.push(json.account.id);
            account.zenAccount.syncID.splice(account.zenAccount.syncID.length - 2, 0, json.account.number);
            continue;
        }
        const zenAccount = {
            id: "card:" + json.account.id,
            type: "ccard",
            title: json.account.name,
            instrument: json.account.availableLimit.currency.code,
            syncID: [json.account.number],
            balance: parseDecimal(json.account.availableLimit.amount),
        };
        if (json.account.type === "credit") {
            const creditLimit = parseDecimal(json.details.detail.creditType.limit.amount);
            if (creditLimit > 0) {
                zenAccount.creditLimit = creditLimit;
                zenAccount.balance = parseDecimal(zenAccount.balance - zenAccount.creditLimit);
            }
        } else if (json.account.cardAccount) {
            zenAccount.syncID.push(json.account.cardAccount);
        }
        accounts.push({
            ids: [json.account.id],
            type: "card",
            zenAccount,
        });
    }
    return accounts;
}

export function convertAccount(json) {
    if (json.state !== "OPENED") {
        return null;
    }
    return {
        id: json.id,
        type: "checking",
        title: json.name,
        instrument: json.balance.currency.code,
        balance: parseDecimal(json.balance.amount),
        syncID: [
            json.number,
        ],
    };
}

export function convertLoan(json, details) {
    const account = {
        id: "loan:" + json.id,
        type: "loan",
        title: json.name,
        instrument: json.amount.currency.code,
        startDate: parseDate(details.detail.termStart),
        startBalance: parseDecimal(json.amount.amount),
        balance: parseDecimal(details.extDetail.remainAmount.amount),
        capitalization: details.detail.repaymentMethod === "аннуитетный",
        percent: parseDecimal(details.extDetail.rate),
        syncID: [
            details.detail.accountNumber,
        ],
        payoffStep: 1,
        payoffInterval: "month",
    };
    parseDuration(details.detail.termDuration, account);
    return account;
}

export function convertDeposit(json, details) {
    const account = {
        id: "account:" + json.id,
        type: "deposit",
        title: json.name,
        instrument: json.balance.currency.code,
        startDate: parseDate(details.detail.open),
        startBalance: 0,
        balance: parseDecimal(json.balance.amount),
        capitalization: true,
        percent: parseDecimal(json.rate),
        syncID: [
            json.number,
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

function parseDecimal(str) {
    if (typeof str === "number") {
        return Math.round(str * 100) / 100;
    }
    const number = Number(str.replace(/\s/g, "").replace(/,/g, "."));
    console.assert(!isNaN(number), "Cannot parse amount", str);
    return number;
}

export function parseDate(str) {
    const parts = str.substring(0, 10).split(".");
    console.assert(parts.length === 3, `unexpected date ${str}`);
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function parseCashWithdrawal(transaction, opAmount) {
    if (transaction.income === 0 && parseDescription(transaction.comment, ["ATM", "ITT"])) {
        transaction.income = -opAmount.sum;
        transaction.incomeAccount = "cash#" + opAmount.instrument;
        transaction.comment = null;
        return true;
    }
    return false;
}

function parseCashReplenishment(transaction, opAmount) {
    if (transaction.outcome === 0
            && parseDescription(transaction.comment, ["Note Acceptance"])) {
        transaction.outcome = opAmount.sum;
        transaction.outcomeAccount = "cash#" + opAmount.instrument;
        transaction.comment = null;
        return true;
    }
    return false;
}

function parsePayee(transaction) {
    const payee = parseDescription(transaction.comment, [
        "Retail", // оплата по карте
        "Unique", // unique
    ]);
    if (payee) {
        transaction.payee = payee;
        transaction.comment = null;
        return true;
    }
    return false;
}

function parseComment(transaction) {
    const comment = parseDescription(transaction.comment, [
        "Credit", // оплата в кредит
        "CH Debit", // поступление
        "CH Payment", // списание
        "BP Billing Transfer", // платёж в Сбербанк Онлайн
        "BP Card - Acct", // дополнительный взнос на вклад
        "BP Acct - Card", // частичное снятие со вклада
    ]);
    if (comment) {
        transaction.comment = comment;
    }
    return false;
}

function parseDescription(description, patterns) {
    for (const pattern of patterns) {
        const pos = description.lastIndexOf(pattern);
        if (pos < 0) {
            continue;
        }
        let str = description.substr(pos + pattern.length).trim();
        if (str.substr(0, 4) === "RUS ") {
            str = str.substr(4).trim();
        }
        return str;
    }
    return null;
}
