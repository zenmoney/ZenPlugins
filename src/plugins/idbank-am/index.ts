import { Account, ExtendedTransaction, ScrapeFunc } from '../../types/zenmoney'
import { adjustTransactions } from '../../common/transactionGroupHandler'
import { fetchAccountTransactions } from './fetchApi'
import { fetchAllAccounts, login } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { Auth, Preferences } from './models'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  const session = await login(preferences, ZenMoney.getData('auth') as Auth | undefined, isInBackground)
  ZenMoney.setData('auth', session.auth)
  ZenMoney.saveData()

  const { accounts: apiAccounts, cards: apiCards } = await fetchAllAccounts(session)
  const converted = convertAccounts(apiAccounts, apiCards)
  // Нужно, чтобы отличить перевод между своими счетами от настоящей конвертации валюты
  const instrumentsByAccount: Record<string, string | undefined> = {}
  for (const { account } of converted) {
    instrumentsByAccount[account.id] = account.instrument
  }

  const accounts: Account[] = []
  const transactions: ExtendedTransaction[] = []

  for (const { account, accountNumber } of converted) {
    accounts.push(account)
    if (accountNumber == null || ZenMoney.isAccountSkipped(account.id)) {
      continue
    }
    const apiTransactions = await fetchAccountTransactions(accountNumber, fromDate, toDate ?? new Date(), session)
    for (const apiTransaction of apiTransactions) {
      transactions.push(convertTransaction(apiTransaction, account, instrumentsByAccount))
    }
  }

  return { accounts, transactions: adjustTransactions({ transactions }) }
}
