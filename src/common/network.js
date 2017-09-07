import _ from "underscore";
import sanitize from "./sanitize";

export async function fetchJson(url, options = {}) {
    const init = {
        ..._.omit(options, ["sanitizeRequestLog", "sanitizeResponseLog"]),
        ...options.body && {body: JSON.stringify(options.body)},
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json;charset=UTF-8",
            ...options.headers,
        },
    };

    console.debug && console.debug("fetchJson request", sanitize({
        method: init.method || "GET",
        url,
        headers: init.headers,
        ...options.body && {body: options.body},
    }, options.sanitizeRequestLog || false));

    const response = await fetch(url, init);
    const body = await response.json();

    console.debug && console.debug("fetchJson response", sanitize({
        status: response.status,
        url: response.url,
        headers: _.object(Array.from(response.headers.entries())),
        body,
    }, options.sanitizeResponseLog || false));

    return {
        ..._.pick(response, ["ok", "status", "statusText", "url", "headers"]),
        body,
    };
}
