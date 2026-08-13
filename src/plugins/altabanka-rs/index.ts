import { Account, ScrapeFunc, Transaction } from '../../types/zenmoney'
import { UserInteractionError } from '../../errors'
import { AccountInfo, Preferences } from './models'
import { convertAccounts, convertTransaction, deduplicateTransactions } from './converters'
import { fetchAccounts, fetchCardReservedTransactions, fetchCardTransactions, fetchCards, fetchReservedTransactions, fetchTransactions, login } from './api'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate, isInBackground }) => {
  if (isInBackground) {
    // Login requires a one-time code from the mobile app, so it cannot run unattended.
    throw new UserInteractionError()
  }
  toDate = toDate ?? new Date()

  const session = await login(preferences)

  const apiAccounts = await fetchAccounts(session)
  const convertedAccounts: Account[] = convertAccounts(apiAccounts)
  const transactions: Transaction[] = []

  const findAccount = (accountNumber: string, currency: string): AccountInfo | undefined =>
    apiAccounts.find(a => a.accountNumber === accountNumber && a.currency === currency) ??
    apiAccounts.find(a => a.accountNumber === accountNumber)

  // Currencies the customer holds across all accounts. Card spending in a foreign
  // currency is settled into one of these, so we query card turnover for each of them
  // (in addition to the card's own currencies) to not miss e.g. USD operations.
  const customerCurrencies = [...new Set(apiAccounts.map(a => a.currency))]

  // Non-card account operations (transfers, fees, incoming payments). Card operations
  // are excluded here and fetched from card turnover (it carries the real transaction date).
  await Promise.all(apiAccounts.map(async (account) => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }

    const apiTransactions = await fetchTransactions(session, account, fromDate, toDate ?? new Date())
    transactions.push(...apiTransactions
      .map(t => convertTransaction(t, account))
      .filter((tx): tx is Transaction => tx !== null))
  }))

  // Card operations (with real transaction date) per card.
  const cards = await fetchCards(session)
  await Promise.all(cards.map(async (card) => {
    const account = findAccount(card.accountNumber, card.currency)
    if (account === undefined || ZenMoney.isAccountSkipped(account.id)) {
      return
    }

    const currencies = [...new Set([...card.turnoverCurrencies, ...customerCurrencies])]
    const apiTransactions = await fetchCardTransactions(session, card, currencies, fromDate, toDate ?? new Date())
    transactions.push(...apiTransactions
      .map(t => convertTransaction(t, account))
      .filter((tx): tx is Transaction => tx !== null))

    // Pending card authorizations (all currencies, incl. foreign like HUF) live in a
    // card-specific reserved funds endpoint.
    const reservedCardTransactions = await fetchCardReservedTransactions(session, card, fromDate)
    transactions.push(...reservedCardTransactions
      .map(t => convertTransaction(t, account, true))
      .filter((tx): tx is Transaction => tx !== null))
  }))

  // Pending (reserved funds) authorizations live in a separate endpoint per account number.
  const reservedAccounts = [...new Map(apiAccounts.map(a => [a.accountNumber, a])).values()]
  await Promise.all(reservedAccounts.map(async (account) => {
    if (ZenMoney.isAccountSkipped(account.id)) {
      return
    }

    const reservedTransactions = await fetchReservedTransactions(session, account, fromDate)
    transactions.push(...reservedTransactions
      .map(t => convertTransaction(t, account, true))
      .filter((tx): tx is Transaction => tx !== null))
  }))

  return {
    accounts: convertedAccounts,
    transactions: deduplicateTransactions(transactions)
  }
}
