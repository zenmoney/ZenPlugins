import i18n from 'i18next'
import _ from 'lodash'
import de from '../../locales/de.json'
import en from '../../locales/en.json'
import es from '../../locales/es.json'
import he from '../../locales/he.json'
import pl from '../../locales/pl.json'
import pt from '../../locales/pt.json'
import ru from '../../locales/ru.json'
import uk from '../../locales/uk.json'
import {
  BankMessageError,
  IncompatibleVersionError,
  InvalidLoginOrPasswordError,
  InvalidOtpCodeError,
  InvalidPreferencesError,
  PasswordExpiredError,
  PinCodeInsteadOfPasswordError,
  PreviousSessionNotClosedError,
  SubscriptionRequiredError,
  TemporaryError,
  TemporaryUnavailableError,
  ZPAPIError
} from '../errors'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId, trimSyncId } from './accounts'
import { toZenMoneyTransaction } from './converters'
import { getMidnight, isValidDate, toISODateString } from './dateUtils'
import { sanitize } from './sanitize'
import { isDebug } from './utils'

i18n.init({
  resources: _.fromPairs([
    ['de', de],
    ['en', en],
    ['es', es],
    ['he', he],
    ['pl', pl],
    ['pt', pt],
    ['ru', ru],
    ['uk', uk]
  ].map(([lang, translation]) => [
    lang,
    {
      translation: _.mapValues(translation, value => {
        const paramRegExp = /%(\d)\$[sd]/g
        let result
        while ((result = paramRegExp.exec(value)) !== null) {
          value = value.replace(result[0], `{{${parseInt(result[1], 10) - 1}}}`)
        }
        return value
      })
    }
  ])),
  fallbackLng: 'en'
})

const MS_IN_MINUTE = 60 * 1000

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
  return {
    state,
    value
  }
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

const calculateFromDate = (startDateString, now = new Date()) => {
  console.assert(startDateString, 'preferences must contain "startDate"')
  const startDate = parseStartDateString(startDateString)
  console.assert(isValidDate(startDate), { startDateString }, 'is not a valid date')
  const lastSuccessDate = getLastSuccessDate()
  const fromDate = lastSuccessDate
    ? new Date(Math.max(getMidnight(lastSuccessDate, -14).getTime(), startDate.getTime()))
    : startDate
  return fromDate.getTime() < now.getTime() ? fromDate : now
}

