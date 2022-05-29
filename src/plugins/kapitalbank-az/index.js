import {
  finalizeRegistration, getProducts, getProductsTransactions,
  getRegistrationData,
  login,
  startRegistrationByIB
} from './api'

export async function scrape ({ preferences, fromDate, toDate, isFirstRun }) {
  /**
   * FIRST RUN STEPS
   */
  if (isFirstRun) {
    await startRegistrationByIB(preferences.phone, preferences.password)
    const smsCode = await ZenMoney.readLine('Введите код из СМС сообщения')

    await getRegistrationData(smsCode)
    await finalizeRegistration(preferences.phone, preferences.password)
  }

  await login(ZenMoney.getData('phone'), ZenMoney.getData('password'))

  /**
   * REGULAR STEPS - Get accounts
   */
  const products = await getProducts()

  /**
   * REGULAR STEPS - Get transactions
   */
  const from = fromDate.toISOString()
  const to = (toDate || new Date()).toISOString()

  const productsTransactions = await getProductsTransactions(products, from, to)

  /**
   * LAST STEP - Unloading
   */
  return {
    accounts: [
      ...products
    ],
    transactions: [
      ...productsTransactions
    ]
  }
}
