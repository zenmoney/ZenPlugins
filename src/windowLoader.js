import {fetchJson} from "./common/network";

const pickBody = (fetchPromise) => fetchPromise.then(
    (response) => response.ok
        ? response.body
        : Promise.reject(response.body)
);

window.onload = function() {
    const statusElement = document.getElementById("root");
    statusElement.textContent = "Loading plugin…";
    Promise.all([
        pickBody(fetchJson("/zen/preferences")),
        pickBody(fetchJson("/zen/manifest")),
        pickBody(fetchJson("/zen/data")),
    ])
        .then(([preferences, manifest, data]) => {
            document.title = `[${manifest.id}] ${document.title}`;
            const worker = new Worker("/workerLoader.js");
            worker.postMessage({manifest, preferences, data});
            statusElement.textContent = "Running…";
            worker.onmessage = function(e) {
                if (!e.data) {
                    return;
                }
                handleMessage(e.data, (message) => statusElement.textContent = message);
            };
            window.__pluginWorker = worker;
        })
        .catch((e) => {
            statusElement.textContent = "Failure\n" + e.message;
            return Promise.reject(e);
        });
};

const handleMessage = ({type, success, message, pluginDataChange}, setStatus) => {
    if (type === "completed") {
        if (success) {
            if (pluginDataChange) {
                console.debug({pluginDataChange});
                const commitPluginData = window.confirm("Plugin data has changed. Commit?");
                if (commitPluginData) {
                    setStatus("Committing plugin data…");
                    fetchJson("/zen/data", {method: "POST", body: pluginDataChange, log: false})
                        .then(() => setStatus("Success"))
                        .catch((e) => {
                            setStatus("Failure\n" + e.message)
                        });
                } else {
                    setStatus("Success");
                }
            }
        } else {
            setStatus("Failure\n" + message);
        }
    }
};
