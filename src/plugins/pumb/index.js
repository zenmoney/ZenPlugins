import { TemporaryUnavailableError } from '../../errors'
import { fetchAccounts, fetchTransactionsNew, generateDevice, login, logout } from './api'
import { convertAccount, convertDeposit, convertLoan, convertTransaction } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  toDate = toDate || new Date()

  const lastSync = ZenMoney.getData('lastSync')
  if (lastSync && isInBackground && (new Date()).getTime() - lastSync < 3600000) {
    throw new TemporaryUnavailableError('Last sync was less than in hour ago')
  }
  let device = ZenMoney.getData('device')
  if (!device) {
    device = generateDevice(preferences.login)
    ZenMoney.setData('device', device)
  }

  const accounts = []
  const transactions = []
  let auth
  try {
    auth = await login(preferences, device)
    const accountsInfo = await fetchAccounts(auth)
    await Promise.all(accountsInfo.accounts.map(convertAccount).map(async ({ account, mainProduct }) => {
      accounts.push(account)
      if (ZenMoney.isAccountSkipped(account.id)) {
        return
      }
      for (const apiTransaction of (await fetchTransactionsNew(auth, mainProduct, fromDate, toDate))) {
        const transaction = convertTransaction(apiTransaction, account)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }))
    const startDate = new Date()
    for (const apiDeposit of accountsInfo.deposits) {
      const deposit = convertDeposit(apiDeposit, startDate)
      if (deposit) {
        accounts.push(deposit)
      }
    }
    accounts.push(...accountsInfo.loans.map(convertLoan))
  } finally {
    await logout(auth)
  }

  ZenMoney.setData('lastSync', (new Date()).getTime())
  ZenMoney.saveData()
  return {
    accounts,
    transactions
  }
}
