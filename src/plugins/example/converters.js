export function convertAccounts (apiAccounts) {
  const accountsByCba = {}
  const accounts = []
  for (const apiAccount of apiAccounts) {
    const product = { id: apiAccount.id, transactionNode: apiAccount.transactionNode }
    let account = accountsByCba[apiAccount.cba]
    if (!account) {
      account = {
        products: [],
        account: {
          id: apiAccount.cba,
          type: 'card',
          title: apiAccount.product || apiAccount.cba,
          instrument: apiAccount.currency.shortName,
          balance: apiAccount.accountBalance.value,
          creditLimit: 0,
          syncIds: [
            apiAccount.cba
          ]
        }
      }
      accounts.push(account)
      accountsByCba[apiAccount.cba] = account
    }
    account.products.push(product)
    if (apiAccount.pan) {
      account.account.syncIds.push(apiAccount.pan)
    }
    if (apiAccount.moneyAmount && apiAccount.moneyAmount.value > apiAccount.accountBalance.value) {
      account.account.creditLimit = apiAccount.moneyAmount.value - apiAccount.accountBalance.value
    }
  }
  return accounts
}

export function convertTransaction (apiTransaction, account) {
  return {
    hold: apiTransaction.type !== 'TRANSACTION',
    date: new Date(apiTransaction.operationTime),
    movements: [
      {
        id: apiTransaction.id || null,
        account: { id: account.id },
        invoice: apiTransaction.accountAmount.currency.shortName === apiTransaction.amount.currency.shortName ? null : {
          sum: apiTransaction.amount.value,
          instrument: apiTransaction.amount.currency.shortName
        },
        sum: apiTransaction.accountAmount.value,
        fee: 0
      }
    ],
    merchant: apiTransaction.description ? {
      fullTitle: apiTransaction.description,
      mcc: null,
      location: null
    } : null,
    comment: null
  }
}
