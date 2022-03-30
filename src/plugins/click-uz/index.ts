import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences } from './models'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccounts, fetchTransactions, login } from './api'

function migrate (): void {
  const sessionKey = ZenMoney.getData('sessionKey')
  const deviceId = ZenMoney.getData('deviceId')
  const deviceRegisterDateTime = ZenMoney.getData('deviceRegisterDateTime')
  if (sessionKey || deviceId || deviceRegisterDateTime) {
    ZenMoney.clearData()
  }
}

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const prevAuth = ZenMoney.getData('auth') as Auth | undefined
  if (!prevAuth) {
    migrate()
  }
  const auth = await login(preferences, prevAuth)
  ZenMoney.setData('auth', auth)
  ZenMoney.saveData()

  const accounts: Account[] = []
  const transactions: Transaction[] = []
  await Promise.all(convertAccounts(await fetchAccounts(auth)).map(async account => {
    accounts.push(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }
    const apiTransactions = await fetchTransactions(account.id, fromDate, toDate!, auth)
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
