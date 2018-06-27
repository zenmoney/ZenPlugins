export const promptAsync = (message, options) => new Promise((resolve, reject) => {
    const correlationId = Date.now();

    const messageHandler = (e) => {
        const message = e.data;
        if (message.type !== ":events/received-user-input") {
            return;
        }
        if (message.payload.correlationId !== correlationId) {
            return;
        }
        // eslint-disable-next-line no-restricted-globals
        self.removeEventListener("message", messageHandler);
        resolve(message.payload.result);
    };
    // eslint-disable-next-line no-restricted-globals
    self.addEventListener("message", messageHandler);

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
        type: ":commands/prompt-user-input",
        payload: {message, options, correlationId},
    });
});
