import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Preferences } from './models'
import { convertAccounts, convertTransaction } from './converters'
import { fetchAllAccounts, fetchAuthorization, fetchVerificationToken, fetchTransactions, fetchCardTransactions } from './fetchApi'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()
  await fetchAuthorization(preferences)

  const apiAccounts = await fetchAllAccounts()
  const convertedAccounts: Account[] = convertAccounts(apiAccounts.filter(a => a.cardNumber === ''))
  const transactions: Transaction[] = []

  const token = await fetchVerificationToken()

  for (const account of apiAccounts) {
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }

    let page = 1
    if (account.cardNumber === '') {
      while (page < 100) {
        const apiTransactions = await fetchTransactions(account.id, token, page, fromDate, toDate)

        if (apiTransactions.length === 0) {
          break
        }

        page++

        transactions.push(...apiTransactions.map(t => convertTransaction(t, account)).filter((tx): tx is Transaction => tx !== null))
      }
    }

    if (account.cardNumber !== '') {
      account.id = account.accountNumber
      page = 1

      while (page < 100) {
        const apiCardTransactions = await fetchCardTransactions(account.accountNumber, account.cardNumber, token, page, fromDate, toDate)

        if (apiCardTransactions.length === 0) {
          break
        }

        page++

        transactions.push(...apiCardTransactions.map(t => convertTransaction(t, account, true)).filter((tx): tx is Transaction => tx !== null))
      }
    }
  }

  return {
    accounts: convertedAccounts,
    transactions
  }
}
