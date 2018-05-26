import deepDiff from "deep-diff";
import {fetchJson} from "./common/network";

const prettifyDiffEntry = (diffEntry) => {
    if (diffEntry.kind === "A") {
        return prettifyDiffEntry(Object.assign({path: diffEntry.path.concat(diffEntry.index)}, diffEntry.item));
    }
    const lines = [];
    if (diffEntry.kind === "E" || diffEntry.kind === "D") {
        lines.push(`− ${JSON.stringify(diffEntry.path)}: ${JSON.stringify(diffEntry.lhs)}`);
    }
    if (diffEntry.kind === "E" || diffEntry.kind === "N") {
        lines.push(`+ ${JSON.stringify(diffEntry.path)}: ${JSON.stringify(diffEntry.rhs)}`);
    }
    return lines.join("\n");
};

const prettyDeepDiff = (x, y) => deepDiff(x, y).map(diffEntry => prettifyDiffEntry(diffEntry)).join("\n");

const isFlagPresent = (flag) => new RegExp(`[?&]${flag}\\b`).test(window.location.search);

const messageHandlers = {
    ":events/sync-start": async function({onStatusChange}) {
        onStatusChange("Syncing…");
    },

    ":events/sync-success": async function({payload: {addedAccounts, addedTransactions, pluginDataChange}, onStatusChange, setState}) {
        setState((state) => ({
            ...state,
            scrapeResult: {accounts: addedAccounts, transactions: addedTransactions},
        }));
        const summary = `Synced\nGot ${addedAccounts.length} account(s), ${addedTransactions.length} transaction(s)`;
        const ending = `\nCheers!`;
        if (!pluginDataChange) {
            onStatusChange(summary);
            return;
        }
        onStatusChange(`${summary}\n\nDo we want to save changed plugin data to zp_data.json?`);

        await new Promise((resolve) => setTimeout(resolve, 1));
        const promptDisabled = isFlagPresent("no-prompt");
        const diffLines = prettyDeepDiff(pluginDataChange.oldValue, pluginDataChange.newValue);
        const saveConfirmed = promptDisabled || window.confirm([`Diff:`, diffLines, `\nSave?`].join("\n"));

        const pluginDataSaved = saveConfirmed ? fetchJson("/zen/data", {method: "POST", body: pluginDataChange, log: false}) : Promise.resolve();
        onStatusChange(`${summary}\nSaving plugin data…`);
        try {
            await pluginDataSaved;
            onStatusChange(
                `${summary}\n\n${saveConfirmed
                    ? `Saved plugin data changes: \n${diffLines}`
                    : "You discarded plugin data changes"
                }\n${ending}`,
            );
        } catch (e) {
            onStatusChange(`${summary}\nWe've failed to save plugin data changes because:\n${e.message}\n${ending}`);
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

export async function handleMessageFromWorker({event, onStatusChange, setState}) {
    const messageHandler = messageHandlers[event.data.type] || (() => console.warn("message", event.data.type, " from worker was not handled", {event}));
    await messageHandler({
        payload: event.data.payload,
        reply: (message) => event.currentTarget.postMessage(message),
        onStatusChange,
        setState,
    });
}
