import moment from 'moment'
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

export async function scrape ({ preferences, fromDate, toDate }) {
  const isFirstRun = ZenMoney.getData('isFirstRun', true)

  /**
   * FIRST RUN STEPS
   */
  if (isFirstRun) {
    await registerDevice()
    await checkUser(preferences.phone)
    await sendSmsCode(preferences.phone, preferences.password)

    const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения')

    await getToken(preferences.phone, smsCode)
  }

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
  let from, to

  if (isFirstRun) {
    from = preferences.startDate
  } else if (ZenMoney.getData('scrape/lastSuccessDate')) {
    from = ZenMoney.getData('scrape/lastSuccessDate')
  } else if (fromDate) {
    from = fromDate
  } else {
    from = '2020-01-01T00:00:00.000Z'
  }

  from = moment(from).valueOf()

  if (toDate) {
    to = moment(toDate, moment.ISO_8601).valueOf()
  } else {
    to = moment().valueOf()
  }

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
