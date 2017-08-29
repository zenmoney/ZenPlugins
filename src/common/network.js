import _ from "underscore";

const responseToJson = async (response) => ({
    body: await response.json(),
    ..._.pick(response, ["ok", "status", "statusText", "url"]),
});

export async function fetchJson(url, init = {}) {
    const response = await fetch(url, {
        ...init,
        body: init.body && JSON.stringify(init.body),
        headers: {
            ...init.headers,
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json;charset=UTF-8",
        },
    });
    return responseToJson(response);
}

export function sanitizeLogs(fn) {
    if (global.__sanitizeNetworkLogs === true) {
        throw new Error("sanitizeNetworkLogs misuse (most likely nested call)");
    }
    try {
        global.__sanitizeNetworkLogs = true;
        return fn();
    } finally {
        global.__sanitizeNetworkLogs = false;
    }
}
