import {convertToZenMoneyTransaction} from "../priorbank/mappingUtils";
import _ from "underscore";
import {formatCommentDateTime} from "../../common/dates";
import * as errors from "../../common/errors";
import * as BSB from "./BSB";
import {mergeTransfers} from "./mergeTransfers";
import {generateUUID} from "./utils";

function ensureDeviceId() {
    let deviceId = ZenMoney.getData("deviceId");
    if (!deviceId) {
        deviceId = generateUUID();
        ZenMoney.setData("deviceId", deviceId);
        ZenMoney.saveData();
    }
    return deviceId;
}

async function login() {
    const {username, password} = ZenMoney.getPreferences();
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
        (x) => x.cardTransactionId
    )
        .map((transaction, index, transactions) => {
            const transactionAmount = BSB.getTransactionFactor(transaction) * transaction.transactionAmount;
            const transactionCurrency = transaction.transactionCurrency;
            const accountAmount = transactionCurrency === accountCurrency
                ? transactionAmount
                : BSB.figureOutAccountRestsDelta({transactions, index, accountCurrency});
            if (accountAmount === null) {
                console.error("accountAmount is unknown", {transaction, previousTransactions: transactions.slice(0, index)});
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

export async function scrape({fromDate, toDate}) {
    await login();

    const cards = await BSB.fetchCards();
    const activeCards = cards.filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card)));
    const cardTransactions = await Promise.all(activeCards.map(async (card) => {
        const bsbTransactions = await BSB.fetchTransactions(card.cardId, fromDate, toDate);
        return {card, bsbTransactions};
    }));
    const result = cardTransactions.map(({card, bsbTransactions}) => {
        const account = convertToZenMoneyAccount(card);
        const bankTransactions = normalizeBsbTransactions({
            accountId: account.id,
            accountCurrency: account.instrument,
            bsbTransactions,
        });
        return {account, bankTransactions, transactions: bankTransactions.map((x) => convertToZenMoneyTransaction(account.id, x))};
    });
    return mergeTransfers(result);
}
