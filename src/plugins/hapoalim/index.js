import { adjustTransactions } from '../../common/transactionGroupHandler'
import { restoreCookies, saveCookies } from '../../common/network/cookies'
import { fetchAccounts, fetchTransactions, getAuthGateVerifier, isLikelyAuthGateError, login, normalizeStoredAuth, recoverAuthFromCookieStore, withAuthUpdates, withSessionDeadline } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { dateInTimezone, toISODateString } from '../../common/dateUtils'

async function storeAuth (state) {
  ZenMoney.setData('auth', state.auth ? { ...state.auth } : null)
  await withSessionDeadline(() => ZenMoney.saveData(), 'auth state save')
}

async function saveCookieStore () {
  await withSessionDeadline(() => saveCookies(), 'cookie store save')
}

async function withForegroundReauthRetry (fn, state) {
  let attemptedRecovery = false
  let attemptedHiddenWebView = false
  let originalAuthError
  const onAuthUpdate = async auth => {
    state.auth = auth
    await storeAuth(state)
  }
  // At most one silent recovery and one interactive login per operation.
  while (true) {
    if (state.auth) {
      try {
        return await withAuthUpdates(state.auth, onAuthUpdate, fn)
      } catch (error) {
        originalAuthError = error
        if (!isLikelyAuthGateError(error)) throw error
      }
    }

    if (!attemptedRecovery) {
      attemptedRecovery = true
      const recoveredAuth = await recoverAuthFromCookieStore(state.auth, {
        onAuthUpdate,
        verify: getAuthGateVerifier(originalAuthError)
      })
      if (recoveredAuth) {
        state.auth = recoveredAuth
        await storeAuth(state)
        continue
      }
    }

    if (attemptedHiddenWebView && state.didInteractiveLogin) throw originalAuthError || new Error('Bank Hapoalim authentication did not produce a usable session')
    const skipHidden = attemptedHiddenWebView
    attemptedHiddenWebView = true
    state.auth = await login({
      isInBackground: state.isInBackground,
      allowInteraction: !state.didInteractiveLogin,
      skipHidden,
      verify: getAuthGateVerifier(originalAuthError),
      interactionError: originalAuthError,
      onAuthUpdate,
      onInteraction: () => { state.didInteractiveLogin = true }
    })
    await storeAuth(state)
  }
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground, isFirstRun }) {
  ZenMoney.locale = 'he'

  const upperDate = toDate
  toDate = toDate || new Date()
  if (!(fromDate instanceof Date) || !(toDate instanceof Date) || !Number.isFinite(fromDate.getTime()) || !Number.isFinite(toDate.getTime()) || fromDate > toDate) {
    throw new Error('unexpected history interval')
  }
  const fromDay = toISODateString(dateInTimezone(fromDate, 120))
  const upperDay = upperDate ? toISODateString(dateInTimezone(upperDate, 120)) : null

  await withSessionDeadline(() => restoreCookies(), 'cookie store restore')
  const state = {
    auth: normalizeStoredAuth(ZenMoney.getData('auth')),
    isInBackground,
    didInteractiveLogin: false
  }
  const accounts = []
  const transactions = []

  try {
    const apiAccounts = await withForegroundReauthRetry(fetchAccounts, state)
    for (const { mainProduct, account } of convertAccounts(apiAccounts)) {
      accounts.push(account)

      if (!mainProduct || ZenMoney.isAccountSkipped(account.id)) {
        continue
      }

      const apiTransactions = await withForegroundReauthRetry(
        async auth => await fetchTransactions(auth, mainProduct, fromDate, toDate),
        state
      )

      for (const apiTransaction of apiTransactions) {
        const transaction = convertTransaction(apiTransaction, account, mainProduct.type)
        const day = transaction && toISODateString(dateInTimezone(transaction.date, 120))
        if (transaction && day >= fromDay && (!upperDay || day <= upperDay)) {
          transactions.push(transaction)
        }
      }
    }
    if (accounts.length === 0) throw new Error('unexpected empty converted accounts inventory')
  } catch (error) {
    try {
      await storeAuth(state)
    } catch (saveError) {
      console.warn('Bank Hapoalim auth state save failed after sync error')
    }
    try {
      await saveCookieStore()
    } catch (saveError) {
      console.warn('Bank Hapoalim cookie store save failed after sync error')
    }
    throw error
  }
  await storeAuth(state)
  await saveCookieStore()

  if (isFirstRun && !isInBackground && ZenMoney.alert) {
    await ZenMoney.alert('לקבלת תוצאות מיטביות, אנו ממליצים לא לסנכרן כרטיסי כאל, ישראקרט ומקס דרך הבנק אלא ישירות דרך חברות האשראי.')
  }

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
