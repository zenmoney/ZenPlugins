import {extractErrorDetails} from "./utils";
import {ZPAPI} from "./ZPAPI";

const messageHandlers = {
    ":commands/execute-sync": async ({payload: {manifest, preferences, data}, reply}) => {
        reply({type: ":events/scrape-started"});
        const api = new ZPAPI({manifest, preferences, data});
        global.ZenMoney = api;
        try {
            const {main} = require("currentPluginManifest");
            main();
            const result = await api.setResultCalled;
            reply({
                type: ":events/scrape-success",
                payload: result,
            });
        } catch (error) {
            reply({
                type: ":events/scrape-error",
                payload: {
                    message: extractErrorDetails(error),
                },
            });
            throw error;
        }
    },

    ":events/received-user-input": () => {
    },
};

export async function handleMessageFromWindow({event}) {
    const messageHandler = messageHandlers[event.data.type] || (() => console.warn("message", event.data.type, " from window was not handled", {event}));
    await messageHandler({
        payload: event.data.payload,
        reply: (message) => event.currentTarget.postMessage(message),
    });
}
