import _ from "lodash";
import {InvalidPreferencesError, TemporaryError, ZPAPIError} from "../errors";
import {isValidDate} from "./dates";
import {sanitize} from "./sanitize";

const MS_IN_MINUTE = 60 * 1000;
const MS_IN_DAY = 24 * 60 * MS_IN_MINUTE;
const MS_IN_WEEK = 7 * MS_IN_DAY;

const unsealSyncPromise = (promise) => {
    let state = "pending";
    let value = null;
    promise.then(
        resolveValue => {
            state = "resolved";
            value = resolveValue;
        },
        rejectValue => {
            state = "rejected";
            value = rejectValue;
        },
    );
    return {state, value};
};

const manualDateInputRegExp = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/;

export const parseStartDateString = (startDateString) => {
    const manualDateInputMatch = startDateString.match(manualDateInputRegExp);
    if (manualDateInputMatch) {
        const [, dayString, monthString, yearString] = manualDateInputMatch;
        return new Date(Number(yearString.length === 2 ? "20" + yearString : yearString), Number(monthString) - 1, Number(dayString), 0, 0, 0);
    }
    const dateWithoutTimezoneMatch = startDateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateWithoutTimezoneMatch) {
        const [, yearString, monthString, dayString] = dateWithoutTimezoneMatch;
        return new Date(Number(yearString), Number(monthString) - 1, Number(dayString), 0, 0, 0);
    }
    return new Date(startDateString);
};

const calculateFromDate = (startDateString) => {
    console.assert(startDateString, `preferences must contain "startDate"`);
    const startDate = parseStartDateString(startDateString);
    console.assert(isValidDate(startDate), {startDateString}, "is not a valid date");
    const lastSuccessDateString = ZenMoney.getData("scrape/lastSuccessDate");
    if (lastSuccessDateString) {
        const lastSuccessDate = new Date(lastSuccessDateString);
        console.assert(isValidDate(lastSuccessDate), {lastSuccessDateString}, "is not a valid date");
        return new Date(Math.max(lastSuccessDate.getTime() - MS_IN_WEEK, startDate.getTime()));
    }
    return startDate;
};

export function provideScrapeDates(fn) {
    console.assert(typeof fn === "function", "provideScrapeDates argument should be a function");

    return function scrapeWithDates(args) {
        const successAttemptDate = new Date().toISOString();
        const scrapeResult = fn({
            ...args,
            preferences: _.omit(args.preferences, ["startDate"]),
            fromDate: calculateFromDate(args.preferences.startDate),
            toDate: null,
        });
        return scrapeResult.then((x) => {
            ZenMoney.setData("scrape/lastSuccessDate", successAttemptDate);
            ZenMoney.saveData();
            return x;
        });
    };
}

export function assertAccountIdsAreUnique(accounts) {
    _.toPairs(_.countBy(accounts, (x) => x.id))
        .filter(([id, count]) => count > 1)
        .forEach(([id, count]) => {
            throw new Error(`There are ${count} accounts with the same id=${id}`);
        });
    return accounts;
}

export function convertTimestampToDate(timestamp) {
    // used mobile interpreter implementation as a reference
    const millis = timestamp < 10000000000
        ? timestamp * 1000
        : timestamp;
    return new Date(millis);
}

export function fixDateTimezones(transaction) {
    if (ZenMoney.features.dateProcessing) {
        return transaction;
    }
    let date = (typeof transaction.date === "number")
        ? convertTimestampToDate(transaction.date)
        : transaction.date;
    if (!(date instanceof Date)) {
        return transaction;
    }
    return {
        ...transaction,
        date: new Date(date.valueOf() - date.getTimezoneOffset() * MS_IN_MINUTE),
        created: date,
    };
}

function castTransactionDatesToTicks(transactions) {
    // temporal fix for j2v8 on android 6: Date objects marshalling is broken
    if (ZenMoney.features.j2v8Date) {
        return transactions;
    }
    return transactions.map((transaction) => transaction.date instanceof Date
        ? {...transaction, date: transaction.date.getTime()}
        : transaction);
}

