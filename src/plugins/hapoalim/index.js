import { adjustTransactions } from '../../common/transactionGroupHandler'
import { restoreCookies, saveCookies, cookieJar } from '../../common/network/cookies'
import { authenticationMethod, authGateSummary, fetchAccounts, fetchTransactions, getAuthGateVerifier, isLikelyAuthGateError, login, loginDirect, isMobileAuth, normalizeStoredAuth, normalizeDirectAuthLifecycle, recoverAuthFromCookieStore, recoverDirectAuth, withAuthUpdates, withSessionDeadline } from './api'
import { convertAccounts, convertTransaction } from './converters'
import { dateInTimezone, toISODateString } from '../../common/dateUtils'

async function storeAuth (state) {
  if (state.direct) {
    if (isMobileAuth(state.auth)) {
      state.directIdentity = state.auth.identity
      // Keep the accounts-proof time even when saving after a later network error.
      state.authLifecycle = { version: 1, kind: 'verified', reason: null, httpStatus: null, updatedAt: state.auth.acquiredAt }
    }
    // Keep the connection binding even after rejected session cookies are gone.
    ZenMoney.setData('directIdentity', state.directIdentity ?? null)
    if (state.authLifecycle) ZenMoney.setData('directAuthLifecycleV1', { ...state.authLifecycle })
  }
  ZenMoney.setData('auth', state.auth ? { ...state.auth } : null)
  await withSessionDeadline(() => ZenMoney.saveData(), 'auth state save')
}

async function saveCookieStore () {
  await withSessionDeadline(() => saveCookies(), 'cookie store save')
}

async function invalidateDirectSession (state, error) {
  if (!state.direct || !isMobileAuth(state.auth)) return
  const summary = authGateSummary(error)
  console.log('Bank Hapoalim direct session rejected', summary)
  state.authLifecycle = { version: 1, kind: 'rejected', ...summary, updatedAt: Date.now() }
  state.auth = null
  state.directCookieSnapshot = null
  await storeAuth(state)
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
    if (state.auth && (!state.direct || isMobileAuth(state.auth))) {
      try {
        return await withAuthUpdates(state.auth, onAuthUpdate, fn)
      } catch (error) {
        originalAuthError = error
        if (!isLikelyAuthGateError(error)) throw error
        // Persist confirmed revocation before background exit or foreground input.
        await invalidateDirectSession(state, error)
      }
    }

    const rejectedCookieHeader = originalAuthError?.isAccountsResponse &&
      originalAuthError.responseSummary?.status === 401 && originalAuthError.responseSummary.errCode === 'STEPUPOTP'
      ? state.auth?.cookieHeader || null
      : null
    if (rejectedCookieHeader) state.rejectedCookieHeaders.add(rejectedCookieHeader)
    const rejectedCookieHeaders = rejectedCookieHeader ? state.rejectedCookieHeaders : []
    if (!attemptedRecovery) {
      attemptedRecovery = true
      const recoveryOptions = {
        onAuthUpdate,
        previousIdentity: state.statementIdentity ?? state.directIdentity,
        rejectedCookieHeader,
        rejectedCookieHeaders,
        verify: getAuthGateVerifier(originalAuthError)
      }
      const recoveredAuth = state.direct
        ? await recoverDirectAuth(state.auth && isMobileAuth(state.auth) ? null : state.directCookieSnapshot, recoveryOptions)
        : await recoverAuthFromCookieStore(state.auth, recoveryOptions)
      if (recoveredAuth) {
        state.auth = recoveredAuth
        await storeAuth(state)
        continue
      }
    }

    if (attemptedHiddenWebView && state.didInteractiveLogin) throw originalAuthError || new Error('Bank Hapoalim authentication did not produce a usable session')
    const skipHidden = attemptedHiddenWebView
    attemptedHiddenWebView = true
    const authorize = state.direct ? loginDirect : login
    const allowInteraction = !state.didInteractiveLogin && (!state.direct || !state.didDirectLogin)
    if (state.direct) state.didDirectLogin = true
    try {
      state.auth = await authorize({
        preferences: state.preferences,
        previousIdentity: state.statementIdentity ?? state.directIdentity,
        isInBackground: state.isInBackground,
        allowInteraction,
        skipHidden,
        verify: getAuthGateVerifier(originalAuthError),
        interactionError: originalAuthError,
        rejectedCookieHeader,
        rejectedCookieHeaders,
        onAuthUpdate,
        onInteraction: () => { state.didInteractiveLogin = true }
      })
    } catch (error) {
      // Login also verifies the original challenged endpoint. Its rejection
      // must invalidate the fresh accounts-only session, not persist it as valid.
      if (isLikelyAuthGateError(error)) await invalidateDirectSession(state, error)
      throw error
    }
    await storeAuth(state)
  }
}

