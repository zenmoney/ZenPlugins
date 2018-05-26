import React from "react";
import ReactDOM from "react-dom";
import {fetchJson} from "./common/network";
import {handleMessageFromWorker} from "./handleMessageFromWorker";
import {UI} from "./UI";
import {waitForOpenDevtools} from "./utils";

const pickSuccessfulBody = async (fetchPromise) => {
    const response = await fetchPromise;
    if (!response.ok) {
        throw response.body;
    }
    return response.body;
};

const rootElement = document.getElementById("root");

let state = {
    status: "Loading plugin manifest/preferences/data…",
    onManualStartPress: null,
    scrapeResult: null,
};

const updateUI = (UI) => ReactDOM.render(<UI {...state} />, rootElement);
const setState = (transform) => {
    state = transform(state);
    return updateUI(UI);
};

if (module.hot) {
    module.hot.accept("./UI", () => {
        console.log("./UI hot reloaded");
        updateUI(require("./UI").UI);
    });
}

window.dev = {
    get state() {
        return state;
    },
};

async function init() {
    try {
        const worker = new Worker("/workerLoader.js");

        window.__worker__ = worker; // prevents worker GC - allows setting breakpoints after worker ends execution

        const [preferences, manifest, data] = await Promise.all([
            pickSuccessfulBody(fetchJson("/zen/preferences", {log: false})),
            pickSuccessfulBody(fetchJson("/zen/manifest", {log: false})),
            pickSuccessfulBody(fetchJson("/zen/data", {log: false})),
        ]);
        setState((state) => ({...state, status: "Waiting until you open developer tools…"}));

        document.title = `[${manifest.id}] ${document.title}`;

        const manualStartButtonPressed = new Promise((resolve) => setState((state) => ({...state, onManualStartPress: resolve})));

        await Promise.race([waitForOpenDevtools(), manualStartButtonPressed]);

        setState((state) => ({...state, onManualStartPress: null, status: "Starting sync"}));

        worker.addEventListener("message", (event) => handleMessageFromWorker({
            event,
            onStatusChange: (status) => setState((state) => ({...state, status})),
            setState,
        }));
        worker.postMessage({
            type: ":commands/execute-sync",
            payload: {
                manifest,
                preferences,
                data,
            },
        });
    } catch (e) {
        setState((state) => ({...state, status: "Failed to execute sync:\n" + e.message}));
        throw e;
    }
}

init();
