import i18n from 'i18next'
import _ from 'lodash'
import ru from '../../locales/ru.json'
import {
  BankMessageError,
  IncompatibleVersionError,
  InvalidLoginOrPasswordError,
  InvalidOtpCodeError,
  InvalidPreferencesError,
  PinCodeInsteadOfPasswordError,
  PreviousSessionNotClosedError,
  TemporaryError,
  TemporaryUnavailableError,
  ZPAPIError
} from '../errors'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId, trimSyncId } from './accounts'
import { toZenmoneyTransaction } from './converters'
import { isValidDate } from './dateUtils'
import { sanitize } from './sanitize'
import { isDebug } from './utils'

i18n.init({
  resources: {
    ru: { translation: ru }
  },
  fallbackLng: 'ru'
})

const MS_IN_MINUTE = 60 * 1000
const MS_IN_DAY = 24 * 60 * MS_IN_MINUTE
const MS_IN_WEEK = 7 * MS_IN_DAY

const SCRAPE_LAST_SUCCESS_DATE_KEY = 'scrape/lastSuccessDate'

const unsealSyncPromise = (promise) => {
  let state = 'pending'
  let value = null
  promise.then(
    resolveValue => {
      state = 'resolved'
      value = resolveValue
    },
    rejectValue => {
      state = 'rejected'
      value = rejectValue
    }
  )
  return { state, value }
}

const manualDateInputRegExp = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/

export const parseStartDateString = (startDateString) => {
  const manualDateInputMatch = startDateString.match(manualDateInputRegExp)
  if (manualDateInputMatch) {
    const [, dayString, monthString, yearString] = manualDateInputMatch
    return new Date(Number(yearString.length === 2 ? '20' + yearString : yearString), Number(monthString) - 1, Number(dayString), 0, 0, 0)
  }
  const dateWithoutTimezoneMatch = startDateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateWithoutTimezoneMatch) {
    const [, yearString, monthString, dayString] = dateWithoutTimezoneMatch
    return new Date(Number(yearString), Number(monthString) - 1, Number(dayString), 0, 0, 0)
  }
  return new Date(startDateString)
}

const getLastSuccessDate = () => {
  const lastSuccessDateString = ZenMoney.getData(SCRAPE_LAST_SUCCESS_DATE_KEY)
  if (lastSuccessDateString) {
    const lastSuccessDate = new Date(lastSuccessDateString)
    console.assert(isValidDate(lastSuccessDate), { lastSuccessDateString }, 'is not a valid date')
    return lastSuccessDate
  }
  return null
}

const calculateFromDate = (startDateString) => {
  console.assert(startDateString, 'preferences must contain "startDate"')
  const startDate = parseStartDateString(startDateString)
  console.assert(isValidDate(startDate), { startDateString }, 'is not a valid date')
  const lastSuccessDate = getLastSuccessDate()
  if (lastSuccessDate) {
    return new Date(Math.max(lastSuccessDate.getTime() - MS_IN_WEEK, startDate.getTime()))
  }
  return startDate
}

export function provideScrapeDates (fn) {
  console.assert(typeof fn === 'function', 'provideScrapeDates argument should be a function')

  return function scrapeWithDates (args) {
    const successAttemptDate = new Date().toISOString()
    const scrapeResult = fn({
      ...args,
      preferences: _.omit(args.preferences, ['startDate']),
      fromDate: calculateFromDate(args.preferences.startDate),
      toDate: null,
      isFirstRun: !ZenMoney.getData(SCRAPE_LAST_SUCCESS_DATE_KEY)
    })
    return scrapeResult.then((x) => {
      ZenMoney.setData(SCRAPE_LAST_SUCCESS_DATE_KEY, successAttemptDate)
      ZenMoney.saveData()
      return x
    })
  }
}

export function assertAccountIdsAreUnique (accounts) {
  const notUniqueIdCountPairs = _.toPairs(_.countBy(accounts, (x) => x.id)).filter(([id, count]) => count > 1)
  if (notUniqueIdCountPairs.length > 0) {
    const [id, count] = notUniqueIdCountPairs[0]
    throw new Error(`There are ${count} accounts with the same id=${id}`)
  }
  return accounts
}

export function convertTimestampToDate (timestamp) {
  // used mobile interpreter implementation as a reference
  const millis = timestamp < 10000000000
    ? timestamp * 1000
    : timestamp
  return new Date(millis)
}

