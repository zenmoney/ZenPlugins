import {
  AuthError,
  coldAuth,
  getAccounts,
  getAccountsTransactions,
  getHumoCards,
  getHumoCardsTransactions,
  getUzcardCards,
  getUzcardCardsTransactions,
  getVisaCards,
  getVisaCardsTransactions,
  getWallets,
  getWalletsTransactions
} from './api'

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
      await coldAuth(preferences)
      uzcardCards = await getUzcardCards()
    } else {
      throw e
    }
  }
  const humoCards = await getHumoCards()
  const visaCards = await getVisaCards()
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
      ...wallets,
      ...accounts
    ],
    transactions: [
      ...uzcardCardsTransactions,
      ...humoCardsTransactions,
      ...visaCardsTransactions,
      ...walletTransactions,
      ...accountTransactions
    ]
  }
}
