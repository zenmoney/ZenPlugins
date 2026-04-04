import '../../polyfills/webAssembly'
import { fetch, fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'
import { parse, splitCookiesString } from 'set-cookie-parser'
import {
  AccountBalanceResponse,
  Auth,
  AuthTicket,
  GetAccountTransactionsResponse,
  GetLegalEntitiesResponse,
  LegalEntity,
  LegalEntitiesResponse,
  LegalEntitiesTicket,
  Preferences
} from './models'
import { isArray } from 'lodash'
import * as argon2 from 'argon2-browser'
import moment from 'moment'

const baseUrl = 'https://rol.raiffeisenbank.rs/CorporateV4/Protected/Services/'
const signalRBaseUrl = 'https://rol.raiffeisenbank.rs/CorporateV4/signalr'

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

// SignalR constants
const SIGNALR_HUB_NAME = 'ibankinghub'
const SIGNALR_CLIENT_PROTOCOL = '2.1'
const LEGAL_ENTITY_GRID_NAME = 'LegalEntityPreviewFlat'
// Bank allows ~180 seconds to confirm push. Each long poll blocks ~20 seconds on the server.
const MAX_PUSH_POLL_ATTEMPTS = 9
// Fixed session ID required by the LoginUPPush API endpoint
const PUSH_LOGIN_SESSION_ID = 1

const connectionData = encodeURIComponent(JSON.stringify([{ name: SIGNALR_HUB_NAME }]))

function signalRUrl (endpoint: string, connectionToken: string, transport: string): string {
  const token = encodeURIComponent(connectionToken)
  return `${signalRBaseUrl}/${endpoint}?transport=${transport}&clientProtocol=${SIGNALR_CLIENT_PROTOCOL}&connectionToken=${token}&connectionData=${connectionData}&_=${Date.now()}`
}

// LoginUPPush returns PrincipalData as string[][] (grid format for LegalEntityPreviewFlat).
// Column indices determined by observing the bank's API responses:
//   [0] = unknown, [1] = UserUniqueIdentifier, [2] = Name, [3] = address,
//   [4] = IsActive, [5] = LegalEntityID, [6] = city, [7] = unknown,
//   [8] = unknown, [9] = tax id, [10] = PrincipalID, [11] = user name,
//   [12] = role, [13] = SecurityUserID
const GRID_IDX_USER_UNIQUE_IDENTIFIER = 1
const GRID_IDX_NAME = 2
const GRID_IDX_IS_ACTIVE = 4
const GRID_IDX_LEGAL_ENTITY_ID = 5
const GRID_IDX_PRINCIPAL_ID = 10
const GRID_MIN_ROW_LENGTH = 11

function parseRequiredNumber (value: string | undefined, fieldName: string, rowIndex: number): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new InvalidLoginOrPasswordError(
      `Unexpected non-numeric ${fieldName} in PrincipalData at row ${rowIndex}`
    )
  }
  return parsed
}

function parsePrincipalDataGrid (rows: string[][]): LegalEntity[] {
  return rows.map((row: string[], index: number) => {
    if (row.length < GRID_MIN_ROW_LENGTH) {
      throw new InvalidLoginOrPasswordError(
        `Unexpected PrincipalData row format at index ${index}: expected at least ${GRID_MIN_ROW_LENGTH} columns, got ${row.length}`
      )
    }

    return {
      Name: row[GRID_IDX_NAME] ?? '',
      UserUniqueIdentifier: parseRequiredNumber(row[GRID_IDX_USER_UNIQUE_IDENTIFIER], 'UserUniqueIdentifier', index),
      LegalEntityID: parseRequiredNumber(row[GRID_IDX_LEGAL_ENTITY_ID], 'LegalEntityID', index),
      IsActive: row[GRID_IDX_IS_ACTIVE] === 'True',
      PrincipalID: parseRequiredNumber(row[GRID_IDX_PRINCIPAL_ID], 'PrincipalID', index)
    }
  })
}

interface SignalRMessage {
  C?: string
  M?: Array<{ H?: string, M?: string, A?: unknown[] }>
}

// Expected SignalR callback name for push login confirmation.
// The bank's frontend registers hub.client.LoginUPRequestApproved to receive this.
const PUSH_APPROVED_METHOD = 'LoginUPRequestApproved'

function extractPushRequestContent (message: unknown): string | null {
  const msg = message as SignalRMessage | null
  if (msg === null || msg === undefined || !Array.isArray(msg.M)) {
    return null
  }
  for (const m of msg.M) {
    if (m.H?.toLowerCase() !== SIGNALR_HUB_NAME) {
      continue
    }
    if (m.M !== PUSH_APPROVED_METHOD || !Array.isArray(m.A) || m.A.length === 0) {
      continue
    }
    const arg = m.A[0]
    if (typeof arg === 'object' && arg !== null && 'PushRequestContent' in arg) {
      const content = (arg as { PushRequestContent: unknown }).PushRequestContent
      if (typeof content === 'string') {
        return content
      }
    }
  }
  return null
}

