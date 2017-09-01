import * as consoleAdapter from "./consoleAdapter";

["setImmediate", "setTimeout", "setInterval"].forEach((methodName) => {
    global[methodName] = () => {
        throw new Error(`${methodName} is not available in plugin runtime`);
    };
});

global.__trackNetworkEvent = (eventName, payload) => {
    const sanitizedPayload = global.__sanitizeNetworkLogMask === void 0
        ? payload
        : "(sanitized)";
    console.debug("network", eventName, sanitizedPayload);
};

// eslint-disable-next-line import/no-webpack-loader-syntax
require("imports-loader?setTimeout=>function(fn){fn();}!promise/lib/rejection-tracking").enable();
global.Promise = require("promise/lib/es6-extensions.js");

// eslint-disable-next-line import/no-webpack-loader-syntax
global.fetch = require("imports-loader?self=>{}&{default:XMLHttpRequest}=xhrViaZenApi!exports-loader?self.fetch!whatwg-fetch");

Object.assign = require("object-assign");

if (consoleAdapter.isNativeConsoleImplemented()) {
    consoleAdapter.shapeNativeConsole();
} else {
    consoleAdapter.install();
}
