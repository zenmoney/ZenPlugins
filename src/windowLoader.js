import {fetchJson} from "./common/network";
import {handleMessageFromWorker} from "./handleMessageFromWorker";

const pickBody = (fetchPromise) => fetchPromise.then(
    (response) => response.ok
        ? response.body
        : Promise.reject(response.body),
);

window.onload = async function() {
    const statusElement = document.getElementById("root");
    const onStatusChange = (message) => statusElement.textContent = message;
    try {
        const worker = new Worker("/workerLoader.js");
        onStatusChange("Loading plugin manifest/preferences/data…");

        window.__worker__ = worker; // prevents worker GC - allows setting breakpoints after worker ends execution

        const [preferences, manifest, data] = await Promise.all([
            pickBody(fetchJson("/zen/preferences", {log: false})),
            pickBody(fetchJson("/zen/manifest", {log: false})),
            pickBody(fetchJson("/zen/data", {log: false})),
        ]);

        document.title = `[${manifest.id}] ${document.title}`;

        worker.addEventListener("message", (event) => handleMessageFromWorker({event, onStatusChange}));
        worker.postMessage({
            type: ":commands/execute-sync",
            payload: {
                manifest,
                preferences,
                data,
            },
        });
    } catch (e) {
        onStatusChange("Failed to execute sync:\n" + e.message);
        throw e;
    }
};
