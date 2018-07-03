import * as _ from "lodash";
import {parseDecimal} from "../sberbank-online/converters";

export function convertAccounts(apiPortfolios) {
    const accounts = [];
    apiPortfolios.forEach(portfolio => {
        portfolio.productGroups.forEach(product => {
            console.assert(product.mainProduct, "unexpected product", product);
            let converter = null;
            let apiAccount = product.mainProduct;
            switch (portfolio.id) {
                case "CARDS":
                    if (apiAccount.__type === "ru.vtb24.mobilebanking.protocol.product.MasterAccountMto") {
                        converter = convertAccount;
                    } else if (apiAccount.__type === "ru.vtb24.mobilebanking.protocol.product.CreditCardMto"
                            && apiAccount.cardAccount
                            && apiAccount.cardAccount.__type === "ru.vtb24.mobilebanking.protocol.product.CreditCardAccountMto") {
                        converter = convertAccount;
                        apiAccount = {
                            ...apiAccount.cardAccount,
                            masterAccountCards: [{
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
        id: apiAccount.id,
        syncID: [],
    };
    let amount = apiAccount.amount;
    if (apiAccount.masterAccountCards && apiAccount.masterAccountCards.length > 0) {
        zenAccount.type = "ccard";
        zenAccount.title = apiAccount.masterAccountCards[0].name;
        if (apiAccount.masterAccountCards[0].balance) {
            amount = {
                sum: apiAccount.masterAccountCards[0].balance.amountSum,
                currency: apiAccount.masterAccountCards[0].baseCurrency,
            };
        }
        apiAccount.masterAccountCards.forEach(card => {
            zenAccount.syncID.push(card.number.replace(/X/g, "*"));
        });
    } else {
        zenAccount.type = "checking";
        zenAccount.title = apiAccount.name;
    }
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
    return {
        id: apiAccount.id,
        type: apiAccount.__type,
        zenAccount,
    };
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
    if (apiTransaction.transactionAmount.sum < 0) {
        transaction.outcome = -apiTransaction.transactionAmount.sum;
    } else {
        transaction.income = apiTransaction.transactionAmount.sum;
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
    if (![
        "Зачисление с другой карты (Р2Р)",
        "Перевод на другую карту (Р2Р)",
    ].some(pattern => apiTransaction.details.indexOf(pattern) >= 0)) {
        return false;
    }
    const origin = getOrigin(apiTransaction);
    transaction._transferType = origin.amount > 0 ? "outcome" : "income";
    transaction._transferId = `${Math.round(transaction.date.getTime())}_${origin.instrument}_${parseDecimal(Math.abs(origin.amount))}`;
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
        /Карта \*\d{4} (.+)/,
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
    transaction.payee = apiTransaction.details;
    return false;
}

function getInstrument(code) {
    return code === "RUR" ? "RUB" : code;
}

function getOrigin(apiTransaction) {
    return {
        amount: apiTransaction.transactionAmount.sum,
        instrument: getInstrument(apiTransaction.transactionAmount.currency.currencyCode),
    };
}
