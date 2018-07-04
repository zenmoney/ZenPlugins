import * as _ from "lodash";
import {parseDecimal} from "../sberbank-online/converters";

export function convertAccounts(apiPortfolios) {
    const accounts = [];
    apiPortfolios.forEach(portfolio => {
        portfolio.productGroups.forEach(product => {
            let converter = null;
            let apiAccount = product.products && product.products.length === 1 && product.products[0]
                ? product.products[0]
                : product.mainProduct;
            switch (portfolio.id) {
                case "CARDS":
                    const types = [
                        {card: "CreditCardMto", account: "CreditCardAccountMto"},
                        {card: "DebitCardMto", account: "DebitCardAccountMto"},
                        {card: "MasterAccountCardMto", account: "MasterAccountMto"},
                    ];
                    if (types.some(type => {
                        return apiAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.account}`;
                    })) {
                        apiAccount.cards = apiAccount.cards || null;
                        converter = convertAccount;
                    } else if (apiAccount.cardAccount && types.some(type => {
                        return apiAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.card}`
                            && apiAccount.cardAccount.__type === `ru.vtb24.mobilebanking.protocol.product.${type.account}`;
                    })) {
                        converter = convertAccount;
                        apiAccount = {
                            ...apiAccount.cardAccount,
                            cards: [{
                                ..._.omit(apiAccount, "cardAccount"),
                                cardAccount: null,
                            }],
                        };
                    }
                    break;
                case "SAVINGS":
                case "ACCOUNTS":
                    converter = convertAccount;
                    break;
                case "LOANS":
                    if (apiAccount.__type === "ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto"
                            && apiAccount.account
                            && apiAccount.account.__type === "ru.vtb24.mobilebanking.protocol.product.LoanAccountMto") {
                        converter = convertAccount;
                        apiAccount = {
                            ...apiAccount.account,
                            contract: {
                                ..._.omit(apiAccount, "account"),
                                account: null,
                            },
                        };
                    } else if (apiAccount.__type === "ru.vtb24.mobilebanking.protocol.product.LoanContractMto"
                            && apiAccount.account
                            && apiAccount.account.__type === "ru.vtb24.mobilebanking.protocol.product.LoanAccountMto") {
                        converter = convertLoan;
                    }
                    break;
                default:
                    break;
            }
            console.assert(converter, `unsupported portfolio ${portfolio.id} object ${apiAccount.id}`);
            const account = converter(apiAccount);
            if (account) {
                accounts.push(account);
            }
        });
    });
    return accounts;
}

export function convertAccount(apiAccount) {
    const zenAccount = {
        syncID: [],
    };
    const account = {
        id: apiAccount.id,
        type: apiAccount.__type,
        zenAccount,
    };
    let amount = apiAccount.amount;
    if (apiAccount.cards && apiAccount.cards.filter(card => Boolean(card)).length > 0) {
        const cards = apiAccount.cards.filter(card => {
            return card && card.status.id === "ACTIVE" && !card.archived;
        });
        if (cards.length === 0) {
            return null;
        }
        zenAccount.type = "ccard";
        zenAccount.title = cards[0].name;
        if (cards[0].balance) {
            amount = {
                sum: cards[0].balance.amountSum,
                currency: cards[0].baseCurrency,
            };
        }
        cards.forEach(card => {
            if (card.number) {
                zenAccount.syncID.push(card.number.replace(/X/g, "*"));
            }
        });
        if (cards.length === 1 && cards[0].__type === "ru.vtb24.mobilebanking.protocol.product.CreditCardMto") {
            account.id = cards[0].id;
            account.type = cards[0].__type;
        }
    } else {
        zenAccount.type = "checking";
        zenAccount.title = apiAccount.name;
        if (apiAccount.contract
                && apiAccount.contract.__type === "ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto") {
            account.id = apiAccount.contract.id;
            account.type = apiAccount.contract.__type;
        }
    }
    zenAccount.id = account.id;
    zenAccount.balance = amount.sum;
    zenAccount.instrument = getInstrument(amount.currency.currencyCode);
    const accountSyncId = apiAccount.number.replace(/X/g, "*");
    if (zenAccount.syncID.indexOf(accountSyncId) < 0) {
        zenAccount.syncID.push(accountSyncId);
    }
    if (typeof apiAccount.creditLimit === "number") {
        zenAccount.creditLimit = apiAccount.creditLimit;
    }
    if ([
        "ru.vtb24.mobilebanking.protocol.product.SavingsAccountMto",
        "ru.vtb24.mobilebanking.protocol.product.InvestmentAccountMto",
    ].indexOf(apiAccount.__type) >= 0) {
        zenAccount.savings = true;
    }
    return account;
}

