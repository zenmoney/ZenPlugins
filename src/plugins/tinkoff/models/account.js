import { convertAccount } from '../converters/legacyConverters'

export class Account {
  constructor (account, tinkoffAccountType) {
    if (account.initialized) {
      // Переданный объект итак является объектом типа Account
      Object.assign(this, account)
      return
    }

    account = convertAccount(account)
    if (!account) {
      return
    }

    this.initialized = true
    this.tinkoffAccountType = tinkoffAccountType
    Object.assign(this, account)
  }
}
