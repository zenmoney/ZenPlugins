
export class AccountHelper {
  constructor (accounts) {
    this.accounts = accounts
  }

  has (accountId) {
    return this.accounts.some(a => a.id === accountId)
  }

  account (accountId) {
    return this.accounts.find(a => a.id === accountId)
  }

  currency (accountId) {
    const account = this.account(accountId)

    return account ? account.instrument : ''
  }

  isDifferentCurrencies (accountId1, accountId2) {
    if (accountId1 === accountId2) {
      return false
    }

    const currency1 = this.currency(accountId1)
    const currency2 = this.currency(accountId2)

    return !!currency1 && currency1 !== currency2
  }
}
