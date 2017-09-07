import * as consoleAdapter from "./consoleAdapter";

["setImmediate", "setTimeout", "setInterval"].forEach((methodName) => {
    global[methodName] = () => {
        throw new Error(`${methodName} is not available in plugin runtime`);
    };
});

global.Promise = require("promise/lib/es6-extensions.js");

global.fetch = null;
// eslint-disable-next-line import/no-webpack-loader-syntax
global.fetch = require("imports-loader?self=>global&{default:XMLHttpRequest}=xhrViaZenApi!exports-loader?self.fetch!whatwg-fetch");

Object.assign = require("object-assign");

if (ZenMoney.runtime === "browser" && consoleAdapter.isNativeConsoleImplemented()) {
    consoleAdapter.shapeNativeConsole();
} else {
    consoleAdapter.install();
}

if (!("isAccountSkipped" in ZenMoney)) {
    ZenMoney.isAccountSkipped = () => false;
}
