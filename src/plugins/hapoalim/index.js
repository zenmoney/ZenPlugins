import { adjustTransactions } from '../../common/transactionGroupHandler'
import { ZPAPIError } from '../../errors'
import { fetchAccounts, fetchTransactions, isLikelyAuthGateError, login, normalizeStoredAuth } from './api'
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

function createForegroundReauthError (isInBackground) {
  return new ZPAPIError(
    isInBackground
      ? 'Bank Hapoalim session expired. Run sync manually in foreground and complete login in the official bank page.'
      : 'Bank Hapoalim requires login in the official bank page. Complete the opened bank login flow and retry sync.',
    false,
    false
  )
}

function resetStoredAuth () {
  ZenMoney.setData('auth', null)
  ZenMoney.saveData()
}

function rethrowForegroundReauthIfNeeded (error, isInBackground) {
  if (isLikelyAuthGateError(error)) {
    throw createForegroundReauthError(isInBackground)
  }
  throw error
}

async function withForegroundReauthRetry (fn, state) {
  try {
    return await fn(state.auth)
  } catch (error) {
    if (!isLikelyAuthGateError(error)) {
      throw error
    }

    resetStoredAuth()
    if (state.isInBackground) {
      throw createForegroundReauthError(true)
    }

    state.auth = await login()
    ZenMoney.setData('auth', state.auth)
    ZenMoney.saveData()

    try {
      return await fn(state.auth)
    } catch (retryError) {
      resetStoredAuth()
      rethrowForegroundReauthIfNeeded(retryError, state.isInBackground)
    }
  }
}

async function getAuthorizedAccounts (isInBackground) {
  const state = {
    auth: normalizeStoredAuth(ZenMoney.getData('auth')),
    isInBackground
  }

  if (state.auth) {
    try {
      const apiAccounts = await fetchAccounts(state.auth)
      ZenMoney.setData('auth', state.auth)
      ZenMoney.saveData()
      return { state, apiAccounts }
    } catch (error) {
      if (!isLikelyAuthGateError(error)) {
        throw error
      }
      resetStoredAuth()
    }
  }

  if (isInBackground) {
    throw createForegroundReauthError(true)
  }

  state.auth = await login()
  ZenMoney.setData('auth', state.auth)
  ZenMoney.saveData()

  try {
    const apiAccounts = await fetchAccounts(state.auth)
    return { state, apiAccounts }
  } catch (error) {
    resetStoredAuth()
    rethrowForegroundReauthIfNeeded(error, isInBackground)
  }
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground, isFirstRun }) {
  ZenMoney.locale = 'he'

  toDate = toDate || new Date()
  fromDate = fromDate || getFallbackFromDate(preferences, toDate)

  const { state, apiAccounts } = await getAuthorizedAccounts(isInBackground)
  const accounts = []
  const seenAccountIds = new Set()
  const transactions = []

  for (const { mainProduct, account } of convertAccounts(apiAccounts)) {
    if (seenAccountIds.has(account.id)) {
      continue
    }
    seenAccountIds.add(account.id)
    accounts.push(account)

    if (!mainProduct || ZenMoney.isAccountSkipped(account.id)) {
      continue
    }

    const apiTransactions = await withForegroundReauthRetry(
      async auth => await fetchTransactions(auth, mainProduct, fromDate, toDate),
      state
    )

    for (const apiTransaction of apiTransactions) {
      const transaction = convertTransaction(apiTransaction, account)
      if (transaction) {
        transactions.push(transaction)
      }
    }
  }

  ZenMoney.setData('auth', state.auth)
  ZenMoney.saveData()

  if (isFirstRun && ZenMoney.alert) {
    await ZenMoney.alert('לקבלת תוצאות מיטביות, אנו ממליצים לא לסנכרן כרטיסי כאל, ישראקרט ומקס דרך הבנק אלא ישירות דרך חברות האשראי.')
  }

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
