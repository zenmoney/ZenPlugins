import { fetch, FetchResponse } from '../../common/network'
import { sanitize } from '../../common/sanitize'
import { InvalidPreferencesError } from '../../errors'
import { parseAccountInfo, parseLoginResult, parseRequestVerificationToken, parseTransactions } from './parsers'
import { AccountInfo, AccountTransaction, Preferences } from './types'
import moment from 'moment'

export class AltaBankaApi {
  private readonly baseUrl: string

  constructor (options: {baseUrl: string}) {
    this.baseUrl = options.baseUrl
  }

  public async login ({ login, password }: Preferences, isInBackground: boolean): Promise<void> {
    const formData = new URLSearchParams()
    formData.append('Username_ID', login)
    formData.append('Password_ID', password)
    formData.append('ActiveLoginMethod', 'usernamepassword')
    formData.append('workitemid', 'v2bdQSMgtKTpqU8qDDR9iQ==')
    formData.append('X-Requested-With', 'XMLHttpRequest')

    const response = await fetch(
      this.baseUrl + 'Identity/Login',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      }) as FetchResponse & {body: string}

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
    ) as FetchResponse & {body: string}

    const accountsInfo = parseAccountInfo(response.body)

    console.debug('fetchAccounts', sanitize(accountsInfo, false))

    return accountsInfo
  }

  public async fetchVerificationToken (): Promise<string> {
    const response = await fetch(
      this.baseUrl + 'AccountData/Transactions/List',
      undefined
    ) as FetchResponse & {body: string}

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
    const formData = new URLSearchParams()
    formData.append('Accounts_ID', accountId)
    formData.append('__RequestVerificationToken', token)
    formData.append('DateFrom_ID', moment(fromDate).format('DD/MM/YYYY'))
    if (toDate) {
      formData.append('DateTo_ID', moment(toDate).format('DD/MM/YYYY'))
    }
    formData.append('SortOrder_ID', 'asc')
    formData.append('PageSize', '100')
    formData.append('PageNumber', page.toString())

    const response = await fetch(
      this.baseUrl + 'AccountData/Transactions/List',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      }
    ) as FetchResponse & {body: string}

    const transactions = parseTransactions(response.body)

    console.debug('fetchTransactions', sanitize(transactions, false))

    return transactions
  }

  public async fetchCardTransactions (
    accountId: string,
    token: string,
    page: number,
    fromDate: Date,
    toDate?: Date
  ): Promise<AccountTransaction[]> {
    const formData = new URLSearchParams()
    formData.append('Accounts_ID', accountId)
    formData.append('__RequestVerificationToken', token)
    formData.append('DateFrom_ID', moment(fromDate).format('DD/MM/YYYY'))
    if (toDate) {
      formData.append('DateTo_ID', moment(toDate).format('DD/MM/YYYY'))
    }
    formData.append('SortOrder_ID', 'asc')
    formData.append('PageSize', '100')
    formData.append('PageNumber', page.toString())
    formData.append('Statuses_ID', 'p')

    const response = await fetch(
      this.baseUrl + 'AccountData/Transactions/CardTransactionsList',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      }
    ) as FetchResponse & {body: string}

    const transactions = parseTransactions(response.body)

    console.debug('fetchCardTransactions', sanitize(transactions, false))

    return transactions
  }
}

export const altaBankaApi = new AltaBankaApi({
  baseUrl: 'https://altabanka.24x7.rs/altaonline/'
})
