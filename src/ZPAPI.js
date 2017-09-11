import {
    fetchFileSync,
    fetchRemoteSync,
    getLastError,
    getLastResponseHeader,
    getLastResponseHeaders,
    getLastResponseParameters,
    getLastStatusCode,
    getLastStatusString,
    getLastUrl,
    handleException,
    isSuccessfulHttpStatus,
    setDefaultEncoding,
    setThrowOnError
} from "./utils";
import {ZPAPIError} from "./ZPAPIError";
import {nativeConsole} from "./consoleAdapter";

function isArray(object) {
    return Array.isArray ?
        Array.isArray(object) : Object.prototype.toString.call(object) === "[object Array]";
}

function sleep(millis) {
    const time1 = new Date().getTime();
    for (let i = 0; i < 30000000; i++) {
    }
    const time2 = new Date().getTime();
    if (time2 - time1 < millis) {
        sleep(millis - time2 + time1);
    }
}

function collapseWhitespaces(str) {
    return str.replace(/\s+/g, " ").trim()
}

function castInterval(object) {
    return ["day", "month", "year"].indexOf(object) < 0 ? null : object;
}

function castDate(object) {
    if (!object) {
        return null;
    }
    let ts = 0;
    if (object instanceof Date) {
        ts = object.getTime();
    } else if (typeof object === "number") {
        ts = object;
    } else if (typeof object === "string") {
        object = object.trim();
        if (object.length === 0) {
            return null;
        }
        try {
            const result = object.match(/(\d{2})\.(\d{2})\.(\d{4})/);
            if (result) {
                ts = Date.parse(result[3] + "-" + result[2] + "-" + result[1]);
                if (isNaN(ts)) {
                    ts = 0;
                }
            } else {
                ts = 0;
            }
        } catch (e) {
            ts = 0;
        }
        if (ts === 0) {
            try {
                ts = Date.parse(object);
                if (isNaN(ts)) {
                    ts = 0;
                }
            } catch (e) {
                ts = 0;
            }
        }
        if (ts === 0) {
            try {
                ts = parseFloat(object);
                if (isNaN(ts)) {
                    ts = 0;
                }
            } catch (e) {
                ts = 0;
            }
        }
    }
    if (ts >= 10000000000) {
        ts /= 1000;
    }
    if (ts > 0) {
        return ts;
    }
    return null;
}

function wrapMethod(self, method) {
    const old = self[method];
    if (old) {
        self[method] = function() {
            let args = arguments;
            try {
                return old.apply(self, args);
            } catch (e) {
                if (typeof e.stack === "string" &&
                    e.stack.length > 0 &&
                    e.stack.indexOf(method) !== 0) {
                    e.stack = method + "\n" + e.stack;
                } else if (!e.stack) {
                    e.stack = method;
                }
                e.arguments = e.arguments || JSON.stringify(args);
                throw e;
            }
        };
    }
}

