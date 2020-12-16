import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchStatement, login } from './api'
import { convertAccounts, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (!toDate) {
    toDate = new Date()
  }

  let auth = await login(ZenMoney.getData('auth'), preferences)

  const accounts = []
  const transactions = []

  let fetchedAccounts = await fetchAccounts(auth, preferences)
  if (fetchedAccounts.error === 'invalid_token') {
    // если токен вдруг старый,попытаемся его разок освежить
    auth = await login({
      access_token: null,
      refresh_token: null,
      expirationDateMs: 0
    }, preferences)
    fetchedAccounts = await fetchAccounts(auth, preferences)
  }
  if (!Array.isArray(fetchedAccounts)) {
    throw new Error('Ошибка запроса списка счетов')
  }

  await Promise.all(convertAccounts(fetchedAccounts).map(async ({ account, product }) => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiStatement = await fetchStatement(auth, product, fromDate, toDate, preferences)
    // остаток на счету на конец периода в выписке
    if (apiStatement.balance_closing) {
      account.balance = Number(apiStatement.balance_closing)
    }
    // операции по счёту из выписки
    if (apiStatement.payments) {
      for (const apiTransaction of apiStatement.payments) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }
  }))

  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
