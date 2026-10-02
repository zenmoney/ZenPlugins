import { adjustTransactions } from '../../common/transactionGroupHandler'
import { ZPAPIError } from '../../errors'
import { fetchAccounts, fetchTransactions, isLikelyAuthGateError, isSessionDeadlineError, login, normalizeStoredAuth, recoverAuthFromCookieStore, withSessionDeadline } from './api'
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

function storeAuth (state) {
  ZenMoney.setData('auth', state.auth)
  ZenMoney.saveData()
}

async function saveCookieStore () {
  if (typeof ZenMoney.saveCookies === 'function') {
    await withSessionDeadline(() => ZenMoney.saveCookies(), 'cookie store save')
  }
}

async function withForegroundReauthRetry (fn, state) {
  let attemptedRecovery = false
  let confirmedAuthGate = false
  let originalAuthError
  // At most one silent recovery and one interactive login per operation.
  while (true) {
    if (state.auth) {
      try {
        return await fn(state.auth)
      } catch (error) {
        originalAuthError = error
        confirmedAuthGate = isLikelyAuthGateError(error)
        if (!confirmedAuthGate && !isLikelyAuthGateError(error, { allowAuthSuspect: !state.isInBackground })) {
          throw error
        }
      }
    }

    if (!attemptedRecovery) {
      attemptedRecovery = true
      const recoveredAuth = await recoverAuthFromCookieStore(state.auth, { allowAuthSuspect: !state.isInBackground })
      if (recoveredAuth) {
        state.auth = recoveredAuth
        storeAuth(state)
        continue
      }
    }

    if (confirmedAuthGate) {
      state.auth = null
      storeAuth(state)
    }
    if (state.isInBackground || state.didInteractiveLogin) {
      if (!confirmedAuthGate && originalAuthError) {
        throw originalAuthError
      }
      throw createForegroundReauthError(state.isInBackground)
    }

    state.didInteractiveLogin = true
    state.auth = await login()
    storeAuth(state)
  }
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground, isFirstRun }) {
  ZenMoney.locale = 'he'

  toDate = toDate || new Date()
  fromDate = fromDate || getFallbackFromDate(preferences, toDate)

  if (typeof ZenMoney.restoreCookies === 'function') {
    try {
      await withSessionDeadline(() => ZenMoney.restoreCookies(), 'cookie store restore')
    } catch (error) {
      if (isSessionDeadlineError(error)) {
        throw error
      }
      console.warn('Bank Hapoalim cookie store restore failed; trying persisted auth')
    }
  }
  const state = {
    auth: normalizeStoredAuth(ZenMoney.getData('auth')),
    isInBackground,
    didInteractiveLogin: false
  }
  const accounts = []
  const seenAccountIds = new Set()
  const transactions = []

  try {
    const apiAccounts = await withForegroundReauthRetry(fetchAccounts, state)
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
  } catch (error) {
    storeAuth(state)
    try {
      await saveCookieStore()
    } catch (saveError) {
      console.warn('Bank Hapoalim cookie store save failed after sync error')
    }
    throw error
  }
  storeAuth(state)
  try {
    await saveCookieStore()
  } catch (error) {
    console.warn('Bank Hapoalim cookie store save failed after successful sync; auth snapshot is saved')
  }

  if (isFirstRun && ZenMoney.alert) {
    await ZenMoney.alert('לקבלת תוצאות מיטביות, אנו ממליצים לא לסנכרן כרטיסי כאל, ישראקרט ומקס דרך הבנק אלא ישירות דרך חברות האשראי.')
  }

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
