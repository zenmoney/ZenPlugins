import ClickPluginApi from './api'
import { convertAccounts, convertTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate, isFirstRun }) {
  const api = new ClickPluginApi()
  await api.connect()

  /**
   * FIRST RUN STEPS
   */
  if (isFirstRun) {
    await api.registerDevice(preferences.phone)

    const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения')

    await api.confirmDevice(preferences.phone, smsCode)
  }

  /**
   * REGULAR STEPS - Get accounts and transactions
   */
  const from = fromDate
  const to = toDate || new Date()
  await api.login(preferences.phone, preferences.password)
  const apiAccounts = await api.getAccounts(preferences.phone)
  const accounts = convertAccounts(apiAccounts, await api.getAccountsBalances(preferences.phone, apiAccounts))
  const transactions = convertTransactions(await api.getTransactions(preferences.phone, from, to), accounts)

  /**
   * LAST STEP - Unloading
   */
  await api.disconnect()
  return {
    accounts: accounts,
    transactions: transactions
  }
}