export async function scrape ({ preferences, fromDate, toDate, isInBackground, isFirstRun }) {
  ZenMoney.locale = 'ru'
  const direct = authenticationMethod(preferences) === 'direct'

  const upperDate = toDate
  toDate = toDate || new Date()
  if (!(fromDate instanceof Date) || !(toDate instanceof Date) || !Number.isFinite(fromDate.getTime()) || !Number.isFinite(toDate.getTime()) || fromDate > toDate) {
    throw new Error('unexpected history interval')
  }
  const fromDay = toISODateString(dateInTimezone(fromDate, 120))
  const upperDay = upperDate ? toISODateString(dateInTimezone(upperDate, 120)) : null

  const storedAuth = normalizeStoredAuth(ZenMoney.getData('auth'))
  const auth = !direct && isMobileAuth(storedAuth) ? null : storedAuth
  const storedIdentity = direct ? ZenMoney.getData('directIdentity') : null
  const authLifecycle = direct ? normalizeDirectAuthLifecycle(ZenMoney.getData('directAuthLifecycleV1')) : null
  if (storedIdentity != null && (typeof storedIdentity !== 'string' || !/^[a-f0-9]{64}$/.test(storedIdentity))) {
    throw new Error('Bank Hapoalim stored account identity is invalid')
  }
  if (direct) {
    console.log('Bank Hapoalim direct auth state', {
      authKind: isMobileAuth(auth) ? 'mobile' : auth ? 'legacy' : 'missing',
      checkpoint: authLifecycle?.kind ?? 'unknown',
      reason: authLifecycle?.reason ?? null,
      hasIdentityBinding: isMobileAuth(auth) || storedIdentity != null
    })
  }
  if (!isMobileAuth(auth)) await withSessionDeadline(() => restoreCookies(), 'cookie store restore')
  const directCookieSnapshot = direct && !isMobileAuth(auth)
    ? JSON.stringify(await withSessionDeadline(() => cookieJar.serialize(), 'legacy cookie store read'))
    : null
  const state = {
    auth,
    direct,
    preferences,
    authLifecycle,
    directIdentity: direct && isMobileAuth(auth) ? auth.identity : storedIdentity ?? undefined,
    directCookieSnapshot,
    isInBackground,
    didInteractiveLogin: false,
    didDirectLogin: false,
    rejectedCookieHeaders: new Set()
  }
  const accounts = []
  const transactions = []

  try {
    const loadAccounts = state.direct
      ? async auth => await fetchAccounts(auth, {
        onIdentity: identity => {
          if (state.statementIdentity !== undefined && state.statementIdentity !== identity) throw new Error('Bank Hapoalim account set changed within a statement')
          state.statementIdentity = identity
        }
      })
      : fetchAccounts
    const apiAccounts = await withForegroundReauthRetry(loadAccounts, state)
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
      if (!isMobileAuth(state.auth)) await saveCookieStore()
    } catch (saveError) {
      console.warn('Bank Hapoalim cookie store save failed after sync error')
    }
    throw error
  }
  await storeAuth(state)
  if (!isMobileAuth(state.auth)) await saveCookieStore()

  if (isFirstRun && !isInBackground && ZenMoney.alert) {
    await ZenMoney.alert('Рекомендуем подключать карты Cal, Isracard и Max напрямую к платёжным компаниям, а не через банк.')
  }

  return {
    accounts,
    transactions: adjustTransactions({ transactions })
  }
}
