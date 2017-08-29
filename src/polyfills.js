import {toReadableJson} from "./common/printing";

["setImmediate", "setTimeout", "setInterval"].forEach((methodName) => {
    global[methodName] = () => {
        throw new Error(`${methodName} is not available in plugin runtime`);
    };
});

global.__trackNetworkEvent = (eventName, payload) => {
    const shouldSanitize = global.__sanitizeNetworkLogs;
    ZenMoney.trace([
        eventName,
        shouldSanitize && "(sanitized)",
        toReadableJson(payload, shouldSanitize),
    ].filter(Boolean).join(" "), "network");
};

// eslint-disable-next-line import/no-webpack-loader-syntax
require("imports-loader?setTimeout=>function(fn){fn();}!promise/lib/rejection-tracking").enable();
global.Promise = require("promise/lib/es6-extensions.js");

// eslint-disable-next-line import/no-webpack-loader-syntax
global.fetch = require("imports-loader?self=>{}&{default:XMLHttpRequest}=xhrViaZenApi!exports-loader?self.fetch!whatwg-fetch");

Object.assign = require("object-assign");
