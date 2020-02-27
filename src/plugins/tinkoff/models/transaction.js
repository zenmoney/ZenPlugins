export class Transaction {
  constructor (transaction, account) {
    Object.assign(this, transaction)
    if (!this.accounts) {
      this.accounts = []
    }

    this.accounts.push(account)
  }
}
