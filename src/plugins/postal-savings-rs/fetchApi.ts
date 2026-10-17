import { fetch, FetchResponse } from '../../common/network'
import { delay } from '../../common/utils'
import { BankMessageError, InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { AccountInfo, AccountTransaction, Preferences } from './models'
import { parseAccountInfo, parseHiddenFields, parseLoginStep, parseRequestVerificationToken, parseTransactions } from './parsers'
import { sanitize } from '../../common/sanitize'
import moment from 'moment'
// @ts-expect-error no types for package
import * as qs from 'querystring-browser'

const baseUrl = 'https://onlinebanking.posted.co.rs/webapp/'
// The bank keeps a push open for about three minutes.
const PUSH_APPROVAL_TIMEOUT_MS = 175000
const PUSH_POLL_INTERVAL_MS = 2000

async function postLoginForm (fields: Record<string, string>, sanitizeRequestLog = false): Promise<string> {
  const response = await fetch(
    baseUrl + 'Identity/Login',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: qs.stringify({ ...fields, 'X-Requested-With': 'XMLHttpRequest' }),
      sanitizeRequestLog
    }) as FetchResponse & { body: string }
  return response.body
}

async function fetchCallbackStatus (workItemId: string): Promise<{ Success?: boolean, Rejected?: boolean }> {
  const response = await fetch(
    `${baseUrl}Identity/Login/CallbackStatus?workItemId=${encodeURIComponent(workItemId)}&_=${Date.now()}`,
    {
      method: 'GET',
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }
    }) as FetchResponse & { body: string }
  try {
    return typeof response.body === 'string' ? JSON.parse(response.body) : response.body
  } catch (e) {
    return {}
  }
}

// Since 2026 the bank asks for a second factor after the password. Of the
// three it offers (SMS code, mToken Push, QR) the plugin uses mToken Push:
// the user taps the notification in the mToken Asseco app and nothing has to
// be typed into Zenmoney. The page then asks CallbackStatus about once a
// second until it answers Success, and submits its form once more.
export async function fetchAuthorization ({ login, password }: Preferences): Promise<void> {
  const loginPage = await fetch(baseUrl + 'Identity/Login', undefined) as FetchResponse & { body: string }
  const start = parseHiddenFields(loginPage.body)
  if (start.workitemid === undefined || start.workitemid === '') {
    throw new TemporaryError('Failed to load login page')
  }

  const pushForm = await postLoginForm({ ...start, ActiveLoginMethod: 'usernamepush', ChangeLoginMethod: 'ChangeLoginMethod' })
  const devices = await postLoginForm({ ...parseHiddenFields(pushForm), Username_ID: login, Password_ID: password, 1: '' }, true)
  const devicesStep = parseLoginStep(devices)
  if (devicesStep.kind === 'credentials') {
    throw new InvalidLoginOrPasswordError()
  }
  if (devicesStep.kind !== 'devices') {
    throw new BankMessageError('Login with mToken Push is not available. Activate mToken Asseco for online banking and try again.')
  }

  const waiting = await postLoginForm({ ...parseHiddenFields(devices), 1: '' })
  const waitingStep = parseLoginStep(waiting)
  if (waitingStep.kind !== 'waiting' || waitingStep.workItemId === undefined) {
    throw new TemporaryError('The bank did not send the mToken push')
  }

  const deadline = Date.now() + PUSH_APPROVAL_TIMEOUT_MS
  for (;;) {
    const status = await fetchCallbackStatus(waitingStep.workItemId)
    if (status.Success === true) {
      break
    }
    if (status.Rejected === true) {
      throw new BankMessageError('The login was rejected in mToken Asseco.')
    }
    if (Date.now() > deadline) {
      throw new TemporaryError('The login was not confirmed in mToken Asseco in time')
    }
    await delay(PUSH_POLL_INTERVAL_MS)
  }

  await postLoginForm({ ...parseHiddenFields(waiting), 1: '' })
}

export async function fetchAllAccounts (): Promise<AccountInfo[]> {
  const response = await fetch(
    baseUrl + 'Home/Accounts',
    undefined
  ) as FetchResponse & { body: string }

  const accountsInfo = parseAccountInfo(response.body)

  console.debug('fetchAccounts', sanitize(accountsInfo, false))

  return accountsInfo
}

export async function fetchVerificationToken (): Promise<string> {
  const response = await fetch(
    baseUrl + 'AccountData/Transactions/List',
    undefined
  ) as FetchResponse & { body: string }

  const token = parseRequestVerificationToken(response.body)

  console.debug('fetchVerificationToken', sanitize(token, true))

  return token
}

export async function fetchTransactions (
  accountId: string,
  token: string,
  page: number,
  fromDate: Date,
  toDate?: Date
): Promise<AccountTransaction[]> {
  const formData: Record<string, string> = {
    Accounts_ID: accountId,
    __RequestVerificationToken: token,
    DateFrom_ID: moment(fromDate).format('DD/MM/YYYY'),
    SortOrder_ID: 'asc',
    PageSize: '100',
    PageNumber: page.toString()
  }
  if (toDate != null) {
    formData.DateTo_ID = moment(toDate).format('DD/MM/YYYY')
  }

  const response = await fetch(
    baseUrl + 'AccountData/Transactions/List',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: qs.stringify(formData)
    }
  ) as FetchResponse & { body: string }

  const transactions = parseTransactions(response.body, fromDate, toDate ?? new Date())

  console.debug('fetchTransactions', sanitize(transactions, false))

  return transactions
}

export async function fetchCardTransactions (
  accountId: string,
  cardNumber: string,
  token: string,
  page: number,
  fromDate: Date,
  toDate?: Date
): Promise<AccountTransaction[]> {
  const formData: Record<string, string> = {
    Accounts_ID: accountId,
    __RequestVerificationToken: token,
    DateFrom_ID: moment(fromDate).format('DD/MM/YYYY'),
    SortOrder_ID: 'asc',
    PageSize: '100',
    PageNumber: page.toString(),
    Statuses_ID: 'p'
  }

  if (toDate != null) {
    formData.DateTo_ID = moment(toDate).format('DD/MM/YYYY')
  }

  if (cardNumber !== '') {
    formData.Cards_ID = cardNumber
  }

  const response = await fetch(
    baseUrl + 'AccountData/Transactions/CardTransactionsList',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: qs.stringify(formData)
    }
  ) as FetchResponse & { body: string }

  const transactions = parseTransactions(response.body, fromDate, toDate ?? new Date())

  console.debug('fetchCardTransactions', sanitize(transactions, false))

  return transactions
}
