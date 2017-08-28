import {fetchJson} from "./utils";

const fetchPreferences = () => fetchJson("/zen/preferences");
const fetchManifest = () => fetchJson("/zen/manifest");
const fetchData = () => fetchJson("/zen/data");

window.onload = function() {
    const statusElement = document.getElementById("root");
    statusElement.textContent = "Loading plugin…";
    Promise.all([fetchPreferences(), fetchManifest(), fetchData()])
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
        });
};