export function convertLoan(apiAccount) {
    const zenAccount = {
        type: "loan",
        title: apiAccount.name,
        instrument: getInstrument(apiAccount.creditSum.currency.currencyCode),
        startDate: apiAccount.openDate,
        startBalance: apiAccount.creditSum.sum,
        balance: -apiAccount.account.amount.sum,
        percent: 1,
        capitalization: true,
        payoffInterval: "month",
        payoffStep: 1,
        syncID: [apiAccount.account.number],
    };
    const contractPeriod = apiAccount.contractPeriod || apiAccount.account.contract.contractPeriod;
    switch (contractPeriod.unit.id.toLowerCase()) {
        case "month":
        case "year":
            zenAccount.endDateOffsetInterval = contractPeriod.unit.id.toLowerCase();
            zenAccount.endDateOffset = contractPeriod.value;
            break;
        default:
            console.assert(false, `unsupported loan contract period ${contractPeriod.unit.id}`);
    }
    const account = {
        id: apiAccount.id,
        type: apiAccount.__type,
        zenAccount,
    };
    zenAccount.id = account.id;
    return account;
}

export function convertTransaction(apiTransaction, zenAccount) {
    const transaction = {
        income: 0,
        incomeAccount: zenAccount.id,
        outcome: 0,
        outcomeAccount: zenAccount.id,
        date: apiTransaction.transactionDate,
        hold: apiTransaction.isHold,
    };
    const origin = getOrigin(apiTransaction);
    if (origin.amount < 0) {
        transaction.outcome = -origin.amount;
    } else {
        transaction.income = origin.amount;
    }
    if (apiTransaction.details) {
        [
            parseInnerTransfer,
            parseCashTransaction,
            parsePayee,
        ].some(parser => parser(apiTransaction, transaction));
    }
    return transaction;
}

function parseInnerTransfer(apiTransaction, transaction) {
    const origin = getOrigin(apiTransaction);
    if (![
        /Зачисление с другой карты \(Р2Р\)/,
        /Перевод на другую карту \(Р2Р\)/,
        /^Перевод на счет \*(\d{4})/,
        /^Зачисление со счета \*(\d{4})/,
        /^Зачисление с накопительного счета \*(\d{4})/,
        /^Перевод между собственными счетами и картами/,
    ].some(pattern => {
        const match = apiTransaction.details.match(pattern);
        if (match && match[1]) {
            if (origin.amount > 0) {
                transaction.outcomeAccount = "ccard#" + origin.instrument + "#" + match[1];
                transaction.outcome = origin.amount;
            } else {
                transaction.incomeAccount = "ccard#" + origin.instrument + "#" + match[1];
                transaction.income = -origin.amount;
            }
        }
        return Boolean(match);
    })) {
        return false;
    }
    transaction._transferType = origin.amount > 0 ? "outcome" : "income";
    transaction._transferId = Math.round(apiTransaction.processedDate.getTime());
    return true;
}

function parseCashTransaction(apiTransaction, transaction) {
    if (![
        "Снятие в банкомате",
    ].some(pattern => apiTransaction.details.indexOf(pattern) >= 0)) {
        return false;
    }
    const origin = getOrigin(apiTransaction);
    if (origin.amount > 0) {
        transaction.outcomeAccount = "cash#" + origin.instrument;
        transaction.outcome = origin.amount;
    } else {
        transaction.incomeAccount = "cash#" + origin.instrument;
        transaction.income = -origin.amount;
    }
    return true;
}

function parsePayee(apiTransaction, transaction) {
    if ([
        /^Карта \*\d{4} (.+)/,
        /^(.\*\*\*\*\*\*. .+)/,
    ].some(pattern => {
        const match = apiTransaction.details.match(pattern);
        if (match) {
            transaction.payee = match[1];
            return true;
        }
        return false;
    })) {
        return false;
    }
    transaction.comment = apiTransaction.details;
    return false;
}

function getInstrument(code) {
    return code === "RUR" ? "RUB" : code;
}

function getOrigin(apiTransaction) {
    const transactionAmount = apiTransaction.transactionAmountInAccountCurrency || apiTransaction.transactionAmount;
    return {
        amount: transactionAmount.sum,
        instrument: getInstrument(transactionAmount.currency.currencyCode),
    };
}
