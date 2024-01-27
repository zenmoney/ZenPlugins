import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'
import { parse, splitCookiesString } from 'set-cookie-parser'
import { AccountBalanceResponse, Auth, GetAccountTransactionsResponse, GetTransactionDetailsResponse, LoginResponse, Preferences } from './models'
import { isArray } from 'lodash'
import * as argon2 from 'argon2-browser'
import moment from 'moment'

const baseUrl = 'https://rol.raiffeisenbank.rs/Retail/Protected/Services/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url, options ?? {})
}

async function getSaltedPassword (login: string, password: string): Promise<string> {
  const salt = login.padEnd(8, '\0')
  const saltedPassword = await argon2.hash({
    pass: password,
    salt,
    time: 3,
    mem: 4096,
    hashLen: 32,
    type: argon2.ArgonType.Argon2i
  })
  return saltedPassword.hashHex
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<Auth> {
  const isPasswordSalted = (await fetchApi('RetailLoginService.svc/SaltedPassword', {
    method: 'POST',
    body: {
      userName: login
    },
    sanitizeRequestLog: {
      body: {
        userName: true
      }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true }
    }
  })).body === true

  const response = await fetchApi('RetailMobileLoginService.svc/Login', {
    method: 'POST',
    body: {
      username: login,
      password: isPasswordSalted ? await getSaltedPassword(login, password) : password
    },
    sanitizeRequestLog: {
      body: {
        username: true,
        password: true
      }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: {
        Username: true,
        Ticket: true,
        SocialIdentityNumber: true,
        FirstName: true,
        LastName: true,
        FullName: true,
        Address: true,
        Street: true,
        PrincipalID: true,
        SessionID: true,
        HolosSessionID: true,
        HolosUserID: true,
        RequestToken: true
      }
    }
  }) as FetchResponse & { body: LoginResponse, headers: { 'set-cookie': string } }

  if (response.body.Ticket === null || response.body.Ticket.length === 0) {
    throw new InvalidLoginOrPasswordError()
  }

  const cookies: string[] = parse(splitCookiesString(response.headers['set-cookie']))
    .map(cookie => cookie.name + '=' + cookie.value)

  return { cookie: cookies.join(';') }
}

export async function fetchAllAccounts (auth: Auth): Promise<AccountBalanceResponse[]> {
  const response = await fetchApi('DataService.svc/GetAllAccountBalance', {
    method: 'POST',
    headers: {
      Cookie: auth.cookie
    },
    sanitizeRequestLog: {
      headers: { cookie: true }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: {
        AccountNumber: true,
        IBANNumber: true,
        AccountID: true,
        AvailableBalance: true,
        Balance: true,
        LastChangeAmount: true
      }
    }
  }) as FetchResponse & { body: AccountBalanceResponse[] }

  assert(isArray(response.body), 'cant get accounts array', response)
  return response.body
}

export async function fetchAccountTransactions (accountNumber: string, productCoreID: string, auth: Auth, fromDate: Date, toDate: Date): Promise<GetAccountTransactionsResponse[]> {
  const response = await fetchApi('DataService.svc/GetTransactionalAccountTurnover', {
    method: 'POST',
    headers: {
      Cookie: auth.cookie
    },
    body: {
      accountNumber,
      filterParam: {
        FromDate: moment(fromDate).format('DD.MM.YYYY'),
        ToDate: moment(toDate).format('DD.MM.YYYY')
      },
      productCoreID
    },
    sanitizeRequestLog: {
      headers: { cookie: true }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: {
        TransactionID: true,
        IBANNumber: true,
        ClientAddress: true,
        SocialIdentityNumber: true,
        Reference: true,
        AccountNumber: true,
        Note: true,
        ComplaintNumber: true,
        ClientName: true
      }
    }
  }) as FetchResponse & { body: GetAccountTransactionsResponse[][] }

  assert(isArray(response.body), 'cant get transactions array', response)

  const apiTransactions = response.body.length > 0 ? response.body[0] : []

  for (const apiTransaction of apiTransactions) {
    apiTransaction.Details = await fetchTransactionDetails(apiTransaction.TransactionID, auth)
  }

  return apiTransactions
}

async function fetchTransactionDetails (transactionId: string, auth: Auth): Promise<GetTransactionDetailsResponse> {
  const response = await fetchApi('DataService.svc/getAllTransactionalDetails', {
    method: 'POST',
    headers: {
      Cookie: auth.cookie
    },
    body: {
      filterParam: {
        TransactionID: transactionId
      }
    },
    sanitizeRequestLog: {
      headers: { cookie: true }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: {
        UserName: true,
        s_Group: true,
        OrderNumber_pp: true,
        DebtorAccount: true,
        s_OrderNumber: true,
        UserAccount: true,
        s_Note_st: true
      }
    }
  }) as FetchResponse & { body: GetTransactionDetailsResponse[] }

  assert(isArray(response.body), 'cant get transaction details', response)

  return response.body[0]
}

export async function fetchTransactionsInProgress (accountNumber: string, auth: Auth): Promise<string[][]> {
  const response = await fetchApi('DataService.svc/GetTransactionalAccountReservedFunds', {
    method: 'POST',
    headers: {
      Cookie: auth.cookie
    },
    body: {
      accountNumber,
      gridName: 'RetailAccountReservedFundsPreviewFlat'
    },
    sanitizeRequestLog: {
      headers: { cookie: true }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true }
    }
  }) as FetchResponse & { body: string[][] }

  assert(isArray(response.body), 'cant get transaction details', response)
  return response.body.reverse()
}
