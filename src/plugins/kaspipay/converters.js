// import currencies from './currencies'

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

export async function convertTransaction (transaction, account) {
  let amount = transaction.tranAmount

  const number = amount.match(/\d+/g).join('')

  amount = amount.split(' ')

  const newAmount = amount[0] + number

  // const currency = currencies[amount[amount.length - 1]]

  return {
    hold: transaction.status !== 'OK',
    date: await getDate(transaction.tranDate),
    movements: [
      {
        id: transaction.tranId,
        account: { id: account.id },
        invoice: null,
        sum: Number(newAmount),
        fee: 0
      }
    ],
    merchant: {
      country: null,
      city: null,
      location: null,
      title: transaction.contragentName,
      mcc: Number(transaction.knp),
      category: transaction.tranType
    },
    comment: transaction.purpose
  }
}

const getDate = async (date) => {
  const [day, month, year, hour, minute, second] = date.match(/(\d{2}).(\d{2}).(\d{2}) (\d{2}):(\d{2}):(\d{2})/).slice(1)
  return new Date(`20${year}-${month}-${day}T${hour}:${minute}:${second}+06:00`)
}
