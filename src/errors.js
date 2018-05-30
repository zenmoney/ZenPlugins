export class ZPAPIError extends Error {
    constructor(message, logIsNotImportant, forcePluginReinstall) {
        super(message);
        if (typeof message !== "string") {
            throw new Error("message must be string");
        }
        // Redirects to preferences screen
        this.fatal = Boolean(forcePluginReinstall);
        // Hides "Send log" button on error modal
        this.allowRetry = Boolean(logIsNotImportant);
    }

    toString() {
        return (this.fatal ? "F" : "_") + (this.allowRetry ? "R" : "_") + " " + this.message;
    }
}

export class InvalidPreferencesError extends ZPAPIError {
    constructor(message) {
        super(message, true, true);
    }
}

export class TemporaryError extends ZPAPIError {
    constructor(message) {
        super(message, true, false);
    }
}
