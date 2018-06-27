import _ from "lodash";
import {formatCommentDateTime} from "../../common/dates";
import * as errors from "../../common/errors";
import {generateUUID} from "../../common/utils";
import * as BSB from "./BSB";
import {convertToZenMoneyTransaction} from "./mappingUtils";
import {getTransactionToTransferReplacements} from "./mergeTransfers";

function ensureDeviceId() {
    let deviceId = ZenMoney.getData("deviceId");
    if (!deviceId) {
        deviceId = generateUUID();
        ZenMoney.setData("deviceId", deviceId);
        ZenMoney.saveData();
    }
    return deviceId;
}

async function login({username, password}) {
    const deviceId = ensureDeviceId();
    const authStatus = await BSB.authorize(username, password, deviceId);
    switch (authStatus.userStatus) {
        case "WAITING_CONFIRMATION":
        case "SMS_WAS_SENT":
            const prompt = "Для доступа к банку Вам надо ввести код, который был выслан на ваш телефон СМС сообщением.";
            const retrievedInput = ZenMoney.retrieveCode(prompt, null, {
                inputType: "numberDecimal",
                time: 18E4,
            });

            if (!/^\d+$/.test(retrievedInput)) {
                throw errors.temporal("Numeric SMS code was expected.");
            }

            const confirmationCode = Number(retrievedInput);
            await BSB.confirm(deviceId, confirmationCode);
            break;
        case "OK":
            break;
        default:
            throw errors.temporal(`auth userStatus is ${authStatus.userStatus}`);
    }
}

const calculateAccountId = (card) => card.cardId.toString();

function convertToZenMoneyAccount(card) {
    return {
        id: calculateAccountId(card),
        title: card.name,
        type: "ccard",
        syncID: [card.maskedCardNumber.slice(-4)],
        instrument: BSB.currencyCodeToIsoCurrency(card.currency),
        balance: card.amount,
    };
}

function normalizeBsbTransactions({accountCurrency, bsbTransactions}) {
    return _.sortBy(
        bsbTransactions.filter((transaction) => !BSB.isRejectedTransaction(transaction) && transaction.transactionAmount > 0),
        (x) => x.cardTransactionId,
    )
        .map((transaction, index, transactions) => {
            const transactionAmount = BSB.getTransactionFactor(transaction) * transaction.transactionAmount;
            const transactionCurrency = transaction.transactionCurrency;
            const accountAmount = transactionCurrency === accountCurrency
                ? transactionAmount
                : BSB.figureOutAccountRestsDelta({transactions, index, accountCurrency});
            if (accountAmount === null) {
                console.error("accountAmount is unknown, ignored transaction", {transaction, previousTransactions: transactions.slice(0, index)});
                return null;
            }
            const transactionDate = new Date(transaction.transactionDate);
            return {
                transactionId: transaction.cardTransactionId,
                transactionDate,
                transactionCurrency,
                transactionAmount,
                accountCurrency,
                accountAmount,
                payee: _.compact([transaction.countryCode, transaction.city, transaction.transactionDetails]).join(" "),
                comment: formatCommentDateTime(transactionDate),
                isCashTransfer: BSB.isCashTransferTransaction(transaction),
                isElectronicTransfer: BSB.isElectronicTransferTransaction(transaction),
            };
        })
        .filter(Boolean);
}

export async function scrape({preferences: {username, password}, fromDate, toDate}) {
    let cardsResponse = await BSB.fetchCards();
    if (cardsResponse.status === 401) {
        await login({username, password});
        cardsResponse = await BSB.fetchCards();
    }
    BSB.assertResponseSuccess(cardsResponse);
    const accounts = cardsResponse.body
        .filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card)))
        .map((card) => convertToZenMoneyAccount(card));
    const transactionPairs = _.flatten(await Promise.all(accounts.map(async (account) => {
        const bankTransactions = normalizeBsbTransactions({
            accountCurrency: account.instrument,
            bsbTransactions: await BSB.fetchTransactions(account.id, fromDate, toDate),
        });
        const zenTransactions = bankTransactions.map((x) => convertToZenMoneyTransaction(account.id, x));
        return _.zip(bankTransactions, zenTransactions);
    })));
    const transactionToTransferReplacements = getTransactionToTransferReplacements(transactionPairs);
    return {
        accounts,
        transactions: _.compact(transactionPairs.map(([bankTransaction, zenTransaction]) => {
            const replacement = transactionToTransferReplacements[zenTransaction.id];
            return _.isUndefined(replacement) ? zenTransaction : replacement;
        })),
    };
}