const getIsFirstRun = () => {
  return Boolean(typeof ZenMoney?.getData === 'function' && !ZenMoney.getData(SCRAPE_LAST_SUCCESS_DATE_KEY))
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
      isFirstRun: getIsFirstRun()
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

function isValidInt32Date (date) {
  return isValidDate(date) && date.getTime() > 0 && date.getTime() <= 2147483647000
}

export function fixDateTimezonesForTransactionDtoV2 (transaction) {
  console.assert(isValidInt32Date(transaction.date), 'transaction.date must be valid Date object', transaction)
  const date = transaction.date
  if (date.getTimezoneOffset() === -120 &&
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

function assertSumIsAValidNumber (sum, key) {
  console.assert(
    (typeof sum === 'number' && !isNaN(sum) && isFinite(sum)) || sum === null || sum === undefined,
    `${key} should be a number, got ` + (typeof sum === 'number' ? sum : JSON.stringify(sum))
  )
}

export function patchAccounts (accounts) {
  console.assert(Array.isArray(accounts) && accounts.length > 0 && !accounts.some((x) => !x), 'accounts must be non-empty array of objects')
  if (!ZenMoney.features.investmentAccount && accounts.some(account => account.type === 'investment')) {
    throw new IncompatibleVersionError()
  }
  return ensureSyncIDsAreUniqueButSanitized({
    sanitizeSyncId,
    accounts: assertAccountIdsAreUnique(accounts).map((account) => {
      console.assert(('syncIds' in account) !== ('syncID' in account), 'account must have either syncIds or syncID but not both', account)
      console.assert(account.startDate === undefined || isValidInt32Date(account.startDate), 'account.startDate must be valid Date object', account)
      const balance = patchAmount({
        sum: account.balance,
        instrument: account.instrument
      }, 'balance')
      const available = patchAmount({
        sum: account.available,
        instrument: account.instrument
      }, 'available')
      const creditLimit = patchAmount({
        sum: account.creditLimit,
        instrument: account.instrument
      }, 'creditLimit')
      const startBalance = patchAmount({
        sum: account.startBalance,
        instrument: account.instrument
      }, 'startBalance')
      return {
        ..._.mapKeys(account, (_, key) => {
          return key === 'syncIds' ? 'syncID' : key
        }),
        instrument: balance.instrument,
        balance: balance.sum,
        available: available.sum,
        creditLimit: creditLimit.sum,
        startBalance: startBalance.sum
      }
    })
  })
}

export function patchTransactions (transactions, accounts) {
  console.assert(Array.isArray(transactions) && !transactions.some((x) => !x), 'transactions must be array of objects')
  const accountsByIdLookup = _.keyBy(accounts, (x) => x.id)
  if (ZenMoney.features.transactionDtoV2) {
    return transactions.map((x) => patchTransactionAmount(
      trimTransactionTransferAccountSyncIds(fixDateTimezonesForTransactionDtoV2(x)),
      accountsByIdLookup
    ))
  }
  return castTransactionDatesToTicks(transactions.map((x) => patchTransactionAmount(
    x.movements
      ? fixDateTimezones(toZenMoneyTransaction(x, accountsByIdLookup))
      : fixDateTimezones(x),
    accountsByIdLookup
  )))
}

function patchTransactionAmount (transaction, accountsByIdLookup) {
  if (Array.isArray(transaction.movements)) {
    return {
      ...transaction,
      movements: transaction.movements.map((movement) => {
        const instrument = accountsByIdLookup[movement.account?.id]?.instrument || movement.account?.instrument
        return {
          ...movement,
          invoice: movement.invoice ? patchAmount(movement.invoice, 'invoice') : null,
          sum: patchAmount({
            sum: movement.sum,
            instrument
          }, 'sum').sum,
          fee: patchAmount({
            sum: movement.fee,
            instrument
          }, 'fee').sum
        }
      })
    }
  }
  if (transaction.incomeAccount && transaction.outcomeAccount) {
    return {
      ...transaction,
      ...[true, false].reduce((obj, isIncome) => {
        const sumKey = isIncome ? 'income' : 'outcome'
        const accountKey = `${sumKey}Account`
        const accountId = transaction[accountKey]
        const accountIdParts = accountId?.split('#')
        const account = accountsByIdLookup[accountId]
        const invoiceSumKey = isIncome ? 'opIncome' : 'opOutcome'
        const invoiceInstrumentKey = `${invoiceSumKey}Instrument`
        const amount = patchAmount({
          sum: transaction[sumKey],
          instrument: account?.instrument || accountIdParts?.[1]
        }, sumKey)
        const invoice = patchAmount({
          sum: transaction[invoiceSumKey],
          instrument: transaction[invoiceInstrumentKey]
        }, invoiceSumKey)
        return {
          ...obj,
          [sumKey]: amount.sum,
          [accountKey]: account ? accountId : accountIdParts?.map((x, i) => (i === 1 ? amount.instrument : '') || x).join('#'),
          [invoiceSumKey]: invoice.sum,
          [invoiceInstrumentKey]: invoice.instrument
        }
      }, {})
    }
  }
  return transaction
}

function patchAmount ({
  sum,
  instrument
}, key) {
  const GRAMS_IN_OUNCE = 31.1034768
  let rate = 1
  switch (instrument) {
    case 'XAU':
      rate = GRAMS_IN_OUNCE
      instrument = 'A98'
      break
    case 'XAG':
      rate = GRAMS_IN_OUNCE
      instrument = 'A99'
      break
    case 'XPT':
      rate = GRAMS_IN_OUNCE
      instrument = 'A76'
      break
    case 'XPD':
      rate = GRAMS_IN_OUNCE
      instrument = 'A33'
      break
    case 'BTC':
    case 'ETH':
    case 'LTC':
    case 'DASH':
    case 'XMR':
    case 'BCH':
      rate = 1000000
      break
    case 'μBTC':
    case 'μETH':
    case 'μLTC':
    case 'μDASH':
    case 'μXMR':
    case 'μBCH':
      instrument = instrument.slice(1)
      break
    default:
      break
  }
  assertSumIsAValidNumber(sum, key)
  if (sum !== null && sum !== undefined && rate !== 1) {
    sum *= rate
  }
  return {
    sum,
    instrument
  }
}

function castTransactionDatesToTicks (transactions) {
  // temporal fix for j2v8 on android 6: Date objects marshalling is broken
  if (ZenMoney.features.j2v8Date) {
    return transactions
  }
  return transactions.map((transaction) => transaction.date instanceof Date
    ? {
        ...transaction,
        date: transaction.date.getTime()
      }
    : transaction)
}

function getApiErrorCode (message) {
  return message?.match(/^\[([A-Z]{3})]/)?.[1]
}

function getPresentationError (error, isFirstRun) {
  if (typeof error === 'string' && getApiErrorCode(error)) {
    error = { message: error }
  }
  const code = getApiErrorCode(error?.message)
  let forceFatal = false
  if (isFirstRun && (
    (typeof error === 'object' && Object.getPrototypeOf(error) === TemporaryError.prototype) ||
    error instanceof InvalidOtpCodeError ||
    error instanceof InvalidPreferencesError ||
    error instanceof PreviousSessionNotClosedError ||
    [
      'AAS',
      'ASE',
      'IIE',
      'NER',
      'NTI',
      'PER',
      'PSC'
    ].indexOf(code) >= 0
  )) {
    forceFatal = true
  }
  let key = null
  const params = { lng: ZenMoney.locale ? ZenMoney.locale.replace('_', '-') : 'ru' }
  if (error instanceof BankMessageError) {
    key = 'zenPlugin_bankMessageError'
    params[0] = error.bankMessage
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
  } else if (error instanceof PasswordExpiredError) {
    key = 'zenPlugin_passwordExpiredError'
  } else if (error instanceof SubscriptionRequiredError) {
    key = 'zenPlugin_subscriptionRequiredError'
  } else if (error instanceof InvalidPreferencesError) {
    key = 'zenPlugin_invalidPreferencesError'
  }
  if (key && !error.message) {
    const localizedMessage = i18n.t(key, params)
    if (localizedMessage && localizedMessage !== key) {
      error.message = localizedMessage
    }
  }
  const meaningfulError = error && error.message
    ? error
    : new Error('Thrown error must be an object containing message field, but was: ' + JSON.stringify(error))
  if ((!(meaningfulError instanceof ZPAPIError) && !code) ||
    [
      'NCE',
      'NCL'
    ].indexOf(code) >= 0
  ) {
    meaningfulError.message = '[RUE] ' + meaningfulError.message
  }
  Object.defineProperty(meaningfulError, 'message', { value: meaningfulError.message, enumerable: true })
  meaningfulError.toString = new ZPAPIError().toString
  meaningfulError.fatal = Boolean(forceFatal || meaningfulError.fatal || false)
  meaningfulError.allowRetry = Boolean(meaningfulError.allowRetry || false)
  meaningfulError.allow_retry = Boolean(meaningfulError.allowRetry || false)
  return meaningfulError
}

function augmentErrorWithDevelopmentHints (error) {
  if (isDebug()) {
    if (!(error instanceof ZPAPIError)) {
      error.message += '\n(The message above will never be displayed on production UI; use specific ZPAPIError child class from errors.js if you want to show meaningful message to user)'
    }
    if (error.allowRetry || error.allow_retry) {
      error.message += '\n(logIsNotImportant = true: the message above will be displayed on production UI without [Send log] button)'
    }
    if (error.fatal) {
      error.message += '\n(forcePluginReinstall = true: user will be forced into preferences screen)'
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
    const isFirstRun = getIsFirstRun()
    const result = scrape({
      ..._.isPlainObject(args) && args,
      preferences: ZenMoney.getPreferences()
    })
    console.assert(result && typeof result.then === 'function', 'scrape() did not return a promise')
    const resultHandled = result.then((results) => {
      console.assert(results, 'scrape() did not return anything')
      if (Array.isArray(results.accounts) && Array.isArray(results.transactions)) {
        ZenMoney.addAccount(patchAccounts(results.accounts))
        ZenMoney.addTransaction(patchTransactions(results.transactions, results.accounts))
        ZenMoney.setResult({ success: true })
        return
      }
      throw new Error('scrape should return {accounts[], transactions[]}')
    })

    const {
      state,
      value
    } = unsealSyncPromise(resultHandled)
    if (state === 'rejected') {
      ZenMoney.setResult(augmentErrorWithDevelopmentHints(getPresentationError(value, isFirstRun)))
    } else if (state === 'pending') {
      resultHandled.catch((e) => {
        ZenMoney.setResult(augmentErrorWithDevelopmentHints(getPresentationError(e, isFirstRun)))
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

function checkSubscription (fn) {
  return async function (args) {
    if (toISODateString(new Date()) < '2023-06-01') {
      return fn(args)
    }
    if (ZenMoney.manifest.isSubscriptionRequired) {
      if (!ZenMoney.user || !ZenMoney.user.subscription || typeof ZenMoney.user.subscription.endDate !== 'number') {
        throw new IncompatibleVersionError()
      }
      if ((ZenMoney.user?.subscription?.endDate || 0) <= new Date().getTime()) {
        throw new SubscriptionRequiredError()
      }
    }
    return fn(args)
  }
}

export const adaptScrapeToMain = (scrape) => adaptScrapeToGlobalApi(provideScrapeDates(checkSubscription(traceFunctionCalls(scrape))))
