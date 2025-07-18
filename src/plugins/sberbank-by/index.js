import { adjustTransactions } from '../../common/transactionGroupHandler'
import { AuthError, fetchAccounts, fetchTransactions, generateDevice, login, updateToken } from './api'
import { convertAccounts, convertTransactions } from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  ZenMoney.locale = 'ru'
  toDate = toDate || new Date()
  let device = ZenMoney.getData('device')
  if (!device) {
    device = generateDevice()
    ZenMoney.setData('device', device)
    ZenMoney.saveData()
  }
  let auth = await login(preferences, device)
  if (auth.device.udid !== ZenMoney.getData('device').udid) {
    ZenMoney.setData('device', auth.device)
    ZenMoney.saveData()
  }
  let apiAccounts
  try {
    apiAccounts = await fetchAccounts(auth)
  } catch (error) {
    if (error instanceof AuthError) {
      auth = await updateToken(auth)
      apiAccounts = await fetchAccounts(auth)
    } else {
      throw error
    }
  }
  const accountsData = convertAccounts(apiAccounts)
  let apiTransactions
  try {
    apiTransactions = await fetchTransactions(auth, accountsData.products, fromDate, toDate)
  } catch (error) {
    if (error instanceof AuthError) {
      auth = await updateToken(auth)
      apiTransactions = await fetchTransactions(auth, accountsData.products, fromDate, toDate)
    } else {
      throw error
    }
  }

  const transactions = convertTransactions(apiTransactions, accountsData.accountsByContractNumber)
  const accounts = accountsData.accounts

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
