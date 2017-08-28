import {fetchJson} from "./utils";

const fetchPreferences = () => fetchJson("/zen/preferences");
const fetchManifest = () => fetchJson("/zen/manifest");
const fetchData = () => fetchJson("/zen/data");

window.onload = function() {
    Promise.all([fetchPreferences(), fetchManifest(), fetchData()])
        .then(([preferences, manifest, data]) => {
            const worker = new Worker("/workerLoader.js");
            worker.postMessage({manifest, preferences, data});
            worker.onmessage = function(e) {
                if (e && (e === "close" || e.data === "close")) {
                    worker.terminate();
                }
            };
        });
};
