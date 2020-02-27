export class AccountsPostProcessor {
  process (accounts) {
    return this._dropUtilityFields(accounts)
  }

  _dropUtilityFields (accounts) {
    return accounts.map(x => {
      delete x.transactions
      return x
    })
  }
}
