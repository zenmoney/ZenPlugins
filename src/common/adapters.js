import {isValidDate} from "./dates";

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

export function convertTimestampToDate(timestamp) {
    // used mobile interpreter implementation as a reference
    const millis = timestamp < 10000000000
        ? timestamp * 1000
        : timestamp;
    return new Date(millis);
}

export function convertAccountNumberToSyncID(accounts) {
    const accountsByNumberKey = {};
    for (const account of accounts) {
        if (account.number === null || account.number === undefined) {
            delete account.number;
            continue;
        }
        console.assert(typeof account.number === "string", "account.number should be string");
        const key = account.instrument + "_" + account.number.slice(-4);
        let group = accountsByNumberKey[key];
        if (!group) {
            accountsByNumberKey[key] = group = [];
        }
        group.push(account);
    }
    for (const key in accountsByNumberKey) {
        const group = accountsByNumberKey[key];
        for (const account of group) {
            if (!account.syncID) {
                account.syncID = [];
            }
            const syncId = group.length > 1 ? account.number.length <= 9 ?
                account.number : account.number.slice(5) : account.number.slice(-4);
            if (account.syncID.indexOf(syncId) < 0) {
                account.syncID.push(syncId);
            }
            delete account.number;
        }
    }
    return accounts;
}

export function postProcessTransaction(transaction) {
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

export function adaptAsyncFn(fn) {
    console.assert(typeof fn === "function", "adaptAsyncFn argument is not a function");

    return function adaptedAsyncFn() {
        const result = fn();
        console.assert(result && typeof result.then === "function", "scrape() did not return a promise");
        const resultHandled = result.then((results) => {
            console.assert(results, "scrape() did not return anything");
            if (!Array.isArray(results)) {
                console.assert(Array.isArray(results.accounts) && Array.isArray(results.transactions), "scrape should return {accounts[], transactions[]}");
                ZenMoney.addAccount(convertAccountNumberToSyncID(results.accounts));
                ZenMoney.addTransaction(results.transactions.map(postProcessTransaction));
                ZenMoney.setResult({success: true});
                return;
            }
            console.error("scrape result shape {account, transactions[]} is deprecated.\nconsider using {accounts[], transactions[]}");
            console.assert(results && Array.isArray(results), "scrape() result is not an array");
            console.assert(results.length > 0, "scrape results are empty");
            console.assert(
                results.every((result) => result.account && Array.isArray(result.transactions)),
                "scrape result should be array of {account, transactions[]}"
            );
            ZenMoney.addAccount(convertAccountNumberToSyncID(results.map(({account, transactions}) => account)));
            results.forEach(({account, transactions}) => {
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
