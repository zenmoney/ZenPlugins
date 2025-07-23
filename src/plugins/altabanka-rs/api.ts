import { fetch, FetchResponse } from '../../common/network'
import { sanitize } from '../../common/sanitize'
import { InvalidPreferencesError } from '../../errors'
import { parseAccountInfo, parseLoginResult, parseRequestVerificationToken, parseTransactions } from './parsers'
import { AccountInfo, AccountTransaction, Preferences } from './types'
import moment from 'moment'
// @ts-expect-error no types for package
import * as qs from 'querystring-browser'

export class AltaBankaApi {
  private readonly baseUrl: string

  constructor (options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl
  }

  public async login ({ login, password }: Preferences, isInBackground: boolean): Promise<void> {
    const formData = {
      Username_ID: login,
      Password_ID: password,
      ActiveLoginMethod: 'usernamepassword',
      workitemid: 'v2bdQSMgtKTpqU8qDDR9iQ==',
      'X-Requested-With': 'XMLHttpRequest'
    }

    const response = await fetch(
      this.baseUrl + 'Identity/Login',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: qs.stringify(formData),
        sanitizeRequestLog: true
      }) as FetchResponse & { body: string }

    if (!parseLoginResult(response.body)) {
      console.error('login failed')
      throw new InvalidPreferencesError()
    }

    console.info('login successful')
  }

  public async fetchAccounts (): Promise<AccountInfo[]> {
    const response = await fetch(
      this.baseUrl + 'Home/Accounts',
      undefined
    ) as FetchResponse & { body: string }

    const accountsInfo = parseAccountInfo(response.body)

    console.debug('fetchAccounts', sanitize(accountsInfo, false))

    return accountsInfo
  }

  public async fetchVerificationToken (): Promise<string> {
    const response = await fetch(
      this.baseUrl + 'AccountData/Transactions/List',
      undefined
    ) as FetchResponse & { body: string }

    const token = parseRequestVerificationToken(response.body)

    console.debug('fetchVerificationToken', sanitize(token, true))

    return token
  }

  public async fetchTransactions (
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
      this.baseUrl + 'AccountData/Transactions/List',
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

  public async fetchCardTransactions (
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
      this.baseUrl + 'AccountData/Transactions/CardTransactionsList',
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
}

export const altaBankaApi = new AltaBankaApi({
  baseUrl: 'https://altabanka.24x7.rs/altaonline/'
})