export function fixDateTimezones (transaction) {
  if (ZenMoney.features.dateProcessing) {
    return transaction
  }
  const date = (typeof transaction.date === 'number')
    ? convertTimestampToDate(transaction.date)
    : transaction.date
  if (!(date instanceof Date)) {
    return transaction
  }
  return {
    ...transaction,
    date: new Date(date.valueOf() - date.getTimezoneOffset() * MS_IN_MINUTE),
    created: date
  }
}

export function fixDateTimezonesForTransactionDtoV2 (transaction) {
  const date = (typeof transaction.date === 'number')
    ? convertTimestampToDate(transaction.date)
    : transaction.date
  if (date instanceof Date &&
    date.getTimezoneOffset() === -120 &&
    date.getHours() === 23 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0) {
    return {
      ...transaction,
      date: new Date(date.getTime() + 3600000)
    }
  }
  return transaction
}

export function trimTransactionTransferAccountSyncIds (transaction) {
  if (Array.isArray(transaction.movements) && (
    Array.isArray(transaction.movements[0]?.account?.syncIds) ||
    Array.isArray(transaction.movements[1]?.account?.syncIds)
  )) {
    return {
      ...transaction,
      movements: transaction.movements.map(movement => ({
        ...movement,
        account: {
          ...movement.account,
          ...Array.isArray(movement.account?.syncIds) && { syncIds: movement.account.syncIds.map(syncId => trimSyncId(syncId)) }
        }
      }))
    }
  }
  return transaction
}

export function patchAccounts (accounts) {
  console.assert(Array.isArray(accounts), 'accounts must be array')
  if (!ZenMoney.features.investmentAccount && accounts.some(account => account.type === 'investment')) {
    throw new IncompatibleVersionError()
  }
  return ensureSyncIDsAreUniqueButSanitized({
    sanitizeSyncId,
    accounts: accounts.map((account) => {
      console.assert(('syncIds' in account) !== ('syncID' in account), 'account must have either syncIds or syncID but not both')
      return _.mapKeys(account, (_, key) => {
        return key === 'syncIds' ? 'syncID' : key
      })
    })
  })
}

export function patchTransactions (transactions, accounts) {
  if (ZenMoney.features.transactionDtoV2) {
    return transactions.map((x) => x ? trimTransactionTransferAccountSyncIds(fixDateTimezonesForTransactionDtoV2(x)) : x)
  }
  const accountsByIdLookup = _.keyBy(accounts, (x) => x.id)
  return castTransactionDatesToTicks(transactions.map((x) =>
    x.movements
      ? fixDateTimezones(toZenmoneyTransaction(x, accountsByIdLookup))
      : fixDateTimezones(x)
  ))
}

function castTransactionDatesToTicks (transactions) {
  // temporal fix for j2v8 on android 6: Date objects marshalling is broken
  if (ZenMoney.features.j2v8Date) {
    return transactions
  }
  return transactions.map((transaction) => transaction.date instanceof Date
    ? { ...transaction, date: transaction.date.getTime() }
    : transaction)
}

function isApiErrorMessage (message) {
  return /^\[[A-Z]{3}]/.test(message)
}

function getPresentationError (error) {
  if (typeof error === 'string' && isApiErrorMessage(error)) {
    error = { message: error }
  }
  let key = null
  const params = { lng: ZenMoney.locale ? ZenMoney.locale.replace('_', '-') : 'ru' }
  if (error instanceof BankMessageError) {
    key = 'zenPlugin_bankMessageError'
    params.bankMessage = error.bankMessage
  } else if (error instanceof IncompatibleVersionError) {
    key = 'zenPlugin_incompatibleVersionError'
  } else if (error instanceof InvalidLoginOrPasswordError) {
    key = 'zenPlugin_invalidLoginOrPasswordError'
  } else if (error instanceof InvalidOtpCodeError) {
    key = 'zenPlugin_invalidOtpCodeError'
  } else if (error instanceof PreviousSessionNotClosedError) {
    key = 'zenPlugin_previousSessionNotClosedError'
  } else if (error instanceof TemporaryUnavailableError) {
    key = 'zenPlugin_temporaryUnavailableError'
  } else if (error instanceof PinCodeInsteadOfPasswordError) {
    key = 'zenPlugin_pinCodeInsteadOfPasswordError'
  } else if (error instanceof InvalidPreferencesError && !error.message) {
    key = 'zenPlugin_invalidPreferencesError'
  }
  if (key) {
    const localizedMessage = i18n.t(key, params)
    if (localizedMessage && localizedMessage !== key) {
      error.message = localizedMessage
    }
  }
  const meaningfulError = error && error.message
    ? error
    : new Error('Thrown error must be an object containing message field, but was: ' + JSON.stringify(error))
  if (!(meaningfulError instanceof ZPAPIError) && !isApiErrorMessage(meaningfulError.message)) {
    meaningfulError.message = '[RUE] ' + meaningfulError.message
  }
  meaningfulError.toString = new ZPAPIError().toString
  return meaningfulError
}

