import _ from "lodash";
import sanitize from "./sanitize";

export async function fetchJson(url, options = {}) {
    const init = {
        ..._.omit(options, ["sanitizeRequestLog", "sanitizeResponseLog", "log"]),
        ...options.body && {body: JSON.stringify(options.body)},
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json;charset=UTF-8",
            ...options.headers,
        },
    };

    const beforeFetchTicks = Date.now();
    const shouldLog = options.log !== false;
    shouldLog && console.debug("json request", sanitize({
        method: init.method || "GET",
        url,
        headers: init.headers,
        ...options.body && {body: options.body},
    }, options.sanitizeRequestLog || false));

    const response = await fetch(url, init);
    const maybeNonJsonResponse = response.clone();
    let body = null;
    let isBodyValidJson = null;
    try {
        body = await response.json();
        isBodyValidJson = true;
    } catch (e) {
        body = await maybeNonJsonResponse.text();
        if (body === "") {
            body = undefined;
            isBodyValidJson = true;
        } else {
            isBodyValidJson = false;
        }
    }

    const endTicks = Date.now();
    shouldLog && console.debug("fetchJson response", sanitize({
        status: response.status,
        url: response.url,
        headers: response.headers.entries ? _.fromPairs(Array.from(response.headers.entries())) : response.headers.raw(),
        body,
        ms: endTicks - beforeFetchTicks,
    }, options.sanitizeResponseLog || false));

    if (!isBodyValidJson) {
        throw new Error("body is not a valid JSON");
    }

    return {
        ..._.pick(response, ["ok", "status", "statusText", "url", "headers"]),
        body,
    };
}
