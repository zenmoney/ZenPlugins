import {fetchJson} from "./utils";

window.onload = function() {
    const statusElement = document.getElementById("root");
    statusElement.textContent = "Loading plugin…";
    Promise.all([
        fetchJson("/zen/preferences"),
        fetchJson("/zen/manifest"),
        fetchJson("/zen/data"),
    ])
        .then(([preferences, manifest, data]) => {
            document.title = `[${manifest.id}] ${document.title}`;
            const worker = new Worker("/workerLoader.js");
            worker.postMessage({manifest, preferences, data});
            statusElement.textContent = "Running…";
            worker.onmessage = function(e) {
                if (e.data && e.data.type === "completed") {
                    statusElement.textContent = e.data.success ? "Success" : "Failure";
                }
            };
            window.__pluginWorker = worker;
        })
        .catch((e) => {
            statusElement.textContent = "Failure\n" + e.message;
            return Promise.reject(e);
        });
};
