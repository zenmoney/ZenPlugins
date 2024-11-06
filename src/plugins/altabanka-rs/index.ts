import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { Preferences } from './types'
import { convertAccounts, convertTransaction } from './converters'
import { altaBankaApi } from './api'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  await altaBankaApi.login(preferences, isInBackground)

  const apiAccounts = await altaBankaApi.fetchAccounts()
  const convertedAccounts: Account[] = convertAccounts(apiAccounts.filter(a => a.cardNumber === ''))
  const transactions: Transaction[] = []

  const token = await altaBankaApi.fetchVerificationToken()

  await Promise.all(apiAccounts.map(async (account) => {
    if (ZenMoney.isAccountSkipped(account.accountNumber)) {
      return
    }

    let page = 1
    if (account.cardNumber === '') {
      while (page < 100) {
        const apiTransactions = await altaBankaApi.fetchTransactions(account.id, token, page, fromDate, toDate)

        if (apiTransactions.length === 0) {
          break
        }

        page++

        transactions.push(...apiTransactions.map(t => convertTransaction(t, account)))
      }
    }

    if (account.cardNumber !== '') {
      account.id = account.accountNumber
      page = 1

      while (page < 100) {
        const apiCardTransactions = await altaBankaApi.fetchCardTransactions(account.accountNumber, account.cardNumber, token, page, fromDate, toDate)

        if (apiCardTransactions.length === 0) {
          break
        }

        page++

        transactions.push(...apiCardTransactions.map(t => convertTransaction(t, account, true)))
      }
    }
  }))

  return {
    accounts: convertedAccounts,
    transactions
  }
}
