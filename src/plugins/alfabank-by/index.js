import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, generateDevice, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let device = ZenMoney.getData('device')
  if (!device) {
    device = generateDevice()
    ZenMoney.setData('device', device)
    ZenMoney.saveData()
  }
  const auth = await login(preferences, device, ZenMoney.getData('auth'))
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accounts = []
  const transactions = []
  await Promise.all(convertAccounts(await fetchAccounts(auth)).map(async ({ mainProduct, products, account }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    await Promise.all((mainProduct ? [mainProduct].concat(products) : products).map(async product => {
      const apiTransactions = await fetchTransactions(auth, product, fromDate, toDate)
      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }))
  }))

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
