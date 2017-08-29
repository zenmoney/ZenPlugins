import _ from "underscore";
import * as errors from "../../common/errors";
import {toReadableJson} from "../../common/printing";
import * as BSB from "./BSB";
import {formatCommentDateTime} from "./dateUtils";
import * as utils from "./utils";

function isAccountSkipped(id) { // common cargo cult?
    return ZenMoney.getLevel() >= 13 && ZenMoney.isAccountSkipped(id);
}

function ensureDeviceId() {
    let deviceId = ZenMoney.getData("deviceId");
    if (!deviceId) {
        deviceId = utils.generateUUID();
        ZenMoney.setData("deviceId", deviceId);
        ZenMoney.saveData();
    }
    return deviceId;
}

async function login() {
    const deviceId = ensureDeviceId();
    const prefs = ZenMoney.getPreferences();
    const username = prefs.username;
    const password = prefs.password;
    if (!username || !password) {
        throw errors.fatal("Credentials are missing");
    }

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

function calculateAccountId(card) {
    return card.cardId.toString();
}

function mergeTransferTransactions(transactionsForAccounts) {
    const transactionReplacements = _.chain(transactionsForAccounts)
        .pluck("transfers")
        .flatten()
        .groupBy(_.property("transferId"))
        .reduce(function(transactionReplacements, items, transferId) {
            const transactions = items.map(_.property("transaction"));
            const isNonAmbiguousPair = transactions.length === 2;
            if (isNonAmbiguousPair) {
                const sorted = _.sortBy(transactions, _.property("income"));
                const outcomeTransaction = sorted[0];
                const incomeTransaction = sorted[1];
                transactionReplacements[outcomeTransaction.id] = _.defaults.apply(_, [
                    {
                        incomeBankID: incomeTransaction.id,
                        outcomeBankID: outcomeTransaction.id,
                    },
                    _.omit(incomeTransaction, "id", "outcome", "outcomeAccount"),
                    _.omit(outcomeTransaction, "id", "income", "incomeAccount"),
                ]);
                transactionReplacements[incomeTransaction.id] = null;
            } else {
                ZenMoney.trace(`cannot merge non-pair transfer #${transferId}, groupSize=${items.length}`, "warn");
            }
            return transactionReplacements;
        }, {})
        .value();
    return transactionsForAccounts.map(function(accountTransactions) {
        const transactions = _.compact(accountTransactions.transactions.map(function(transaction) {
            const replacement = transactionReplacements[transaction.id];
            return _.isUndefined(replacement) ? transaction : replacement;
        }));
        return _.defaults({transactions}, accountTransactions);
    });
}

async function processCard(card) {
    const lastFourDigits = card.maskedCardNumber.slice(-4);
    const accountCurrency = BSB.currencyCodeToIsoCurrency(card.currency);
    const account = {
        id: calculateAccountId(card),
        title: card.name,
        type: "ccard",
        syncID: [lastFourDigits],
        instrument: accountCurrency,
        balance: card.amount,
    };

    const lastSeenBsbTransaction = ZenMoney.getData(`lastSeenBsbTransactionFor${account.id}`, {
        cardTransactionId: 0,
        accountRest: 0,
        transactionDate: BSB.bankBirthday.valueOf(),
    });

    const syncFrom = new Date(lastSeenBsbTransaction.transactionDate);
    const syncTo = new Date();

    ZenMoney.trace(
        `fetching transactions for ${toReadableJson({
            accountId: account.id,
            from: syncFrom.toISOString(),
            to: syncTo.toISOString(),
        })}`, "info");

    const bsbTransactions = _.chain(await BSB.getTransactions(card.cardId, syncFrom, syncTo))
        .filter((transaction) => transaction.transactionType !== "Otkaz" &&
        transaction.transactionAmount > 0 &&
        transaction.cardTransactionId > lastSeenBsbTransaction.cardTransactionId)
        .sortBy(_.property("cardTransactionId"))
        .value();
    const newLastSeenBsbTransaction = _.last(bsbTransactions);
    return bsbTransactions
        .reduce(function(result, transaction, index, transactions) {
            const transactionCurrency = transaction.transactionCurrency;
            const isCurrencyConversion = transactionCurrency !== accountCurrency;

            const previousTransaction = index === 0 ? lastSeenBsbTransaction : transactions[index - 1];

            const isAccountRestAbsent = transaction.accountRest === null;
            const accountRestsDelta = isAccountRestAbsent ? null : transaction.accountRest - previousTransaction.accountRest;

            let factor = BSB.transactionTypeFactors[transaction.transactionType];
            if (!factor) {
                if (accountRestsDelta === null) {
                    ZenMoney.trace(`cannot figure out transaction factor (transactionType is unknown, accountRest is missing), ignoring transaction: ${toReadableJson(transaction)}`, "warn");
                    return result;
                } else {
                    factor = Math.sign(accountRestsDelta);
                }
            }
            const transactionDelta = factor * transaction.transactionAmount;
            const isIncome = factor >= 0;

            if (isAccountRestAbsent) {
                if (isCurrencyConversion) {
                    ZenMoney.trace(`cannot figure out transaction delta (is currency conversion, accountRest is missing), ignoring transaction: ${toReadableJson(transaction)}`, "warn");
                    return result;
                }
                transaction.accountRest = previousTransaction.accountRest + transactionDelta;
            }
            const accountDelta = isCurrencyConversion ?
                accountRestsDelta :
                transactionDelta;

            const zenMoneyTransaction = {
                id: transaction.cardTransactionId.toString(),
                date: transaction.transactionDate,
                payee: _.compact([transaction.countryCode, transaction.city, transaction.transactionDetails]).join("/"),
                comment: formatCommentDateTime(new Date(transaction.transactionDate)),
            };
            result.transactions.push(zenMoneyTransaction);

            const absAccountDelta = Math.abs(accountDelta);
            const absTransactionDelta = Math.abs(transactionDelta);

            if (isCurrencyConversion) {
                zenMoneyTransaction.comment += `
${absTransactionDelta.toFixed(2)} ${transactionCurrency}`;
            }

            const isOwnCashTransferTransaction = _.contains(BSB.ownCashTransferTransactionTypes, transaction.transactionType);
            const cashAccountAlias = `cash#${transactionCurrency}`;
            if (isIncome) {
                zenMoneyTransaction.income = absAccountDelta;
                zenMoneyTransaction.incomeAccount = account.id;
                if (isOwnCashTransferTransaction) {
                    zenMoneyTransaction.outcome = absTransactionDelta;
                    zenMoneyTransaction.outcomeAccount = cashAccountAlias;
                } else {
                    zenMoneyTransaction.outcome = 0;
                    zenMoneyTransaction.outcomeAccount = account.id;
                }
            } else {
                zenMoneyTransaction.outcome = absAccountDelta;
                zenMoneyTransaction.outcomeAccount = account.id;
                if (isOwnCashTransferTransaction) {
                    zenMoneyTransaction.income = absTransactionDelta;
                    zenMoneyTransaction.incomeAccount = cashAccountAlias;
                } else {
                    zenMoneyTransaction.income = 0;
                    zenMoneyTransaction.incomeAccount = account.id;
                }
            }

            if (isCurrencyConversion) {
                if (isIncome) {
                    zenMoneyTransaction.opIncome = absTransactionDelta;
                    zenMoneyTransaction.opIncomeInstrument = transactionCurrency;
                } else {
                    zenMoneyTransaction.opOutcome = absTransactionDelta;
                    zenMoneyTransaction.opOutcomeInstrument = transactionCurrency;
                }
            }
            if (transaction.transactionDetails === "PERSON TO PERSON I-B BSB") {
                result.transfers.push({
                    transferId: [
                        transaction.transactionDate, absTransactionDelta,
                        transaction.transactionCurrency
                    ].join("|"),
                    transaction: zenMoneyTransaction,
                });
            }
            return result;
        }, {
            account: account,
            transactions: [],
            transfers: [],
            onBeforeSave: newLastSeenBsbTransaction
                ? function() {
                    const data = _.pick(newLastSeenBsbTransaction, "accountRest", "transactionDate", "cardTransactionId");
                    ZenMoney.setData(`lastSeenBsbTransactionFor${account.id}`, data);
                    ZenMoney.saveData();
                }
                : _.noop,
        });
}

export async function asyncMain() {
    ZenMoney.trace(`started at ${new Date().toISOString()}`, "info");
    await login();

    const cards = await BSB.getCards();
    const activeCards = cards.filter((card) => !isAccountSkipped(calculateAccountId(card)));
    const processedCards = await Promise.all(activeCards.map(processCard));

    mergeTransferTransactions(processedCards)
        .forEach(({account, transactions, onBeforeSave}) => {
            ZenMoney.addAccount(account);
            if (transactions.length) {
                ZenMoney.addTransaction(transactions);
                ZenMoney.trace(`added ${transactions.length} transaction(s) for account ${account.id}`, "info");
            }
            onBeforeSave();
        });
}

export const main = () => asyncMain().then(
    () => ZenMoney.setResult({success: true}),
    (e) => ZenMoney.setResult({
        success: false,
        message: "Unhandled rejection occurred" + (e && e.message ? ": " + e.message : ""),
    })
);
