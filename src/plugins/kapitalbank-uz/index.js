import {
  checkUser,
  getAccounts,
  getAccountsTransactions,
  getHumoCards,
  getHumoCardsTransactions,
  getToken,
  getUzcardCards,
  getUzcardCardsTransactions,
  getVisaCards,
  getVisaCardsTransactions,
  getWallets,
  getWalletsTransactions,
  registerDevice,
  sendSmsCode
} from './api'

export async function scrape ({ preferences, fromDate, toDate, isFirstRun }) {
  /**
   * FIRST RUN STEPS
   */
  if (isFirstRun) {
    await registerDevice()
    await updateToken(preferences.pan, preferences.expiry, preferences.password)
  }

  try {
    return await doScrape(fromDate, toDate)
  } catch {
    await updateToken(preferences.pan, preferences.expiry, preferences.password)
    return await doScrape(fromDate, toDate)
  }
}

async function updateToken (pan, expiry, password) {
  const phone = await checkUser(pan, expiry)
  await sendSmsCode(pan, expiry, password)
  const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения')
  await getToken(phone, smsCode)
}

async function doScrape (fromDate, toDate) {
  /**
   * REGULAR STEPS - Get accounts
   */
  const uzcardCards = await getUzcardCards()
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
