export async function convertAccount (account) {
  return {
    id: account.id,
    title: account.title,
    type: 'ccard',
    instrument: account.currency,
    balance: parseFloat(account.balance.replace(',', '.')),
    syncIds: [
      account.id
    ]
  }
}

export function convertTransaction (transaction, account) {
  let amount = transaction.amount
  amount = amount.split(' ')
  let newAmount = ''

  amount.map(item => {
    if (item === '+' && item === '-') {
      newAmount += item
    } else if (typeof item === 'number') {
      newAmount += item
    }
    return newAmount
  })

  return {
    hold: transaction.status !== 'OK',
    date: new Date(transaction.tranDate),
    movements: [
      {
        id: transaction.id,
        account: { id: account.id },
        sum: newAmount,
        fee: 0
      }
    ],
    merchant: {
      title: transaction.purpose,
      mcc: transaction.knp,
      category: transaction.tranType
    },
    comment: null
  }
}
