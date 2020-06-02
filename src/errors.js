export class ZPAPIError {
  constructor (message, logIsNotImportant, forcePluginReinstall) {
    if (typeof message !== 'string' && message !== null && message !== undefined) {
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

export class IncompatibleVersionError extends TemporaryError {}

export class TemporaryUnavailableError extends TemporaryError {}

export class InvalidLoginOrPasswordError extends InvalidPreferencesError {}

export class InvalidOtpCodeError extends TemporaryError {}

export class PinCodeInsteadOfPasswordError extends InvalidPreferencesError {}

export class BankMessageError extends TemporaryError {
  constructor (bankMessage, forcePluginReinstall) {
    if (typeof bankMessage !== 'string' || !bankMessage) {
      throw new Error('bankMessage must be non-empty string')
    }
    super()
    this.bankMessage = bankMessage
    this.fatal = Boolean(forcePluginReinstall)
  }
}

export class PreviousSessionNotClosedError extends TemporaryError {}

export class UserInteractionError extends TemporaryError {
  constructor () {
    super('[INU]')
  }
}
