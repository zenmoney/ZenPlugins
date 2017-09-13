import _ from "underscore";
import {formatCommentDateTime} from "../../common/dates";
import * as errors from "../../common/errors";
import {convertToZenMoneyTransaction} from "../priorbank/mappingUtils";
import * as BSB from "./BSB";
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

function mergeTransferTransactions(accountTransactions, isTransferTransaction) {
    const transfers = _.flatten(accountTransactions.map(({transactions}) => {
        return transactions
            .filter(isTransferTransaction)
            .map((transaction) => {
                return {
                    transferId: [
                        transaction.transactionDate,
                        Math.max(transaction.income, transaction.outcome),
                        transaction.transactionCurrency,
                    ].join("|"),
                    transaction,
                };
            });

    }));
    const transfersGroupedByTransferId = _.groupBy(transfers, (x) => x.transferId);
    const replacements = _.reduce(transfersGroupedByTransferId, (memo, transfers, transferId) => {
        const transactions = transfers.map((x) => x.transaction);
        const isNonAmbiguousPair = transactions.length === 2;
        if (isNonAmbiguousPair) {
            const [outcomeTransaction, incomeTransaction] = _.sortBy(transactions, (x) => x.income);
            memo[outcomeTransaction.id] = _.defaults(...[
                {
                    incomeBankID: incomeTransaction.id,
                    outcomeBankID: outcomeTransaction.id,
                },
                _.omit(incomeTransaction, "id", "outcome", "outcomeAccount"),
                _.omit(outcomeTransaction, "id", "income", "incomeAccount"),
            ]);
            memo[incomeTransaction.id] = null;
        } else {
            console.warn("cannot merge non-pair transfer", {transferId, groupSize: transfers.length});
        }
        return memo;
    }, {});
    return accountTransactions.map(({account, transactions}) => {
        return {
            account,
            transactions: _.compact(transactions.map(function(transaction) {
                const replacement = replacements[transaction.id];
                return _.isUndefined(replacement) ? transaction : replacement;
            })),
        };
    });
}

function processCard(card, bsbTransactions) {
    const lastFourDigits = card.maskedCardNumber.slice(-4);
    const accountCurrency = BSB.currencyCodeToIsoCurrency(card.currency);
    const accountId = calculateAccountId(card);
    const account = {
        id: accountId,
        title: card.name,
        type: "ccard",
        syncID: [lastFourDigits],
        instrument: accountCurrency,
        balance: card.amount,
    };
    const transactions = _.sortBy(
        bsbTransactions.filter((transaction) => !BSB.isRejectedTransaction(transaction) && transaction.transactionAmount > 0),
        (x) => x.cardTransactionId
    )
        .map(function(transaction, index, transactions) {
            const transactionCurrency = transaction.transactionCurrency;
            const isCurrencyConversion = transactionCurrency !== accountCurrency;

            const previousAccountRest = index === 0 ? 0 : transactions[index - 1].accountRest;
            const accountAmount = transaction.accountRest === null ? null : transaction.accountRest - previousAccountRest;

            let factor = BSB.getTransactionFactor(transaction);
            if (factor === null) {
                if (accountAmount === null) {
                    console.error("cannot figure out transaction factor (transactionType is unknown, accountRest is missing), ignoring transaction:", transaction);
                    return null;
                } else {
                    factor = Math.sign(accountAmount);
                }
            }
            const transactionAmount = factor * transaction.transactionAmount;

            if (transaction.accountRest === null) {
                if (isCurrencyConversion) {
                    console.error("cannot figure out transaction delta (is currency conversion, accountRest is missing), ignoring transaction:", transaction);
                    return null;
                }
                transaction.accountRest = previousAccountRest + transactionAmount;
            }
            const transactionDate = new Date(transaction.transactionDate);
            return convertToZenMoneyTransaction(accountId, {
                transactionId: transaction.cardTransactionId.toString(),
                transactionDate,
                transactionCurrency,
                transactionAmount,
                accountCurrency,
                accountAmount: isCurrencyConversion ? accountAmount : transactionAmount,
                payee: _.compact([transaction.countryCode, transaction.city, transaction.transactionDetails]).join(" "),
                comment: formatCommentDateTime(transactionDate),
                isCashTransfer: BSB.isOwnCashTransferTransaction(transaction),
            });
        })
        .filter(Boolean);
    return {account, transactions};
}

export async function scrape({fromDate, toDate}) {
    await login();

    const cards = await BSB.fetchCards();
    const activeCards = cards.filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card)));

    const processedCards = await Promise.all(activeCards.map(async (card) => {
        const bsbTransactions = await BSB.fetchTransactions(card.cardId, fromDate, toDate);
        return processCard(card, bsbTransactions);
    }));
    return mergeTransferTransactions(
        processedCards,
        (transaction) => transaction.payee.endsWith("PERSON TO PERSON I-B BSB")
    );
}
