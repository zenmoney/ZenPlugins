"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTransaction = exports.convertAccounts = exports.convertAccount = void 0;
const zenmoney_1 = require("../../types/zenmoney");
const get_1 = require("../../types/get");
function convertAccount(account) {
    return {
        id: account.id,
        type: zenmoney_1.AccountType.ccard,
        title: account.name,
        instrument: account.currency,
        syncIds: [account.id]
    };
}
exports.convertAccount = convertAccount;
function convertAccounts(apiAccounts) {
    const accountsByCba = {};
    const accounts = [];
    for (const apiAccount of apiAccounts) {
        const res = convertAccountInternal(apiAccount, accountsByCba);
        if (res != null) {
            accounts.push(res);
        }
    }
    return accounts;
}
exports.convertAccounts = convertAccounts;
function convertAccountInternal(apiAccount, accountsByCba) {
    var _a;
    const cba = apiAccount.id;
    const balance = apiAccount.balance;
    let newAccount = false;
    let account = accountsByCba[cba];
    if (!account) {
        account = {
            products: [],
            account: {
                id: cba,
                type: zenmoney_1.AccountType.ccard,
                title: (_a = apiAccount.name) !== null && _a !== void 0 ? _a : cba,
                instrument: apiAccount.currency,
                balance,
                creditLimit: 0,
                syncIds: [
                    cba
                ]
            }
        };
        accountsByCba[cba] = account;
        newAccount = true;
    }
    account.products.push({
        id: (0, get_1.getString)(apiAccount, 'id'),
        transactionNode: (0, get_1.getString)(apiAccount, 'transactionNode')
    });
    const pan = (0, get_1.getOptString)(apiAccount, 'pan');
    if (pan != null) {
        account.account.syncIds.push(pan);
    }
    const moneyAmount = (0, get_1.getOptNumber)(apiAccount, 'moneyAmount.value');
    if (moneyAmount != null) {
        account.account.creditLimit = moneyAmount - balance;
    }
    return newAccount ? account : null;
}
function convertTransaction(apiTransaction, account) {
    var _a;
    const description = (0, get_1.getOptString)(apiTransaction, 'description');
    const accountAmount = parseAmount(apiTransaction, 'accountAmount');
    const invoice = parseAmount(apiTransaction, 'amount');
    return {
        hold: (0, get_1.getString)(apiTransaction, 'type') !== 'TRANSACTION',
        date: new Date((0, get_1.getString)(apiTransaction, 'operationTime')),
        movements: [
            {
                id: (_a = (0, get_1.getOptString)(apiTransaction, 'id')) !== null && _a !== void 0 ? _a : null,
                account: { id: account.id },
                invoice: accountAmount.instrument === invoice.instrument ? null : invoice,
                sum: accountAmount.sum,
                fee: 0
            }
        ],
        merchant: description != null
            ? {
                fullTitle: description,
                mcc: null,
                location: null
            }
            : null,
        comment: null
    };
}
exports.convertTransaction = convertTransaction;
function parseAmount(data, path) {
    return {
        sum: (0, get_1.getNumber)(data, `${path}.value`),
        instrument: (0, get_1.getString)(data, `${path}.currency.shortName`)
    };
}
