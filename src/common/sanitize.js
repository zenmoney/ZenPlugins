import _ from "lodash";

export default function sanitize(value, mask) {
    if (!mask) {
        return value;
    }
    if (_.isString(value)) {
        return "<string[" + value.length + "]>";
    }
    if (_.isNumber(value)) {
        return "<number>";
    }
    if (_.isDate(value)) {
        return "<date>";
    }
    if (_.isBoolean(value)) {
        return "<bool>";
    }
    if (_.isArray(value)) {
        return value.map((item) => sanitize(item, mask));
    }
    if (_.isObject(value)) {
        return _.mapValues(value, (val, key) => sanitize(val, mask === true ? true : mask[key]));
    }
    return "<value>";
}
