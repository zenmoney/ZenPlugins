export declare class ZPAPIError extends Error {
  message: string
  fatal: boolean
  allowRetry: boolean
  toString (): string

  constructor (message: string, logIsNotImportant: boolean, forcePluginReinstall: boolean)
}

export declare class InvalidPreferencesError extends ZPAPIError {
  constructor (message?: string)
}

export declare class TemporaryError extends ZPAPIError {
  constructor (message?: string)
}

export declare class IncompatibleVersionError extends TemporaryError {
  constructor ()
}

export declare class TemporaryUnavailableError extends TemporaryError {
  constructor ()
}

export declare class InvalidLoginOrPasswordError extends InvalidPreferencesError {
  constructor (message?: string)
}

export declare class InvalidOtpCodeError extends TemporaryError {
  constructor (message?: string)
}

export declare class PinCodeInsteadOfPasswordError extends InvalidPreferencesError {
  constructor ()
}

export declare class BankMessageError extends TemporaryError {
  bankMessage: string

  constructor (bankMessage: string, forcePluginReinstall?: boolean)
}

export declare class PreviousSessionNotClosedError extends TemporaryError {
  constructor ()
}

export declare class UserInteractionError extends TemporaryError {
  constructor ()
}

export declare class PasswordExpiredError extends InvalidPreferencesError {
  constructor ()
}
