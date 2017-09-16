import {formatZenMoneyDate, isValidDate} from "./dates";

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
        }
    );
    return {state, value};
};

const calculateFromDate = () => {
    const lastSuccessDateString = ZenMoney.getData("scrape/lastSuccessDate");
    if (lastSuccessDateString) {
        const lastSuccessDate = new Date(lastSuccessDateString);
        console.assert(isValidDate(lastSuccessDate), {lastSuccessDateString}, "is not a valid date");
        return new Date(lastSuccessDate - MS_IN_WEEK);
    }
    const startDateString = ZenMoney.getPreferences().startDate;
    console.assert(startDateString, "startDate should be specified in preferences");
    const startDate = new Date(startDateString);
    console.assert(isValidDate(startDate), {startDateString}, "is not a valid date");
    return startDate;
};

export function provideScrapeDates(fn) {
    console.assert(typeof fn === "function", "provideScrapeDates argument should be a function");

    return function scrapeWithProvidedDates() {
        const successAttemptDate = new Date().toISOString();
        const scrapeResult = fn({fromDate: calculateFromDate(), toDate: null});
        return scrapeResult.then((x) => {
            ZenMoney.setData("scrape/lastSuccessDate", successAttemptDate);
            ZenMoney.saveData();
            return x;
        });
    };
}

export function postProcessTransaction(transaction) {
    if (ZenMoney.features.dateProcessing) {
        return transaction;
    }
    if (!(transaction.date instanceof Date)) {
        return transaction;
    }
    return {
        ...transaction,
        date: formatZenMoneyDate(transaction.date),
    };
}

export function adaptAsyncFn(fn) {
    console.assert(typeof fn === "function", "adaptAsyncFn argument is not a function");

    return function adaptedAsyncFn() {
        const result = fn();
        console.assert(result && typeof result.then === "function", "scrape() did not return a promise");
        const resultHandled = result.then((results) => {
            console.assert(results && Array.isArray(results), "scrape() result is not an array");
            console.assert(results.length > 0, "scrape results are empty");
            console.assert(
                results.every((result) => result.account && Array.isArray(result.transactions)),
                "scrape result should be array of {account, transactions[]}"
            );
            results.forEach(({account, transactions}) => {
                ZenMoney.addAccount(account);
                ZenMoney.addTransaction(transactions.map(postProcessTransaction));
            });
            ZenMoney.setResult({success: true});
        });

        const {state, value} = unsealSyncPromise(resultHandled);
        if (state === "rejected") {
            throw value;
        } else if (state === "pending") {
            resultHandled.catch((e) => ZenMoney.setResult(e));
        }
    };
}

export function traceFunctionCalls(fn) {
    console.assert(typeof fn === "function", "traceFunctionCalls argument should be a function");

    let callIdx = 0;
    const functionName = fn.name || "anonymous";
    return function logCallsWrapper() {
        const callId = ++callIdx;
        const label = `${functionName} call #${callId}`;
        console.debug(label, {arguments: Array.from(arguments)}, "@", new Date());
        console.time(label);
        const result = fn.apply(this, arguments);

        if (!result.then) {
            console.debug(label, {result});
            console.timeEnd(label);
            return result;
        }
        return result.then(
            (resolveValue) => {
                console.debug(label, {resolveValue});
                console.timeEnd(label);
                return resolveValue;
            },
            (rejectValue) => {
                console.debug(label, {rejectValue});
                console.timeEnd(label);
                return Promise.reject(rejectValue);
            }
        );
    };
}

export const adaptScrapeToMain = (scrape) => adaptAsyncFn(provideScrapeDates(traceFunctionCalls(scrape)));
