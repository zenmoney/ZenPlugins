import { adjustTransactions } from '../../common/transactionGroupHandler'
import { ZPAPIError } from '../../errors'
import { fetchAccounts, fetchTransactions, generateDevice, login, isLikelyAuthGateError } from './api'
import { convertAccounts, convertTransaction } from './converters'

function getFallbackFromDate (preferences, toDate) {
  if (preferences?.startDate) {
    const parsedDate = new Date(preferences.startDate)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate
    }
  }

  const fallbackDate = new Date(toDate)
  fallbackDate.setMonth(fallbackDate.getMonth() - 3)
  return fallbackDate
}

function rethrowAuthGate (error, authState, isInBackground) {
  if (authState?.state === 'LOGONOTP' && isLikelyAuthGateError(error)) {
    throw new ZPAPIError(
      isInBackground
        ? 'Bank Hapoalim requested an additional verification step. Open the bank app/site, confirm the device and run sync manually in foreground.'
        : 'Bank Hapoalim requested an additional verification step. Confirm the device in the official bank app/site and retry sync.',
      false,
      false
    )
  }
  throw error
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground, isFirstRun }) {
  ZenMoney.locale = 'he'

  toDate = toDate || new Date()
  fromDate = fromDate || getFallbackFromDate(preferences, toDate)

  let device = ZenMoney.getData('device')
  if (!device) {
    device = generateDevice()
    ZenMoney.setData('device', device)
    ZenMoney.saveData()
  }

  const authState = await login(preferences, device)
  const accounts = []
  const seenAccountIds = new Set()
  const transactions = []

  let apiAccounts
  try {
    apiAccounts = await fetchAccounts()
  } catch (error) {
    rethrowAuthGate(error, authState, isInBackground)
  }

  for (const { mainProduct, account } of convertAccounts(apiAccounts)) {
    if (seenAccountIds.has(account.id)) {
      continue
    }
    seenAccountIds.add(account.id)
    accounts.push(account)

    if (!mainProduct || ZenMoney.isAccountSkipped(account.id)) {
      continue
    }

    let apiTransactions
    try {
      apiTransactions = await fetchTransactions(mainProduct, fromDate, toDate)
    } catch (error) {
      rethrowAuthGate(error, authState, isInBackground)
    }

    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }

  if (isFirstRun && ZenMoney.alert) {
    await ZenMoney.alert('לקבלת תוצאות מיטביות, אנו ממליצים לא לסנכרן כרטיסי כאל, ישראקרט ומקס דרך הבנק אלא ישירות דרך חברות האשראי.')
  }

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
