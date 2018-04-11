import {fetchJson} from "./common/network";
import {handleMessageFromWorker} from "./handleMessageFromWorker";

const pickBody = (fetchPromise) => fetchPromise.then(
    (response) => response.ok
        ? response.body
        : Promise.reject(response.body),
);

async function loadAndRun({onStatusChange}) {
    const [preferences, manifest, data] = await Promise.all([
        pickBody(fetchJson("/zen/preferences", {log: false})),
        pickBody(fetchJson("/zen/manifest", {log: false})),
        pickBody(fetchJson("/zen/data", {log: false})),
    ]);
    document.title = `[${manifest.id}] ${document.title}`;
    const worker = new Worker("/workerLoader.js");
    worker.postMessage({
        type: ":commands/execute-sync",
        payload: {
            manifest,
            preferences,
            data,
        },
    });
    worker.addEventListener("message", (event) => handleMessageFromWorker({event, onStatusChange}));
    onStatusChange("Running…");
    window.__worker__ = worker; // prevents worker gargabe collection; allows setting breakpoints after worker ends execution
}

window.onload = async function() {
    const statusElement = document.getElementById("root");
    const onStatusChange = (message) => statusElement.textContent = message;
    try {
        onStatusChange("Loading plugin manifest/preferences/data…");
        await loadAndRun({onStatusChange});
    } catch (e) {
        onStatusChange("Failed to execute sync:\n" + e.message);
        throw e;
    }
};
