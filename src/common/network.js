import _ from "lodash";
import {sanitize} from "./sanitize";

const cheerio = require("cheerio");

export class ParseError extends Error {
    constructor(message, response) {
        super(message);
        this.response = response;
    }
}

export async function fetch(url, options = {}) {
    const init = {
        ..._.omit(options, ["sanitizeRequestLog", "sanitizeResponseLog", "log", "stringify", "parse"]),
        ...options.body && {body: options.stringify ? options.stringify(options.body) : options.body},
    };

    const beforeFetchTicks = Date.now();
    const shouldLog = options.log !== false;
    shouldLog && console.debug("request", sanitize({
        method: init.method || "GET",
        url,
        headers: init.headers,
        ...options.body && {body: options.body},
    }, options.sanitizeRequestLog || false));

    let response = await global.fetch(url, init);
    let body = await response.text();
    let isBodyValid = true;
    if (options.parse) {
        try {
            body = options.parse(body);
        } catch (e) {
            isBodyValid = false;
        }
    }
    response = {
        ..._.pick(response, ["ok", "status", "statusText", "url", "headers"]),
        body,
    };

    const endTicks = Date.now();
    shouldLog && console.debug("response", sanitize({
        status: response.status,
        url: response.url,
        headers: response.headers.entries ? _.fromPairs(Array.from(response.headers.entries())) : response.headers.raw(),
        body,
        ms: endTicks - beforeFetchTicks,
    }, options.sanitizeResponseLog || false));

    if (!isBodyValid) {
        throw new ParseError("body is not valid", response);
    }

    return response;
}

export async function fetchJson(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json;charset=UTF-8",
            ...options.headers,
        },
        stringify: JSON.stringify,
        parse: body => {
            try {
                return JSON.parse(body);
            } catch (e) {
                if (body === "") {
                    return undefined;
                }
                throw e;
            }
        },
    });
}

export function parseXml(xml) {
    const $ = cheerio.load(xml, {
        xmlMode: true,
    });
    const object = parseXmlNode($().children()[0]);
    if (!object || typeof object !== "object") {
        throw new Error("Error parsing XML. Unexpected root node");
    }
    return object;
}

function parseXmlNode(root) {
    const children = root.children.filter(node => {
        if (node.type === "text") {
            const value = node.data.trim();
            if (value === "" || value === "?") {
                return false;
            }
        }
        return true;
    });
    let object = null;
    for (const node of children) {
        if (node.type === "cdata") {
            if (children.length !== 1 || !node.children
                || node.children.length !== 1
                || node.children[0].type !== "text") {
                throw new Error("Error parsing XML. Unsupported CDATA node");
            }
            return node.children[0].data.trim();
        }
        if (node.type === "tag") {
            if (object === null) {
                object = {};
            }
            const key = node.name;
            let value;
            if (!node.children || !node.children.length) {
                if (node.attribs && Object.keys(node.attribs).length > 0) {
                    value = {};
                } else {
                    value = null;
                }
            } else if (node.children.length === 1
                    && node.children[0].type === "text") {
                value = node.children[0].data.trim();
                if (value === "") {
                    value = null;
                }
            } else {
                value = parseXmlNode(node);
            }
            if (value && typeof value === "object" && node.attribs) {
                Object.assign(value, node.attribs);
            }
            let _value = object[key];
            if (_value !== undefined) {
                if (!Array.isArray(_value)) {
                    _value = [_value];
                    object[key] = _value;
                }
                _value.push(value);
            } else {
                object[key] = value;
            }
        }
    }
    return object;
}
