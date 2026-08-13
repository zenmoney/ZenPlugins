import { fetch, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'
import { AccountInfo, AccountTransaction, Preferences } from './models'
import { parseAccountInfo, parseLoginResult, parseRequestVerificationToken, parseTransactions } from './parsers'
import { sanitize } from '../../common/sanitize'
import moment from 'moment'
// @ts-expect-error no types for package
import * as qs from 'querystring-browser'
import cheerio from 'cheerio'

const baseUrl = 'https://onlinebanking.posted.co.rs/webapp/'

async function fetchWorkitemId (): Promise<string> {
  const response = await fetch(baseUrl + 'Identity/Login', undefined) as FetchResponse & { body: string }
  const html = cheerio.load(response.body)
  const workitemId = html('#workitemId').val()
  if (typeof workitemId !== 'string' || workitemId.length === 0) {
    throw new InvalidLoginOrPasswordError('Failed to load login page')
  }
  return workitemId
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<void> {
  const workitemId = await fetchWorkitemId()

  const formData = {
    Username_ID: login,
    Password_ID: password,
    ActiveLoginMethod: 'usernamepassword',
    workitemid: workitemId,
    'X-Requested-With': 'XMLHttpRequest'
  }

  const response = await fetch(
    baseUrl + 'Identity/Login',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: qs.stringify(formData),
      sanitizeRequestLog: true
    }) as FetchResponse & { body: string }

  if (!parseLoginResult(response.body)) {
    throw new InvalidLoginOrPasswordError()
  }
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

  const transactions = parseTransactions(response.body, fromDate)

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

  const transactions = parseTransactions(response.body, fromDate)

  console.debug('fetchCardTransactions', sanitize(transactions, false))

  return transactions
}
