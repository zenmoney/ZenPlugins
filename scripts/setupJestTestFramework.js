import {formatWithCustomInspectParams} from "../src/consoleAdapter";

console.debug = process.env.DEBUG ? function() {
    console.log("[console.debug]", ...arguments);
} : function() {
};

console.assert = function(condition, ...args) {
    if (!condition) {
        throw new Error(formatWithCustomInspectParams(...args));
    }
};
