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
            transaction.income = i === currencyMovement.transactions.length - 1
                ? parseDecimal(Math.max(0.01, delta))
                : parseDecimal(transaction.opIncome * rate);
            delta -= transaction.income;
        } else {
            transaction.outcome = i === currencyMovement.transactions.length - 1
                ? parseDecimal(Math.max(0.01, -delta))
                : parseDecimal(transaction.opOutcome * rate);
            delta += transaction.outcome;
        }
        transactions.push(transaction);
    }

    return true;
}

export function isRestoredCurrencyTransaction(transaction) {
    return transaction.incomeAccount === transaction.outcomeAccount && transaction.opIncome || transaction.opOutcome;
}

export function isCutCurrencyTransaction(transaction) {
    return transaction.income === null || transaction.outcome === null;
}

export function convertLoanTransaction(apiTransaction, account) {
    if (apiTransaction.state !== "paid") {
        return null;
    }
    return {
        date: parseDate(apiTransaction.date),
        income: parseDecimal(apiTransaction.totalPaymentAmount.amount),
        incomeAccount: account.id,
        outcome: 0,
        outcomeAccount: account.id,
    };
}

export function convertWebTransaction(webTransaction, account) {
    return getTransaction({
        account,
        date: webTransaction.date,
        description: webTransaction.description,
        ...parseAmount(webTransaction.amount),
    });
}

export function convertTransaction(apiTransaction, account) {
    if (apiTransaction.description === "Капитализация вклада") {
        return null;
    }
    const opAmount = {
        sum: parseDecimal(apiTransaction.sum.amount),
        instrument: apiTransaction.sum.currency.code,
    };
    const amount = opAmount.instrument === account.instrument ? opAmount : null;
    return getTransaction({
        account,
        date: apiTransaction.date,
        description: apiTransaction.description,
        opAmount,
        amount,
    });
}

function getTransaction({account, date, opAmount, amount, description}) {
    if (Math.abs(opAmount.sum) < 0.01) {
        return null;
    }
    const transaction = {
        date: parseDate(date),
        income: 0,
        incomeAccount: account.id,
        outcome: 0,
        outcomeAccount: account.id,
        comment: description || null,
    };
    if (!amount || opAmount.instrument !== amount.instrument) {
        if (opAmount.sum > 0) {
            transaction.income = amount ? amount.sum : null;
            transaction.opIncome = opAmount.sum;
            transaction.opIncomeInstrument = opAmount.instrument;
        } else {
            transaction.outcome = amount ? -amount.sum : null;
            transaction.opOutcome = -opAmount.sum;
            transaction.opOutcomeInstrument = opAmount.instrument;
        }
    } else {
        if (opAmount.sum > 0) {
            transaction.income = opAmount.sum;
        } else {
            transaction.outcome = -opAmount.sum;
        }
    }
    if (transaction.comment) {
        [
            parseCashWithdrawal,
            parseCashReplenishment,
            parsePayee,
            parseComment,
        ].some(parser => parser(transaction, opAmount));
    }
    return transaction;
}

export function convertAccounts(apiAccountsArray, type) {
    if (type !== "card") {
        const accounts = [];
        for (const apiAccount of apiAccountsArray) {
            const zenAccount = type === "account"
                ? apiAccount.account.rate && parseDecimal(apiAccount.account.rate) > 0.01
                    ? convertDeposit(apiAccount.account, apiAccount.details)
                    : convertAccount(apiAccount.account, apiAccount.details)
                : convertLoan(apiAccount.account, apiAccount.details);
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

export function convertCards(apiCardsArray) {
    apiCardsArray = _.sortBy(apiCardsArray,
        json => json.account.mainCardId || json.account.id,
        json => json.account.mainCardId ? 1 : 0);
    const accounts = [];
    for (const apiCard of apiCardsArray) {
        if (apiCard.account.state !== "active") {
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
    const account = {
        id: "loan:" + apiLoan.id,
        type: "loan",
        title: apiLoan.name,
        instrument: apiLoan.amount.currency.code,
        startDate: parseDate(details.detail.termStart),
        startBalance: parseDecimal(apiLoan.amount.amount),
        balance: -parseDecimal(details.extDetail.remainAmount.amount),
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

function parseDecimal(str) {
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
    } else if (["Частичная выдача", "Дополнительный взнос"].indexOf(transaction.comment) >= 0) {
        transaction.comment = null;
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

export function reduceWhitespaces(text) {
    return text.replace(/\s+/g, " ").trim();
}

export function parseAmount(text) {
    text = reduceWhitespaces(text);
    const match = text.match(/(.+)\s\((.+)\)/i);
    if (match && match.length === 3) {
        try {
            const res = {
                amount: parseRegularAmount(match[2]),
                opAmount: parseRegularAmount(match[1]),
            };
            res.amount.sum = res.amount.sum * Math.sign(res.opAmount.sum);
            return res;
        } catch (e) {
            console.assert(e === null, `could not parse amount ${text}`);
        }
    }
    const amount = parseRegularAmount(text);
    return {
        amount,
        opAmount: amount,
    };
}

function parseRegularAmount(text) {
    const i = text.lastIndexOf(" ");
    console.assert(i >= 0 && i < text.length - 1, `could not parse amount ${text}`);
    const sum = parseDecimal(text.substring(0, i));
    console.assert(!isNaN(sum), `could not parse amount ${text}`);
    return {
        sum,
        instrument: text.substring(i + 1),
    };
}