function augmentErrorWithDevelopmentHints (error) {
  if (isDebug()) {
    if (error instanceof InvalidPreferencesError) {
      error.message += '\nInvalidPreferencesError: user will be forced into preferences screen and will see the message above on production UI without [Send log] button.'
    } else if (error instanceof TemporaryError) {
      error.message += '\n(TemporaryError: the message above will be displayed on production UI without [Send log] button)'
    } else if (error instanceof ZPAPIError) {
      error.message += '\n(The message above will be displayed on production UI with [Send log] button)'
    } else {
      error.message += '\n(The message above will never be displayed on production UI; use TemporaryError or InvalidPreferencesError if you want to show meaningful message to user)'
    }
    if (!(error instanceof Error)) {
      const err = new Error()
      Object.assign(err, error)
      err.message = error.message
      err.stack = error.stack
      err.fatal = error.fatal
      err.allowRetry = error.allowRetry
      error = err
    }
  }
  return error
}

export function adaptScrapeToGlobalApi (scrape) {
  console.assert(typeof scrape === 'function', 'argument must be function')

  return function adaptedAsyncFn (args) {
    const result = scrape({
      ..._.isPlainObject(args) && args,
      preferences: ZenMoney.getPreferences()
    })
    console.assert(result && typeof result.then === 'function', 'scrape() did not return a promise')
    const resultHandled = result.then((results) => {
      console.assert(results, 'scrape() did not return anything')
      if (Array.isArray(results.accounts) && Array.isArray(results.transactions)) {
        const zenmoneyAccounts = assertAccountIdsAreUnique(results.accounts)
        ZenMoney.addAccount(patchAccounts(zenmoneyAccounts))
        ZenMoney.addTransaction(patchTransactions(results.transactions, zenmoneyAccounts))
        ZenMoney.setResult({ success: true })
        return
      }
      throw new Error('scrape should return {accounts[], transactions[]}')
    })

    const { state, value } = unsealSyncPromise(resultHandled)
    if (state === 'rejected') {
      throw augmentErrorWithDevelopmentHints(getPresentationError(value))
    } else if (state === 'pending') {
      resultHandled.catch((e) => {
        const error = augmentErrorWithDevelopmentHints(getPresentationError(e))
        if (error.allowRetry) {
          error.allow_retry = true
        }
        ZenMoney.setResult(error)
      })
    }
  }
}

export function traceFunctionCalls (fn) {
  console.assert(typeof fn === 'function', 'traceFunctionCalls argument should be a function')

  const functionName = fn.name || 'anonymous'
  return function logCallsWrapper (args) {
    const startMs = Date.now()
    console.log('call', functionName, 'with args:', sanitize(args, { preferences: true }))
    const result = fn.call(this, args)

    if (!result.then) {
      console.log(`${functionName} call returned result:`, result, `\n(${(Date.now() - startMs).toFixed(0)}ms)`)
      return result
    }
    return result.then(
      (resolveValue) => {
        console.log(`${functionName} call resolved with`, resolveValue, `\n(${(Date.now() - startMs).toFixed(0)}ms)`)
        return resolveValue
      },
      (rejectValue) => {
        console.error(`${functionName} call rejected with`, rejectValue, `\n(${(Date.now() - startMs).toFixed(0)}ms)`)
        return Promise.reject(rejectValue)
      }
    )
  }
}

export const adaptScrapeToMain = (scrape) => adaptScrapeToGlobalApi(provideScrapeDates(traceFunctionCalls(scrape)))
