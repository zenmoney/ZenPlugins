import _ from "underscore";

export function sanitize(key, value) {
    if (value === undefined) {
        return "<undefined>";
    }
    if (_.isString(value)) {
        return "<string[" + value.length + "]>";
    }
    if (_.isNumber(value)) {
        return "<number>";
    }
    return value;
}

export function toReadableJson(x, shouldSanitize) {
    if (x === undefined) {
        return "undefined";
    }
    return JSON.stringify(x, shouldSanitize ? sanitize : null, 4);
}
