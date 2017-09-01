const util = require("util");

const consoleAdapter = {
    assert(condition, ...args) {
        if (!condition) {
            throw new Error("Assertion error: " + (util.format(...args) || "console.assert"));
        }
    },

    dir(obj, options) {
        ZenMoney.trace(util.inspect(obj, {customInspect: false, ...options}), "dir");
    },
};

["log", "warn", "info", "error", "debug"].forEach((methodName) => {
    consoleAdapter[methodName] = function() {
        ZenMoney.trace(util.format(...arguments), methodName);
    };
});

const labelTimes = {};

consoleAdapter.time = function(label) {
    labelTimes[label] = Date.now();
};

consoleAdapter.timeEnd = function(label) {
    const labelTime = labelTimes[label];
    if (labelTime === void 0) {
        consoleAdapter.warn(`No such label '${label}' for console.timeEnd()`);
    } else {
        delete labelTimes[label];
        ZenMoney.trace(`${label}: ${((Date.now() - labelTime) / 1000).toFixed(3)}ms`, "time");
    }
};

export const nativeConsole = global.console;

export const isNativeConsoleImplemented = () => {
    const adapterKeys = Object.keys(consoleAdapter);
    return nativeConsole && adapterKeys.every((key) => typeof nativeConsole[key] === "function");
};

export const install = () => {
    global.console = consoleAdapter;
};

export const shapeNativeConsole = () => {
    Object.keys(nativeConsole)
        .filter(key => !(key in consoleAdapter))
        .forEach(key => delete nativeConsole[key]);
    nativeConsole.assert = consoleAdapter.assert;
};

