import {
  AuthError,
  getAccounts,
  getAccountsTransactions,
  getHumoCards,
  getHumoCardsTransactions,
  getUzcardCards,
  getUzcardCardsTransactions,
  getVisaCards,
  getVisaCardsTransactions,
  getUzumVisaCards,
  getUzumVisaCardsTransactions,
  getWallets,
  getWalletsTransactions,
  getMastercardCards,
  getMastercardCardsTransactions
} from './api'
import { coldAuth, refreshToken } from './auth'

export async function scrape ({ preferences, fromDate, toDate, isFirstRun }) {
  /**
   * FIRST RUN STEPS
   */
  if (isFirstRun) {
    await coldAuth(preferences)
  }

  /**
   * REGULAR STEPS - Get accounts
   */
  let uzcardCards
  try {
    uzcardCards = await getUzcardCards()
  } catch (e) {
    if (e instanceof AuthError) {
      try {
        console.info('try to refresh token')
        await refreshToken(ZenMoney.getData('authRefreshToken'))
        uzcardCards = await getUzcardCards()
      } catch (ex) {
        if (e instanceof AuthError) {
          console.info('try to do cold auth')
          await coldAuth(preferences)
          uzcardCards = await getUzcardCards()
        } else {
          throw e
        }
      }
    } else {
      throw e
    }
  }
  const humoCards = await getHumoCards()
  const visaCards = await getVisaCards()
  const uzumVisaCards = await getUzumVisaCards()
  const mastercardCards = await getMastercardCards()
  const wallets = await getWallets()
  const accounts = await getAccounts()

  /**
   * REGULAR STEPS - Get transactions
   */
  const from = fromDate.getTime()
  const to = (toDate || new Date()).getTime()

  const uzcardCardsTransactions = await getUzcardCardsTransactions(uzcardCards, from, to)
  const humoCardsTransactions = await getHumoCardsTransactions(humoCards, from, to)
  const visaCardsTransactions = await getVisaCardsTransactions(visaCards, from, to)
  const uzumVisaCardsTransactions = await getUzumVisaCardsTransactions(uzumVisaCards, from, to)
  const mastercardCardsTransactions = await getMastercardCardsTransactions(mastercardCards, from, to)
  const walletTransactions = await getWalletsTransactions(wallets, from, to)
  const accountTransactions = await getAccountsTransactions(accounts, from, to)

  /**
   * LAST STEP - Unloading
   */
  return {
    accounts: [
      ...uzcardCards,
      ...humoCards,
      ...visaCards,
      ...uzumVisaCards,
      ...mastercardCards,
      ...wallets,
      ...accounts
    ],
    transactions: [
      ...uzcardCardsTransactions,
      ...humoCardsTransactions,
      ...visaCardsTransactions,
      ...uzumVisaCardsTransactions,
      ...mastercardCardsTransactions,
      ...walletTransactions,
      ...accountTransactions
    ]
  }
}
