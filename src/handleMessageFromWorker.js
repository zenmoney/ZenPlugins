import {fetchJson} from "./common/network";

const messageHandlers = {
    ":events/sync-success": async function({payload: {pluginDataChange}, onStatusChange}) {
        if (!pluginDataChange) {
            onStatusChange("Completed successfully");
            return;
        }
        const saveConfirmed = window.confirm([
            `Plugin changed some data:`,
            JSON.stringify(pluginDataChange, null, 2),
            `Save newValue to zp_data.json?`,
        ].join("\n"));
        const pluginDataSaved = saveConfirmed ? fetchJson("/zen/data", {method: "POST", body: pluginDataChange, log: false}) : Promise.resolve();
        onStatusChange("Committing plugin data…");
        try {
            await pluginDataSaved;
            onStatusChange("Success");
        } catch (e) {
            onStatusChange("Cannot save plugin data:\n" + e.message)
        }
    },

    ":events/sync-failure": async function({payload: {message}, onStatusChange}) {
        onStatusChange("Plugin error:\n" + message);
    },

    ":commands/prompt-user-input": async function({payload: {message, options, correlationId}, reply}) {
        const result = prompt(message);
        reply({type: ":events/received-user-input", payload: {result, correlationId}});
    },
};

export async function handleMessageFromWorker({event, onStatusChange}) {
    const messageHandler = messageHandlers[event.data.type] || (() => console.warn("message", event.data.type, " from worker was not handled", {event}));
    await messageHandler({
        payload: event.data.payload,
        reply: (message) => event.currentTarget.postMessage(message),
        onStatusChange,
    });
}
