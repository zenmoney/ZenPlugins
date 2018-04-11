export class ZPAPIError extends Error {
    constructor(message, logIsNotImportant, forcePluginReinstall) {
        super(message);
        if (typeof message !== "string") {
            throw new Error("message must be string");
        }
        this.fatal = Boolean(forcePluginReinstall);
        this.allowRetry = Boolean(logIsNotImportant);
    }
}
