export class ZPAPIError {
  constructor (message, logIsNotImportant, forcePluginReinstall) {
    if (typeof message !== 'string') {
      throw new Error('message must be string')
    }
    this.message = message
    this.stack = new Error().stack
    // Redirects to preferences screen
    this.fatal = Boolean(forcePluginReinstall)
    // Hides "Send log" button on error modal
    this.allowRetry = Boolean(logIsNotImportant)
    this.toString = function () {
      return (this.fatal ? 'F' : '_') + (this.allowRetry ? 'R' : '_') + ' ' + this.message
    }
  }
}

export class InvalidPreferencesError extends ZPAPIError {
  constructor (message) {
    super(message, true, true)
  }
}

export class TemporaryError extends ZPAPIError {
  constructor (message) {
    super(message, true, false)
  }
}