async function performPushLogin (firstStepTicket: string, username: string): Promise<LegalEntitiesResponse> {
  const parseTrimmedJson = (body: string): unknown => body.length > 0 ? JSON.parse(body.trim()) : null

  // Step 1: Obtain SignalR connection token
  const negotiateResponse = await fetchJson(
    `${signalRBaseUrl}/negotiate?clientProtocol=${SIGNALR_CLIENT_PROTOCOL}&connectionData=${connectionData}&_=${Date.now()}`,
    { method: 'GET' }
  ) as FetchResponse & { body: { ConnectionToken: string } }

  const connectionToken = negotiateResponse.body.ConnectionToken

  // Step 2: Establish connection. Long polling is used for connect/poll to receive
  // push confirmation data. The hub itself requires serverSentEvents for start/send.
  // The connect request is typically bounded by the server's long poll timeout (observed ~20s).
  const connectPromise = fetch(signalRUrl('connect', connectionToken, 'longPolling'), {
    method: 'GET',
    parse: parseTrimmedJson,
    log: false
  })

  await fetchJson(signalRUrl('start', connectionToken, 'serverSentEvents'), { method: 'GET' })

  // Step 3: Request push notification to the user's mobile app
  const data = JSON.stringify({
    H: SIGNALR_HUB_NAME,
    M: 'CreateLoginPushRequest',
    A: [firstStepTicket, username],
    I: 0
  })
  await fetch(signalRUrl('send', connectionToken, 'serverSentEvents'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(data)}`,
    parse: parseTrimmedJson,
    log: false
  })

  // Step 4: Wait for push confirmation via long polling.
  // Each poll request blocks on the server (~20s) until data arrives or times out.
  const connectResult = await connectPromise
  let pushRequestContent = extractPushRequestContent(connectResult.body)
  for (let attempt = 0; pushRequestContent === null && attempt < MAX_PUSH_POLL_ATTEMPTS; attempt++) {
    const pollResult = await fetch(signalRUrl('poll', connectionToken, 'longPolling'), {
      method: 'GET',
      parse: parseTrimmedJson,
      log: false
    })
    pushRequestContent = extractPushRequestContent(pollResult.body)
  }

  if (pushRequestContent === null) {
    throw new InvalidLoginOrPasswordError('Push confirmation timeout. Please confirm in your Moja mBanka Biznis app and try again.')
  }

  // Step 5: Complete 2FA with the push confirmation data
  const pushResponse = await fetchApi('CorporateLoginService.svc/LoginUPPush', {
    method: 'POST',
    body: {
      firstStepTicket,
      pushRequestContent,
      sessionID: PUSH_LOGIN_SESSION_ID,
      gridName: LEGAL_ENTITY_GRID_NAME
    },
    sanitizeRequestLog: {
      headers: { cookie: true },
      body: { firstStepTicket: true, pushRequestContent: true }
    },
    sanitizeResponseLog: {
      headers: { 'set-cookie': true },
      body: { Ticket: true, PrincipalData: true }
    }
  }) as FetchResponse & { body: { Success: boolean, Ticket: string, LastSuccessfulLogon: string, PinMustBeChanged: boolean, PrincipalData: string[][] } }

  if (!pushResponse.body.Success) {
    throw new InvalidLoginOrPasswordError('Mobile app confirmation failed. Please try again.')
  }

  return {
    Success: pushResponse.body.Success,
    Ticket: pushResponse.body.Ticket,
    LastSuccessfulLogon: pushResponse.body.LastSuccessfulLogon,
    PinMustBeChanged: pushResponse.body.PinMustBeChanged,
    PrincipalData: parsePrincipalDataGrid(pushResponse.body.PrincipalData),
    FailedAttempts: null,
    WrongPassword: null,
    UserTempBlocked: null,
    UserBlocked: null,
    TempBlockPeriodInMinutes: null
  }
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

export async function getLegalEntities (ticket: AuthTicket, login: string): Promise<LegalEntitiesResponse> {
  const response = await fetchApi('CorporateLoginService.svc/GetLegalEntities', {
    method: 'POST',
    body: {
      gridName: LEGAL_ENTITY_GRID_NAME,
      ticket,
      authType: null
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
  }) as FetchResponse & { body: GetLegalEntitiesResponse }

  if (response.status !== 200) {
    throw new InvalidLoginOrPasswordError()
  }

  if (response.body.ForceSecondLogin === true) {
    return await performPushLogin(response.body.Ticket, login)
  }

  if (!response.body.Success) {
    let message = ''
    if (response.body.UserTempBlocked != null) {
      message = `User is temporarily blocked for ${response.body.TempBlockPeriodInMinutes ?? 'null'} minutes`
    }
    throw new InvalidLoginOrPasswordError(message)
  }

  if (!Array.isArray(response.body.PrincipalData)) {
    throw new InvalidLoginOrPasswordError('Unexpected response format from GetLegalEntities')
  }

  return response.body as LegalEntitiesResponse
}

export async function setLegalEntity (legalEntityId: string, lastSuccessfulLogon: string, ticket: LegalEntitiesTicket): Promise<Auth> {
  const response = await fetchApi('CorporateLoginService.svc/SetLegalEntityWeb', {
    method: 'POST',
    body: {
      authenticationType: 'UsernamePassword',
      gridName: 'LegalEntityPreviewFlat',
      loginCertificateID: '',
      multipleUser: false,
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
