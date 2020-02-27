export class AuthSession {
  constructor (sessionId) {
    this._sessionId = sessionId
  }

  get sessionId () {
    return this._sessionId
  }
}
