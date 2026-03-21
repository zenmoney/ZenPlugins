import { find } from 'lodash'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, generateDevice, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground, isFirstRun }) {
  ZenMoney.locale = 'he'

  toDate = toDate || new Date()

  let device = ZenMoney.getData('device')
  if (!device) {
    device = generateDevice()
    ZenMoney.setData('device', device)
    ZenMoney.saveData()
  }
  await login(preferences, device)
  const accounts = []
  const transactions = []
  await Promise.all(convertAccounts(await fetchAccounts()).map(async ({ mainProduct, account }) => {
    if (find(accounts, { id: account.id })) {
      return
    }
    accounts.push(account)
    if (!mainProduct || ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(mainProduct, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }))
  if (isFirstRun && ZenMoney.alert) {
    await ZenMoney.alert('לקבלת תוצאות מיטביות, אנו ממליצים לא לסנכרן כרטיסי כאל, ישראקרט ומקס דרך הבנק אלא ישירות דרך חברות האשראי.')
  }
  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
