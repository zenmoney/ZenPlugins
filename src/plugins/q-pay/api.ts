import { TemporaryError } from '../../errors'
import { Account, Transaction } from '../../types/zenmoney'
import { convertCards, convertTransactions, convertWallets, isOpenCard } from './converters'
import {
  fetchCardBalance,
  fetchCardTransactions,
  fetchCards,
  fetchCurrentUser,
  fetchWalletTransactions,
  login,
  SessionExpiredError
} from './fetchApi'
import { isSessionFor, Preferences, QPayCardTransactions, QPayCardWithBalance, Session } from './models'

export interface ScrapeOutput {
  accounts: Account[]
  transactions: Transaction[]
  session: Session
}

interface QPayData {
  accounts: Account[]
  transactions: Transaction[]
}

async function loadData (session: Session, fromDate: Date, toDate: Date): Promise<QPayData> {
  const [user, cards] = await Promise.all([
    fetchCurrentUser(session),
    fetchCards(session)
  ])
  const openCards = cards.filter(isOpenCard)
  const cardBalancesPromise: Promise<QPayCardWithBalance[]> = Promise.all(openCards.map(async card => ({
    card,
    balance: await fetchCardBalance(session, card.id)
  })))
  const cardTransactionsPromise: Promise<QPayCardTransactions[]> = Promise.all(openCards.map(async card => ({
    cardId: card.id,
    transactions: await fetchCardTransactions(session, card.id, fromDate, toDate)
  })))
  const [cardsWithBalances, walletTransactions, cardTransactions] = await Promise.all([
    cardBalancesPromise,
    fetchWalletTransactions(session, fromDate, toDate),
    cardTransactionsPromise
  ])
  const walletAccounts = convertWallets(user.wallets)
  const cardAccounts = convertCards(cardsWithBalances)
  return {
    accounts: [...walletAccounts, ...cardAccounts],
    transactions: convertTransactions(walletTransactions, cardTransactions, user.wallets, cardAccounts)
  }
}

/** Load Q-Pay accounts, re-authenticating once when a persisted session has expired. */
export async function scrapeQPay (
  preferences: Preferences,
  storedSession: unknown,
  fromDate: Date,
  toDate: Date = new Date()
): Promise<ScrapeOutput> {
  let session = isSessionFor(storedSession, preferences.email)
    ? storedSession
    : await login(preferences)

  let data: QPayData
  try {
    data = await loadData(session, fromDate, toDate)
  } catch (error) {
    if (!(error instanceof SessionExpiredError)) {
      throw error
    }
    session = await login(preferences)
    try {
      data = await loadData(session, fromDate, toDate)
    } catch (retryError) {
      if (retryError instanceof SessionExpiredError) {
        throw new TemporaryError('Q-Pay отклонил новую сессию; повторите синхронизацию позже')
      }
      throw retryError
    }
  }

  return { ...data, session }
}
