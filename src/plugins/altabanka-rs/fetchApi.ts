import moment from 'moment'
import { fetch, fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { parseAccountInfo, parseCards, parseCardTurnover, parseEnvironment, parseReservedFunds, parseTransactions } from './parsers'
import { AccountInfo, AccountTransaction, Card, Environment } from './models'

const baseUrl = 'https://online.altabanka.rs/Retail/Protected/Services/'
const loginPageUrl = 'https://online.altabanka.rs/Retail/home/login'

async function fetchApi (url: string, token: string, options?: FetchOptions): Promise<FetchResponse> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Holos-Session': '1',
    Referer: loginPageUrl
  }
  if (token !== '') {
    headers['X-Holos-RequestToken'] = token
  }

  return await fetchJson(baseUrl + url, {
    method: 'POST',
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined)
    }
  })
}

// Loads the login page first to establish the server session cookie.
export async function fetchLoginPage (): Promise<void> {
  await fetch(loginPageUrl, { method: 'GET' })
}

export async function fetchEnvironment (token: string): Promise<Environment> {
  const response = await fetchApi('PortalService.asmx/GetEnvironmentVariables', token, { body: {} })
  return parseEnvironment(response.body)
}

export async function fetchLogin (token: string, username: string, otp: string): Promise<void> {
  await fetchApi('RetailLoginService.svc/LoginUO', token, {
    body: { username, otp, appType: 'AUTH_1', sessionID: 1 },
    sanitizeRequestLog: true
  })
}

export async function fetchAccounts (token: string): Promise<AccountInfo[]> {
  const response = await fetchApi('DataService.svc/GetAllAccountBalance', token, {
    body: { gridName: 'AccountBalancePreview' }
  })
  return parseAccountInfo(response.body)
}

export async function fetchAccountTurnover (
  token: string,
  account: AccountInfo,
  fromDate: Date,
  toDate: Date
): Promise<AccountTransaction[]> {
  const response = await fetchApi('DataService.svc/GetTransactionalAccountTurnover', token, {
    body: {
      accountNumber: account.accountNumber,
      productCoreID: account.productCoreID ?? '',
      filterParam: {
        Currency: account.currency,
        DateFrom: moment(fromDate).format('DD.MM.YYYY'),
        DateTo: moment(toDate).format('DD.MM.YYYY'),
        Direction: '',
        AmountLow: '',
        AmountHigh: ''
      },
      gridName: 'RetailAccountTurnoverTransactionPreviewMasterDetail'
    }
  })
  return parseTransactions(response.body, fromDate)
}

export async function fetchCards (token: string): Promise<Card[]> {
  const response = await fetchApi('DataService.svc/GetAllCard', token, {
    body: { gridName: 'RetailCardListPreviewFlat' }
  })
  return parseCards(response.body)
}

export async function fetchCardTurnover (
  token: string,
  primaryCardID: string,
  accountType: string,
  fromDate: Date,
  toDate: Date
): Promise<AccountTransaction[]> {
  const response = await fetchApi('DataService.svc/GetCardTurnover', token, {
    body: {
      primaryCardID,
      productCodeCore: '',
      filterParam: {
        AccountType: accountType,
        DateFrom: moment(fromDate).format('DD.MM.YYYY'),
        DateTo: moment(toDate).format('DD.MM.YYYY'),
        AmountLow: '',
        AmountHigh: '',
        Direction: ''
      },
      gridName: 'RetailCardTurnoverPreviewMasterDetail'
    }
  })
  return parseCardTurnover(response.body, fromDate)
}

export async function fetchReservedFunds (
  token: string,
  accountNumber: string,
  fromDate: Date
): Promise<AccountTransaction[]> {
  const response = await fetchApi('DataService.svc/GetTransactionalAccountReservedFunds', token, {
    body: { accountNumber, gridName: null }
  })
  return parseReservedFunds(response.body, fromDate)
}
