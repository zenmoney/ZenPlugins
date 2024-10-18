import { adjustTransactions } from '../../common/transactionGroupHandler'
import { parsePdf } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape () {
  const apiAccounts = await parsePdf()
  const accountsData = convertAccounts(apiAccounts)
  const accounts = []
  const transactions = []
  await Promise.all(accountsData.map(async ({ apiTransactions, account }) => {
    accounts.push(account)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
