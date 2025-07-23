import '../../polyfills/webAssembly'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'
import { parse, splitCookiesString } from 'set-cookie-parser'
import {
  AccountBalanceResponse,
  Auth,
  AuthTicket,
  GetAccountTransactionsResponse,
  LegalEntitiesResponse,
  LegalEntitiesTicket,
  Preferences
} from './models'
import { isArray } from 'lodash'
import * as argon2 from 'argon2-browser'
import moment from 'moment'

const baseUrl = 'https://rol.raiffeisenbank.rs/CorporateV4/Protected/Services/'

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(baseUrl + url,
    {
      // needs for android,
      // for some reason it fails to farse JSON with whitespaces in the beginning
      parse: (body: string) => JSON.parse(body.trim()),
      ...options
    })
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

export async function getTicket ({ login, password }: Preferences): Promise<AuthTicket> {
  const response = await fetchApi('CorporateLoginService.svc/GetTicketUP', {
    method: 'POST',
    body: {
      username: login,
      password: await getSaltedPassword(login, password)
    },
    sanitizeRequestLog: {
      body: {
        username: true,
        password: true
      }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: true
    }
  }) as FetchResponse & { body: AuthTicket }

  if (response.body == null || response.body.length === 0) {
    throw new InvalidLoginOrPasswordError()
  }

  return response.body
}

export async function getLegalEntities (ticket: AuthTicket): Promise<LegalEntitiesResponse> {
  const response = await fetchApi('CorporateLoginService.svc/GetLegalEntities', {
    method: 'POST',
    body: {
      ticket
    },
    sanitizeRequestLog: {
      headers: { cookie: true },
      body: {
        ticket: true
      }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: {
        Ticket: true,
        PrincipalData: true
      }
    }
  }) as FetchResponse & { body: LegalEntitiesResponse }

  if (response.status !== 200) {
    throw new InvalidLoginOrPasswordError()
  }

  if (!response.body.Success) {
    let message = ''
    if (response.body.UserTempBlocked != null) {
      message = `User is temporarily blocked for ${response.body.TempBlockPeriodInMinutes ?? 'null'} minutes`
    }
    throw new InvalidLoginOrPasswordError(message)
  }

  return response.body
}

export async function setLegalEntity (legalEntityId: string, lastSuccessfulLogon: string, ticket: LegalEntitiesTicket): Promise<Auth> {
  const response = await fetchApi('CorporateLoginService.svc/SetLegalEntityWeb', {
    method: 'POST',
    body: {
      authenticationType: 'UsernamePassword',
      gridName: 'LegalEntityPreviewFlat',
      loginCertificateID: '',
      multipleUser: true,
      lastSuccessfulLogon,
      legalEntityId,
      ticket
    },
    sanitizeRequestLog: {
      headers: { cookie: true },
      body: {
        ticket: true
      }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true }
    }
  }) as FetchResponse & { headers: { 'set-cookie': string } }

  if (response.status !== 200) {
    throw new InvalidLoginOrPasswordError()
  }

  const cookies: string[] = parse(splitCookiesString(response.headers['set-cookie']))
    .map(cookie => cookie.name + '=' + cookie.value)

  return { cookie: cookies.join(';') }
}

export async function fetchAllAccounts (auth: Auth): Promise<AccountBalanceResponse[]> {
  const response = await fetchApi('DataServiceCorporate.svc/GetAllAccountBalance', {
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
        LastChangeAmount: true,
        ShortAccountNumber: true
      }
    }
  }) as FetchResponse & { body: AccountBalanceResponse[][] }

  assert(isArray(response.body), 'cant get accounts array', response)
  return response.body[1]
}

export async function fetchAccountTransactions (
  accountNumber: string,
  productCoreID: string,
  currencyCode: string,
  currencyCodeNumeric: string,
  auth: Auth,
  fromDate: Date,
  toDate: Date
): Promise<GetAccountTransactionsResponse[]> {
  const response = await fetchApi('DataServiceCorporate.svc/GetAccountTurnover', {
    method: 'POST',
    headers: {
      Cookie: auth.cookie
    },
    body: {
      accountNumber,
      filterParam: {
        AccountNumber: accountNumber,
        FromDate: moment(fromDate).format('DD.MM.YYYY'),
        ToDate: moment(toDate).format('DD.MM.YYYY'),
        CurrencyCodeNumeric: currencyCodeNumeric
      },
      productCoreID
    },
    sanitizeRequestLog: {
      headers: { cookie: true },
      body: {
        accountNumber: true,
        AccountNumber: true
      }
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
        ClientName: true,
        ClientLocality: true,
        DebitCreditAccount: true
      }
    }
  }) as FetchResponse & { body: GetAccountTransactionsResponse[] }

  assert(isArray(response.body), 'cant get transactions array', response)
  const transactions = response.body
  for (const transaction of transactions) {
    transaction.CurrencyCode = currencyCode
    transaction.CurrencyCodeNumeric = currencyCodeNumeric
  }
  return transactions
}