function ZPAPI({manifest, preferences, data}) {
    this.runtime = "browser";
    const knownAccounts = {};

    let isComplete = false;

    this.getLevel = () => 12;

    this.Error = ZPAPIError;

    this.trace = (msg, caller) => nativeConsole.log("[" + (caller || "trace") + "]", msg);

    this.setExceptions = setThrowOnError;
    this.setDefaultCharset = setDefaultEncoding;
    this.getLastError = getLastError;

    this.isAvailable = () => true;

    this.isSetResultCalled = () => isComplete;

    this.getPreferences = () => preferences;

    this.setOptions = () => {
    };

    this.setAuthentication = (name, pass, authscope) => {
    };

    this.clearAuthentication = () => {
    };

    this.getCookies = function() {
        return [];
    };

    this.getCookie = function() {
        return null;
    };

    this.setCookie = function() {
    };

    this.getData = function(name, defaultValue) {
        return data[name] !== undefined ? data[name] : defaultValue;
    };

    this.setData = function(name, value) {
        data[name] = value;
    };

    this.clearData = function() {
        data = {};
    };

    this.saveData = () => {
        this.trace("saveData:\n" + JSON.stringify(data) + "\n\n" +
            "Для того, чтобы плагин мог использовать эти данные при следующем запуске, сохраните их в файл zp_data.json\n");
    };

    this.saveCookies = function() {
    };

    this.restoreCookies = function() {
    };

    this.getLastStatusString = getLastStatusString;
    this.getLastStatusCode = getLastStatusCode;
    this.getLastResponseHeader = getLastResponseHeader;
    this.getLastResponseHeaders = getLastResponseHeaders;
    this.getLastUrl = getLastUrl;
    this.getLastResponseParameters = getLastResponseParameters;

    const setResult = (result) => {
        if (isComplete) {
            console.error("Ignored setResult call: calling it more than once is not expected");
            return;
        }
        if (typeof result !== "object") {
            handleException("[ROB] Wrong result object");
            return;
        }
        isComplete = true;
        if (result.success) {
            this.trace("setResult success: " + JSON.stringify(result));
            addAccount(result.account);
            addTransaction(result.transaction);
        } else {
            const resultError = result.message ? result.message.toString() : "[RSU] setResult called without success";
            this.trace("setResult fail: " + new ZPAPIError(resultError, !!result.allow_retry));
        }
        // eslint-disable-next-line no-restricted-globals
        self.postMessage({type: "completed", success: result.success});
    };

    function addAccount(accounts) {
        if (!accounts) {
            return;
        }
        if (!isArray(accounts)) {
            accounts = [accounts];
        }

        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            if (typeof account !== "object" || isArray(account)) {
                return handleException("[AOB] Wrong account object. It should be {} object or array of objects");
            }
            const id = account.id;
            if (!account.id || typeof account.id !== "string" || account.id.length === 0) {
                return handleException("[AID] Wrong account " + id + ". Account should have id");
            }
            if (!account.title || typeof account.title !== "string" || account.title.length === 0) {
                return handleException("[ATI] Wrong account " + id + ". Account should have title");
            }
            if (account.type && typeof account.type === "string" &&
                account.type.length > 0) {
                if (["card", "ccard", "checking", "loan", "deposit"].indexOf(account.type.toLowerCase()) < 0) {
                    return handleException("[ATY] Wrong account " + id + ". Account should have type 'card' or 'checking' or 'deposit' or 'loan'");
                }
            } else {
                account.type = "ccard";
            }
            if ((account.balance !== undefined && typeof account.balance !== "number") ||
                (account.startBalance !== undefined && typeof account.startBalance !== "number") ||
                (account.creditLimit !== undefined && typeof account.creditLimit !== "number")) {
                return handleException("[ABA] Wrong account " + id + ". Account balance, startBalance, creditLimit fields should not be set or be numbers");
            }
            let syncIDs = account.syncID;
            let syncIDCount = 0;
            if (!isArray(syncIDs)) {
                syncIDs = [syncIDs];
            }
            for (let j = 0; j < syncIDs.length; j++) {
                let syncID = syncIDs[j];
                if (typeof syncID !== "string") {
                    if (typeof syncID === "number" ||
                        typeof syncID === "boolean") {
                        syncID = syncID.toString();
                    } else {
                        syncID = "";
                    }
                }
                syncID = collapseWhitespaces(syncID);
                if (syncID.length === 0) {
                    return handleException("[ASY] Wrong account " + id + ". Wrong syncID in account. It should be string or string array");
                }
                syncIDCount++;
            }
            if (syncIDCount === 0) {
                return handleException("[ASY] Wrong account " + id + ". Account should have syncID");
            }
            if (account.type === "loan" ||
                account.type === "deposit") {
                account.startDate = castDate(account.startDate);
                account.payoffInterval = castInterval(account.payoffInterval);
                account.endDateOffsetInterval = castInterval(account.endDateOffsetInterval);

                if (typeof account.percent !== "number" ||
                    typeof account.capitalization !== "boolean" ||
                    typeof account.endDateOffset !== "number" ||
                    typeof account.payoffStep !== "number" ||
                    account.startDate === null ||
                    account.endDateOffsetInterval === null ||
                    Math.floor(account.payoffStep) !== account.payoffStep ||
                    Math.floor(account.endDateOffset) !== account.endDateOffset ||
                    account.endDateOffset <= 0 ||
                    account.payoffStep < 0 ||
                    (account.payoffStep > 0 && account.payoffInterval === null) ||
                    (account.payoffStep === 0 && account.payoffInterval)) {
                    return handleException("[ADE] Wrong account " + id + " deposit or loan parameters");
                }
            }
            knownAccounts[account.id] = {
                id: account.id,
            };
        }
    }

    function addTransaction(transactions) {
        if (!transactions) {
            return;
        }
        if (!isArray(transactions)) {
            transactions = [transactions];
        }
        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            if (typeof transaction !== "object" || isArray(transaction)) {
                return handleException("[TOB] Wrong transaction object. It should be {} object or array of objects");
            }
            if (!addTransactionObject(transaction)) {
                return;
            }
        }
    }

    function getAccount(id) {
        let account = knownAccounts[id];
        if (account) {
            return account;
        }
        account = {};
        let type = id;
        const typeIdx = id.indexOf("#");
        if (typeIdx >= 0) {
            type = id.substring(0, typeIdx);
            const idx = id.indexOf("#", typeIdx + 1);
            if (idx >= 0) {
                account.instrument = id.substring(typeIdx + 1, idx);
                account.syncID = id.substring(idx + 1)
                    .split(",")
                    .map(collapseWhitespaces)
                    .filter(function(id) {
                        return id.length > 0;
                    });
            } else {
                account.instrument = id.substring(typeIdx + 1);
            }
        }
        type = collapseWhitespaces(type);
        if (["cash", "card", "ccard", "checking", "loan", "deposit", "emoney"].indexOf(type) >= 0) {
            account.type = type;
            knownAccounts[id] = account;
        } else {
            account = null;
        }
        return account;
    }

    function addTransactionObject(transaction) {
        const id = transaction.id || "(null)";

        if (typeof transaction.income !== "number" || transaction.income < 0 ||
            typeof transaction.outcome !== "number" || transaction.outcome < 0) {
            return handleException("[TSN] Wrong transaction " + id + ". Income and outcome should be non-negative");
        }
        if (transaction.income === 0 && transaction.outcome === 0) {
            return handleException("[TSZ] Wrong transaction " + id + ". Transaction should have either income > 0 or outcome > 0");
        }
        if ((transaction.opIncome !== undefined &&
            transaction.opIncome !== null && (typeof transaction.opIncome !== "number" || transaction.opIncome < 0)) ||
            (transaction.opOutcome !== undefined &&
            transaction.opOutcome !== null && (typeof transaction.opOutcome !== "number" || transaction.opOutcome < 0))) {
            return handleException("[TON] Wrong transaction " + id + ". opIncome and opOutcome should be null or non-negative");
        }
        if ((transaction.latitude !== undefined && (typeof transaction.latitude !== "number" ||
            Math.abs(transaction.latitude) > 90)) ||
            (transaction.longitude !== undefined && (typeof transaction.longitude !== "number" ||
            Math.abs(transaction.longitude) > 180))) {
            return handleException("[TCO] Wrong transaction " + id + " coordinates");
        }
        if (transaction.date !== undefined && castDate(transaction.date) === null) {
            return handleException("[TDA] Wrong transaction " + id + ". Wrong date format");
        }
        if (transaction.mcc !== undefined &&
            transaction.mcc !== null && (typeof transaction.mcc !== "number" ||
            Math.floor(transaction.mcc) !== transaction.mcc)) {
            return handleException("[TMC] Wrong transaction " + id + ". MCC should be null or integer");
        }
        if (typeof transaction.incomeAccount !== "string" || transaction.incomeAccount.length === 0 ||
            typeof transaction.outcomeAccount !== "string" || transaction.outcomeAccount.length === 0) {
            return handleException("[TAC] Wrong transaction " + id + ". Transaction should have incomeAccount and outcomeAccount of string type");
        }
        if (transaction.incomeAccount === transaction.outcomeAccount &&
            transaction.income > 0 && transaction.outcome > 0) {
            return handleException("[TRS] Wrong transaction " + id + ". Transaction with incomeAccount == outcomeAccount should have income == 0 or outcome == 0");
        }
        if (transaction.incomeAccount !== transaction.outcomeAccount &&
            (transaction.income === 0 || transaction.outcome === 0)) {
            return handleException("[TTS] Wrong transaction " + id + ". Transfer transaction with incomeAccount != outcomeAccount should have income > 0 and outcome > 0");
        }
        const incAccount = getAccount(transaction.incomeAccount);
        const outAccount = getAccount(transaction.outcomeAccount);
        if (!incAccount) {
            return handleException("[TAC] Wrong transaction " + id + ". Cann't find incomeAccount " + transaction.incomeAccount);
        }
        if (!outAccount) {
            return handleException("[TAC] Wrong transaction " + id + ". Cann't find outcomeAccount " + transaction.outcomeAccount);
        }
        if (incAccount.id === undefined &&
            outAccount.id === undefined) {
            return handleException("[TAC] Wrong transaction " + id + ". Transaction should have at least incomeAccount or outcomeAccount added");
        }
    }

    this.retrieveCode = (comment, image, options) => {
        this.trace(`retrieveCode
${comment}
Сохраните пользовательский ввод в файл zp_pipe.txt в папке с плагином`);

        let time = (options && options.time ? options.time : 0) || 60000;
        while (time > 0) {
            let code;
            try {
                const {body, status} = fetchFileSync("/zen/pipe");
                if (isSuccessfulHttpStatus(status)) {
                    code = body;
                }
            } catch (e) {
                code = null;
            }
            if (code) {
                return code;
            }
            sleep(1000);
            time -= 1000;
        }
        return null;
    };

    this.request = (method, url, body, headers) => fetchRemoteSync({method: method.toUpperCase(), url, headers, body});
    this.requestGet = (url, headers) => this.request("GET", url, null, headers);
    this.requestPost = (url, body, headers) => this.request("POST", url, body, headers);

    this.addAccount = addAccount;
    this.addTransaction = addTransaction;
    this.setResult = setResult;
    wrapMethod(this, "addAccount");
    wrapMethod(this, "addTransaction");
    wrapMethod(this, "setResult");
}

export {ZPAPI};
