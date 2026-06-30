import { AccountInfo, AccountTransaction } from './types'
import moment from 'moment'

export function parseAccounts (response: string[][]): AccountInfo[] {
  return response.map(account => ({
    name: account[1],
    productCoreID: account[2],
    accountNumber: account[6],
    balance: parseFloat(account[7]),
    currency: account[8],
    iban: account[15]
  }))
}

export function parseTransactions (response: unknown[][][]): AccountTransaction[] {
  const transactions = response[0][1] as string[][]
  if (!Array.isArray(transactions)) {
    return []
  }

  return transactions
    .map(tx => {
      const direction = tx[5] === 'c' ? 1 : -1
      const amount = direction * parseFloat(tx[27])
      const date = moment(tx[7], 'DD.MM.YYYY HH:mm:ss').toDate()

      return {
        id: tx[10],
        date,
        direction: tx[5],
        amount,
        currency: tx[30] !== '' ? tx[30] : undefined,
        description: tx[15].trim()
      }
    })
    .filter(tx => !isNaN(tx.amount) && tx.amount !== 0)
}
