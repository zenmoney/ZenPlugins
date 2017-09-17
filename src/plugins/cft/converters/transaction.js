/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import {TYPES as TYPE} from "../constants/transactions";
import {entity} from "../zenmoney_entity/transaction";
import * as helper from "./helpers";
import _ from "lodash";

/**
 * @param item
 * @param mapContractToAccount
 * @returns {{id: null, incomeBankID: null, incomeAccount: null, income: number, outcomeBankID: null, outcomeAccount: null, outcome: number, mcc: null, payee: null, date: null, opIncome: undefined, opIncomeInstrument: undefined, opOutcome: undefined, opOutcomeInstrument: undefined, latitude: undefined, longitude: undefined}}
 */
const converter = (item, mapContractToAccount = {}) => {
    const commentLines = [];

    const transaction = entity();
    transaction.id    = item.id.toString();
    transaction.date  = item.date;

    const accountId = resolveAccountId(item, mapContractToAccount);
    const isIncome  = item.money.income;

    if (item.type === TYPE.WALLET) {
        if (isIncome) {
            transaction.income         = item.money.amount;
            transaction.incomeAccount  = helper.walletUniqueAccountId(item.walletId);
            transaction.outcome        = item.money.accountAmount.amount;
            transaction.outcomeAccount = accountId;
        } else {
            transaction.income         = item.money.accountAmount.amount;
            transaction.incomeAccount  = accountId;
            transaction.outcome        = item.money.amount;
            transaction.outcomeAccount = helper.walletUniqueAccountId(item.walletId);
        }
    } else if (item.type === TYPE.ZKDP) { // Перевод «Золотая Корона»
        transaction.outcomeAccount = helper.walletUniqueAccountId(item.walletId);
        transaction.incomeAccount  = 'cash#' + helper.resolveCurrencyCode(item.money.currency);
        transaction.outcome        = item.money.amount;
        transaction.income         = item.money.amount;
    } else {
        let amount   = item.money.amount;
        let currency = item.money.currency;
        if (_.has(item, 'money.amountDetail.amount')) {
            amount = item.money.amountDetail.amount;
        }
        if (_.has(item, 'money.accountAmount')) {
            amount   = item.money.accountAmount.amount;
            currency = item.money.accountAmount.currency;
        }

        transaction.outcomeAccount = accountId;
        transaction.incomeAccount  = accountId;
        if (isIncome) {
            transaction.income = amount;
        } else {
            transaction.outcome = amount;
        }

        /**
         * Операция совершена в валюте отличной от валюты карты
         */
        if (currency !== item.money.currency) {
            if (isIncome) {
                transaction.opIncome           = item.money.amount;
                transaction.opIncomeInstrument = helper.resolveCurrencyCode(item.money.currency);
            } else {
                transaction.opOutcome           = item.money.amount;
                transaction.opOutcomeInstrument = helper.resolveCurrencyCode(item.money.currency);
            }
        }

        if (item.type === TYPE.RECHARGE && isIncome) {
            transaction.outcome = transaction.income;
            if (_.has(item, 'typeName')) {
                transaction.outcomeAccount = item.typeName === 'Пополнение наличными'
                    ? 'cash#' + helper.resolveCurrencyCode(currency)
                    : 'checking#' + helper.resolveCurrencyCode(currency);
            } else {
                transaction.outcomeAccount = item.title.substring(0, 18) === 'Пополнение с карты'
                    ? 'checking#' + helper.resolveCurrencyCode(currency)
                    : 'cash#' + helper.resolveCurrencyCode(currency);
            }
        }

        if (item.type === TYPE.CASH && !isIncome) { // снятие наличных
            transaction.income        = transaction.outcome;
            transaction.incomeAccount = 'cash#' + helper.resolveCurrencyCode(currency);
        }

        if (item.type === TYPE.TRANSFER || item.type === TYPE.FDT_RBS_COMMISSION) {
            if (isIncome) {
                transaction.outcome        = transaction.income;
                transaction.outcomeAccount = 'checking#' + helper.resolveCurrencyCode(currency);
            } else {
                transaction.income        = transaction.outcome;
                transaction.incomeAccount = 'checking#' + helper.resolveCurrencyCode(currency);
            }
        }
    }

    if (item.type !== TYPE.CASH) {
        if (_.has(item, 'paymentDetail.depositBankName')) {
            transaction.payee = item.paymentDetail.depositBankName;
        } else if (_.has(item, 'description')) {
            transaction.payee = item.description;
        }
    }

    if (_.has(item, 'mcc.code')) {
        transaction.mcc = helper.toInteger(item.mcc.code);
    }

    commentLines.push(resolveFirstCommentLine(item));
    if (item.type === TYPE.ZKDP && _.has(item, 'paymentDetail.transferKey')) {
        commentLines.push('Код: ' + item.paymentDetail.transferKey);
    }
    if (item.type === TYPE.FDT_RBS_COMMISSION && _.has(item, 'paymentDetail.payee')) {
        commentLines.push('Получатель: ' + item.paymentDetail.payee);
    }
    if (_.has(item, 'comment')) {
        commentLines.push(item.comment);
    }
    if (commentLines.length > 0) {
        transaction.comment = commentLines.join("\n");
    }

    return transaction;
};

/**
 * @param item
 * @returns {string}
 */
const resolveFirstCommentLine = (item) => {
    let string_1 = '';
    let string_2 = '';

    if (item.type === TYPE.CASH && ('mcc' in item) && ('description' in item.mcc)) {
        string_1 = item.mcc.description;
    } else {
        string_1 = ('typeName' in item) ? item.typeName : '';
    }

    if (item.type === TYPE.CASH && ('description' in item)) {
        string_2 += item.description;
    } else if (item.type === TYPE.FDT_RBS_COMMISSION && ('paymentDetail' in item) && ('payeeBankName' in item.paymentDetail)) {
        string_2 += item.paymentDetail.payeeBankName;
    } else if (item.type === TYPE.DEPOSIT_PROC && ('typeName' in item)) {
        // nothing
    } else {
        string_2 += item.title;
    }

    return string_1 + (string_1.length > 0 && string_2.length > 0 ? ': ' : '') + string_2;
};

/**
 * @param item
 * @param contractToAccount
 * @returns {*}
 */
const resolveAccountId = (item, contractToAccount) => {
    let accountId = null;

    if (_.has(item, 'cardId')) {
        accountId = helper.cardUniqueAccountId(item.cardId);
    } else {
        if (_.has(item, 'contractId') && _.has(contractToAccount, item.contractId)) {
            accountId = contractToAccount[item.contractId];
        }
    }

    return accountId;
};

export {
    converter,
}