function getPresentationError(error) {
    const meaningfulError = error && error.message
        ? error
        : new Error("Thrown error must be an object containing message field, but was: " + JSON.stringify(error));
    if (meaningfulError instanceof ZPAPIError || /^\[[A-Z]{3}]/.test(meaningfulError.message)) {
        return meaningfulError;
    } else {
        meaningfulError.message = "[RUE] " + meaningfulError.message;
        return meaningfulError;
    }
}

function augmentErrorWithDevelopmentHints(error) {
    if (ZenMoney.runtime === "browser") {
        if (error instanceof InvalidPreferencesError) {
            error.message += "\nInvalidPreferencesError: user will be forced into preferences screen and will see the message above on production UI without [Send log] button.";
        } else if (error instanceof TemporaryError) {
            error.message += "\n(TemporaryError: the message above will be displayed on production UI without [Send log] button)";
        } else if (error instanceof ZPAPIError) {
            error.message += "\n(The message above will be displayed on production UI with [Send log] button)";
        } else {
            error.message += "\n(The message above will never be displayed on production UI; use TemporaryError or InvalidPreferencesError if you want to show meaningful message to user)";
        }
    }
    return error;
}

export function adaptScrapeToGlobalApi(scrape) {
    console.assert(typeof scrape === "function", "argument must be function");

    return function adaptedAsyncFn() {
        const result = scrape({preferences: ZenMoney.getPreferences()});
        console.assert(result && typeof result.then === "function", "scrape() did not return a promise");
        const resultHandled = result.then((results) => {
            console.assert(results, "scrape() did not return anything");
            if (!Array.isArray(results)) {
                console.assert(Array.isArray(results.accounts) && Array.isArray(results.transactions), "scrape should return {accounts[], transactions[]}");
                ZenMoney.addAccount(assertAccountIdsAreUnique(results.accounts));
                ZenMoney.addTransaction(castTransactionDatesToTicks(results.transactions.map(fixDateTimezones)));
                ZenMoney.setResult({success: true});
                return;
            }
            console.error("scrape result shape {account, transactions[]} is deprecated.\nconsider using {accounts[], transactions[]}");
            console.assert(results && Array.isArray(results), "scrape() result is not an array");
            console.assert(results.length > 0, "scrape results are empty");
            console.assert(
                results.every((result) => result.account && Array.isArray(result.transactions)),
                "scrape result should be array of {account, transactions[]}",
            );
            ZenMoney.addAccount(results.map(({account, transactions}) => account));
            results.forEach(({account, transactions}) => {
                ZenMoney.addTransaction(castTransactionDatesToTicks(transactions.map(fixDateTimezones)));
            });
            ZenMoney.setResult({success: true});
        });

        const {state, value} = unsealSyncPromise(resultHandled);
        if (state === "rejected") {
            throw augmentErrorWithDevelopmentHints(getPresentationError(value));
        } else if (state === "pending") {
            resultHandled.catch((e) => {
                const error = augmentErrorWithDevelopmentHints(getPresentationError(e));
                ZenMoney.setResult(error);
            });
        }
    };
}

export function traceFunctionCalls(fn) {
    console.assert(typeof fn === "function", "traceFunctionCalls argument should be a function");

    const functionName = fn.name || "anonymous";
    return function logCallsWrapper(args) {
        const startMs = Date.now();
        console.log("call", functionName, "with args:", sanitize(args, {preferences: true}));
        const result = fn.call(this, args);

        if (!result.then) {
            console.log(`${functionName} call returned result:`, result, `\n(${(Date.now() - startMs).toFixed(0)}ms)`);
            return result;
        }
        return result.then(
            (resolveValue) => {
                console.log(`${functionName} call resolved with`, resolveValue, `\n(${(Date.now() - startMs).toFixed(0)}ms)`);
                return resolveValue;
            },
            (rejectValue) => {
                console.error(`${functionName} call rejected with`, rejectValue, `\n(${(Date.now() - startMs).toFixed(0)}ms)`);
                return Promise.reject(rejectValue);
            },
        );
    };
}

export const adaptScrapeToMain = (scrape) => adaptScrapeToGlobalApi(provideScrapeDates(traceFunctionCalls(scrape)));
