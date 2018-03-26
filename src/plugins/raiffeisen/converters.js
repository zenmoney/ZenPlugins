import _ from "lodash";

export function convertAccounts(jsonArray) {
    const accounts = {};
    for (const json of jsonArray) {
        const account = convertAccount(json);
        if (account) {
            Object.assign(accounts, account);
        }
    }
    return accounts;
}

export function convertAccount(json) {
    if (!json.account || !json.account.id) {
        return null;
    }
    const accounts = {};
    const account  = {
        id: "ACCOUNT_" + json.account.id,
        type: "checking",
        instrument: json.account.currency.shortName,
        balance:    json.balance,
        syncID: []
    };
    accounts[account.id] = account;
    if (json.cards && json.cards.length > 0) {
        account.type = "ccard";
        for (const card of json.cards) {
            accounts["CARD_" + card.id] = account;
            account.syncID.push(card.pan);
            if (card.main.id === 1) {
                account.title = card.product;
            }
        }
    }
    if (json.account.cba) {
        account.syncID.push(json.account.cba);
    }
    if (!account.title) {
        account.title = "*" + account.syncID[0].slice(-4);
    }
    return accounts;
}

export function convertCards(jsonArray, accounts = {}) {
    const cards = {};
    for (const json of jsonArray) {
        if (!json.account) {
            continue;
        }
        const syncID = json.pan;
        const accountId = "ACCOUNT_" + json.account.id;
        const account   = accounts[accountId] || cards[accountId] || {syncID: []};
        account.type = "ccard";
        cards["CARD_" + json.id] = account;
        cards[accountId] = account;
        if (account.syncID.indexOf(syncID) < 0) {
            account.syncID.splice(Math.max(0, account.syncID.length - 1), 0, syncID);
        }
        if (account.id || json.main.id !== 1) {
            continue;
        }
        account.id = accountId;
        account.instrument = json.currency.shortName;
        account.title      = json.product;
        if (json.cba) {
            account.syncID.push(json.cba);
        }
        if (json.type.id === 2) {
            account.available = json.balance;
        } else {
            account.balance = json.balance;
        }
    }
    return cards;
}

export function convertDepositsWithTransactions(jsonArray) {
    const accounts     = {};
    const transactions = [];
    for (const json of jsonArray) {
        if (!json.deals || !json.deals.length) {
            continue;
        }
        let deposit = null;
        for (const deal of json.deals) {
            if (!deposit) {
                deposit = {
                    id: "DEPOSIT_ID_" + json.id,
                    type: "deposit",
                    title: json.product.name.name,
                    instrument: deal.currency.shortName,
                    syncID: [json.number],
                    startBalance:   deal.startAmount,
                    percent:        deal.rate,
                    startDate:      deal.open.substring(0, 10),
                    endDateOffset:  deal.duration,
                    endDateOffsetInterval: "day",
                    capitalization: json.capital,
                    payoffStep:     json.frequency ? 1 : 0,
                    payoffInterval: json.frequency ? json.frequency.id === "Y" ? "year" : "month" : null
                };
                accounts[deposit.id] = deposit;
            }
            accounts["DEPOSIT_" + deal.id] = deposit;
            deposit.balance = deal.currentAmount;
            transactions.push({
                income: deal.startAmount,
                incomeAccount: deposit.id,
                outcome: 0,
                outcomeAccount: deposit.id,
                date: deal.open.substring(0, 10),
                hold: false
            });
        }
    }
    return {accounts: accounts, transactions: transactions};
}

export function convertLoans(jsonArray) {
    const loans = {};
    for (const json of jsonArray) {
        const loan = convertLoan(json);
        if (loan) {
            loans[loan.id] = loan;
        }
    }
    return loans;
}

export function convertLoan(json) {
    if (!json.docNumber) {
        return null;
    }
    const startDate  = new Date(json.open.substr(0, 10)).getTime() / 1000;
    const endDate    = new Date(json.close.substr(0, 10)).getTime() / 1000;
    const dateOffset = Math.round((endDate - startDate) / (30 * 24 * 60 * 60));
    const loan = {
        id: "LOAN_" + json.docNumber,
        instrument: json.currency.shortName,
        syncID: [json.docNumber],
        balance: -json.leftDebt,
        type: "loan",
        percent: json.rate,
        startDate: startDate,
        endDateOffset: dateOffset,
        endDateOffsetInterval: "month",
        capitalization: true,
        payoffStep: 1,
        payoffInterval: "month"
    };
    loan.title = "*" + loan.syncID[0].slice(-4);
    return loan;
}

export function convertTransactions(jsonArray) {
    const transactions = [];
    let prevJson = null;
    for (const json of jsonArray) {
        if (prevJson && _.isEqual(prevJson, json)) {
            continue;
        }
        prevJson = json;
        const transaction = convertTransaction(json);
        if (transaction) {
            transactions.push(transaction);
        }
    }
    return transactions;
}

export function convertLoanTransaction(json) {
    return {
        date: json.date.substring(0, 10),
        hold: false,
        comment: json.relatedDescription.name,
        income:         json.amount > 0 ? json.amount : 0,
        incomeAccount:  json.relation + "_" + json.relatedName.name,
        outcome:        json.amount < 0 ? -json.amount : 0,
        outcomeAccount: json.relation + "_" + json.relatedName.name
    };
}

export function convertDepositTransaction(json) {
    return {
        date: json.date.substring(0, 10),
        hold: false,
        comment: json.relatedDescription.name,
        income:         json.amount > 0 ? json.amount : 0,
        incomeAccount:  json.relation + "_" + json.relatedId,
        outcome:        json.amount < 0 ? -json.amount : 0,
        outcomeAccount: json.relation + "_" + json.relatedId
    };
}

export function convertTransaction(json) {
    if (json.relation === "LOAN") {
        return convertLoanTransaction(json);
    }
    if (json.relation === "DEPOSIT") {
        return convertDepositTransaction(json);
    }

    const transaction = {
        date: json.date.substring(0, 10),
        hold: json.type !== "TRANSACTION",
        income:         json.billAmount > 0 ? json.billAmount : 0,
        incomeAccount:  json.relation + "_" + json.relatedId,
        outcome:        json.billAmount < 0 ? -json.billAmount : 0,
        outcomeAccount: json.relation + "_" + json.relatedId
    };
    if (json.currencyId !== json.billCurrencyId) {
        if (json.amount > 0) {
            transaction.opIncome = json.amount;
            transaction.opIncomeInstrument = json.currency.shortName;
        } else if (json.amount < 0) {
            transaction.opOutcome = -json.amount;
            transaction.opOutcomeInstrument = json.currency.shortName;
        }
    }
    const payee = json.merchant ? json.merchant.trim() : null;
    if (payee) {
        transaction.payee = payee;
    }
    if (json.note && (!transaction.payee || json.note.indexOf(transaction.payee) < 0)) {
        transaction.comment = json.note;
    }
    if (json.parentCategoryId === 13) {
        transaction.payee = null;
        if (transaction.outcome > 0) {
            transaction.incomeAccount = "cash#" + json.currency.shortName;
            transaction.income = -json.amount;
        } else {
            transaction.outcomeAccount = "cash#" + json.currency.shortName;
            transaction.outcome = json.amount;
        }
    }
    return transaction;
}
