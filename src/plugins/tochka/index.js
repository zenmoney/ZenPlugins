import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchStatement, login } from './api'
import { convertAccount, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  if (!toDate) {
    toDate = new Date()
  }

  const auth = await login(ZenMoney.getData('auth'), preferences)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accounts = []
  const transactions = []

  await Promise.all((await fetchAccounts(auth, preferences)).map(async apiAccount => {
    const account = convertAccount(apiAccount)
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiStatement = await fetchStatement(auth, apiAccount, fromDate, toDate, preferences)
    // остаток на счету на конец периода в выписке
    if (apiStatement.balance_closing) {
      account.balance = Number(apiStatement.balance_closing)
    }
    // операции по счёту из выписки
    if (apiStatement.payments) {
      apiStatement.payments.forEach(apiTransaction => {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      })
    }
  }))

  return {
    accounts: ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId }),
    transactions: adjustTransactions({ transactions })
  }
}
