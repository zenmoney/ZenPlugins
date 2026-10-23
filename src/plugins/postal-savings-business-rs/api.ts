import moment from 'moment-timezone'
import { UserInteractionError } from '../../errors'
import { getString } from '../../types/get'
import * as transport from './fetchApi'
import { BankAccount, BankTransaction, FetchParams, Preferences } from './models'
import { bankTimezone, isAuthenticatedPage, parseAccounts, parseHistoryPage, parseLoginPage } from './parsers'

export async function authenticate (preferences: Preferences, isInBackground: boolean, persist: () => Promise<void>): Promise<BankAccount[]> {
  const existing = await transport.fetchAccountsPage()
  if (parseLoginPage(existing) === null) {
    const accounts = parseAccounts(existing)
    await persist()
    return accounts
  }
  console.debug('Business bank session requires mobile approval')
  if (isInBackground) throw new UserInteractionError()
  let login = typeof preferences.login === 'string' ? preferences.login.trim() : ''
  if (login === '') {
    const input = await ZenMoney.readLine('Unesite korisničko ime za poslovno elektronsko bankarstvo.', { inputType: 'text' })
    assert(input !== null && input.trim() !== '', 'Required login was not provided')
    login = input.trim()
  }
  const initial = parseLoginPage(await transport.fetchLoginPage())
  assert(initial !== null && !initial.polling, 'Expected initial mobile login form')
  const csrf = initial.fields.find(([name]) => name === '_csrf_token')?.[1]
  assert(csrf !== undefined, 'Missing login CSRF token')
  const challenge = parseLoginPage(await transport.submitLogin([
    ['authentication_type', 'MPUSH'], ['j_username', login], ['j_password', ''], ['mpush_otp_fallback', 'false'], ['_csrf_token', csrf]
  ]))
  assert(challenge?.polling === true && challenge.confirmationCode !== '', 'Expected mobile approval challenge')
  await ZenMoney.alert(`Potvrdite prijavu u mobilnoj aplikaciji banke.\nKod za poređenje: ${challenge.confirmationCode}`)
  let approved = false
  for (let attempt = 0; attempt < 24; attempt++) {
    const status = await transport.fetchPushStatus()
    if (status === 'OK') { approved = true; break }
    assert(status === 'PENDING', 'Mobile approval did not complete', { status })
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  assert(approved, 'Mobile approval timed out')
  const completed = await transport.submitLogin(challenge.fields)
  assert(parseLoginPage(completed) === null && isAuthenticatedPage(completed), 'Mobile login finalization failed')
  // The recorded authenticated landing page confirms the session before further data work.
  await persist()
  return parseAccounts(await transport.fetchAccountsPage())
}

export async function fetchTransactions (fetchParams: FetchParams, fromDate: Date, toDate?: Date | null): Promise<BankTransaction[]> {
  const initial = parseHistoryPage(await transport.fetchHistoryPage(fetchParams.index))
  // Use the server's upper selectable bound when the caller has no upper cutoff.
  const endDate = moment.tz(toDate ?? new Date(initial.maxDate), bankTimezone).format('DD.MM.YYYY')
  const startDate = moment.tz(fromDate, bankTimezone).format('DD.MM.YYYY')
  const period = await transport.selectPeriod([
    ['dateFromStr', startDate], ['dateToStr', endDate], ['filterUnit', 'custom'], ['filterType', 'current'],
    ['tableId', 'account.transactions.booked'], ['dateFieldName', 'dueDate']
  ], initial.csrf)
  const fromNumeric = getString(period, 'dateFromNumeric')
  const toNumeric = getString(period, 'dateToNumeric')
  assert(/^\d+$/.test(fromNumeric) && /^\d+$/.test(toNumeric), 'Invalid history period timestamps')
  const dateFrom = Number(fromNumeric)
  const dateTo = Number(toNumeric)
  // The observed selector clamps its upper request bound to the current banking day.
  // A null upper cutoff still applies no local date filter to returned operations.
  assert(Number.isFinite(dateFrom) && Number.isFinite(dateTo) && dateFrom <= fromDate.getTime() && dateTo >= (toDate != null ? moment.tz(toDate, bankTimezone).startOf('day').valueOf() : dateTo), 'Bank history period does not cover requested interval')
  const excluded = /^(?:bookingDateFrom|bookingDateTo|dueDateFrom|dueDateTo|filterUnit|filterType|dateFieldName)$/
  const fields: Array<[string, string]> = initial.fields.filter(([name]) => !excluded.test(name))
  fields.push(['dueDateFrom', String(dateFrom)], ['dueDateTo', String(dateTo)], ['dateFromStr', startDate], ['dateToStr', endDate], ['dateFieldName', 'dueDate'], ['dateRadioOptions', 'dueDate'], ['filterUnit', 'custom'], ['filterType', 'current'], ['statusGroup', 'BOOKED'], ['applyFilter', 'true'])
  const first = parseHistoryPage(await transport.fetchHistoryPage(fetchParams.index, fields))
  assert(first.current === 1, 'History did not start at first page')
  const transactions = [...first.transactions]
  for (let page = 2; page <= first.pages; page++) {
    const next = parseHistoryPage(await transport.fetchNextHistoryPage(fetchParams.index, page))
    assert(next.current === page && next.pages === first.pages && next.elements === first.elements, 'History changed during pagination')
    transactions.push(...next.transactions)
  }
  assert(transactions.length === first.elements && new Set(transactions.map(item => item.id)).size === transactions.length, 'Incomplete or duplicate history pages')
  return transactions
}
