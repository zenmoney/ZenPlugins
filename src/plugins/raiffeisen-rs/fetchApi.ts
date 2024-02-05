import { fetch, fetchJson, FetchOptions, FetchResponse, openWebViewAndInterceptRequest } from '../../common/network'
import { InvalidLoginOrPasswordError, UserInteractionError } from '../../errors'
import { parse, splitCookiesString } from 'set-cookie-parser'
import { AccountBalanceResponse, Auth, GetAccountTransactionsResponse, GetTransactionDetailsResponse, LoginResponse, Preferences } from './models'
import { isArray } from 'lodash'
import * as argon2 from 'argon2-browser'
import moment from 'moment'

const SALTED_PASSWORD_KEY = 'saltedPassword'
const API_URL = 'https://rol.raiffeisenbank.rs/Retail/Protected/Services/'

const isWebAssemblyAvailable = 'WebAssembly' in global

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetchJson(API_URL + url, options ?? {})
}

async function getSaltedPasswordProgrammatically (login: string, password: string): Promise<string> {
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

async function getSaltedPasswordFromUser (login: string): Promise<string> {
  // Тeoретически, сюда можно передать и пароль в формате base64_urlsafe,
  // но кажется, что это не ОК с точки зрения использования данных пользователя.
  const PASSWORD_ENCODE_URL = 'https://cyberchef.org/#recipe=Argon2(%7B\'option\':\'UTF8\',\'string\':\'' +
    login + '\'%7D,3,4096,1,32,\'Argon2i\',\'Hex%20hash\')&input=UGFzc3dvcmRDaGFuZ2VNZQ'

  await openWebViewAndInterceptRequest({
    url: PASSWORD_ENCODE_URL,
    intercept: (request) => {
      return true
    }
  })

  const saltedPassword = await ZenMoney.readLine('Зашифрованный пароль из формы')
  if (!saltedPassword) {
    throw new UserInteractionError()
  }
  return saltedPassword
}

async function getSaltedPassword (login: string, password: string): Promise<string> {
  const savedPassword = ZenMoney.getData(SALTED_PASSWORD_KEY)
  if (savedPassword) {
    return savedPassword as string
  }

  const saltedPassword = isWebAssemblyAvailable ? await getSaltedPasswordProgrammatically(login, password) : await getSaltedPasswordFromUser(login)
  ZenMoney.setData(SALTED_PASSWORD_KEY, saltedPassword)
  ZenMoney.saveData()

  return saltedPassword
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<Auth> {
  const isPasswordSalted = (await fetch(API_URL + 'RetailLoginService.svc/SaltedPassword', {
    method: 'POST',
    body: JSON.stringify({
      userName: login
    }),
    sanitizeRequestLog: {
      body: {
        userName: true
      }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true }
    }
  })).body === 'true'

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
    ZenMoney.clearData()
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
