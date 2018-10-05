export function convertAccount (apiAccount) {
  switch (apiAccount.accType) {
    case 'widget': return null
    case 'card': return convertCard(apiAccount)
    default: throw new Error(`unsupported account type ${apiAccount.accType}`)
  }
}

export function convertCard (apiAccount) {
  return {
    id: apiAccount.account,
    type: 'ccard',
    title: apiAccount.cardName,
    instrument: 'RUB',
    balance: apiAccount.sum - apiAccount.creditLimit,
    creditLimit: apiAccount.creditLimit,
    syncID: [
      apiAccount.cardBin + '******' + apiAccount.cardEnd,
      apiAccount.account
    ]
  }
}

export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.desc_sh === 'Увеличение лимита') {
    return null
  }
  const transaction = {
    id: apiTransaction.id,
    income: apiTransaction.credit,
    incomeAccount: account.id,
    outcome: apiTransaction.debit,
    outcomeAccount: account.id
  };
  [
    parseDate,
    parsePayee
  ].some(parser => parser(apiTransaction, transaction))
  return transaction
}

function parseDate (apiTransaction, transaction) {
  transaction.date = new Date(apiTransaction.sortDate + '+03:00')
}

function parsePayee (apiTransaction, transaction) {
  const i = apiTransaction.desc_sh ? apiTransaction.desc_sh.indexOf('Описание:') : -1
  if (i >= 0) {
    transaction.payee = apiTransaction.desc_sh.substring(i + 'Описание:'.length).trim()
  }
}
