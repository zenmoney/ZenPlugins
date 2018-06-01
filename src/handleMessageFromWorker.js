const messageHandlers = {
    ":events/scrape-started": async function({onSyncStarted}) {
        onSyncStarted();
    },

    ":events/scrape-success": async function({payload: {addedAccounts, addedTransactions, pluginDataChange}, onSyncSuccess}) {
        onSyncSuccess({accounts: addedAccounts, transactions: addedTransactions, pluginDataChange});
    },

    ":events/scrape-error": async function({payload, onSyncError}) {
        onSyncError(payload);
    },

    ":commands/prompt-user-input": async function({payload: {message, options, correlationId}, reply}) {
        const result = prompt(message);
        reply({type: ":events/received-user-input", payload: {result, correlationId}});
    },
};

export async function handleMessageFromWorker({event, ...rest}) {
    const messageHandler = messageHandlers[event.data.type] || (() => console.warn("message", event.data.type, " from worker was not handled", {event}));
    await messageHandler({
        payload: event.data.payload,
        reply: (message) => event.currentTarget.postMessage(message),
        ...rest,
    });
}
