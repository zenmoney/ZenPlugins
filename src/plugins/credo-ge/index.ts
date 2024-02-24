import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { fetchAccounts, fetchTransactions, login } from './api'
import { fetchCards, fetchDeposits, fetchLoans } from './fetchApi'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  const session = await login(preferences, ZenMoney.getData('auth') as Auth | undefined)
  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  const transactions: Transaction[] = []

  const credoAccounts = await fetchAccounts(session)
  const credoCards = await fetchCards(session)
  const credoDeposits = await fetchDeposits(session)
  const credoLoans = await fetchLoans(session)
  const accounts: Account[] = convertAccounts(credoAccounts, credoCards, credoDeposits, credoLoans)

  for (const account of accounts) {
    console.log(account)
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }
    console.log('>>> Getting transactions for account: ' + account.id)
    const apiTransactions = await fetchTransactions(session, account.id, fromDate, toDate)
    for (const apiTransaction of apiTransactions) {
      transactions.push(convertTransaction(apiTransaction, account))
    }
  }

  console.log('scrape result: ', { accounts, transactions })

  return { accounts, transactions }
}
