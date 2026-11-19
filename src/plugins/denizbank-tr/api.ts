import crypto from 'crypto-js'
import qs from 'querystring'
import { fetch, fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { sanitize } from '../../common/sanitize'
import { generateUUID } from '../../common/utils'
import get, { getOptString, getOptNumber } from '../../types/get'
import { UserInteractionError } from '../../errors'
import { solveCaptcha } from './captcha'

export type Session = {
  clientId: string
} | {
  clientId: string
  encryptionKey: string
  token: string
} | {
  clientId: string
  encryptionKey: string
  token: string
  createdDate: Date
  timeoutSeconds: number
}

export interface Preferences {
  login: string
  password: string
}

export interface AccountInfo {
  id: string
  iban: string
  name: string
  currency: string
  balance: number
  available: number
}

export interface AccountTransaction {
  id: string
  date: Date
  amount: number
  currency: string
  description: string
  usageType: string
  remainingBalance: number
}

export interface CardInfo {
  guid: string
  name: string
  maskedCardNumber: string
  currency: string
}

export interface CardTransaction {
  date: Date
  amount: number
  currency: string
  name: string
  description: string
  usageType: string
}

// Error details and financial data stay visible; authentication and customer identity do not.
function sanitizeLog (value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeLog)
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    const sensitive = /^(authorization|cookie|set-cookie|x-token|x-transaction-token|token|encryptionKey|identifier|secret|captchaId|captchaData|captchaByteData|code|applicationVersion|fullName|firstName|lastName|userName|customerName|customerIdentity|customerBirthDate|loginOperatorName|email|phoneNumber|mobilePhoneNumber|address|gibSessionId|hcpSingleSessionToken|hcpSingleSessionId|signature|serialNumberEncrypted|shadowCardNumber|encPhoneNumber|mobileCrushActivationToken|cardHolderName|customerNumber|identityNumber|customerId|customerNo|userId|birthDate|profileImageUrl|authenticatorType|mainCardOwnerName|cardHolder)$/i.test(key)
    // The API sometimes returns full PANs alongside already masked card numbers.
    const fullPan = /^(cardNumber|maskedCardNumber)$/i.test(key) && typeof item === 'string' && /^\d{13,19}$/.test(item)
    return [key, sensitive || /token|password|secret|^enc[A-Z]|^.*(?:phone|email|address)$/i.test(key) || fullPan ? sanitize(item, true) : sanitizeLog(item)]
  }))
}

class SessionExpiredError extends Error {}

export class DenizBankApi {
  private readonly baseUrl: string
  private readonly encryptionStaticKey: crypto.lib.WordArray
  private readonly onSessionUpdate?: (session: Session) => void

  constructor (options: { baseUrl: string, encryptionStaticKeyBase64: string, onSessionUpdate?: (session: Session) => void }) {
    this.baseUrl = options.baseUrl
    this.onSessionUpdate = options.onSessionUpdate
    this.encryptionStaticKey = crypto.enc.Utf8.parse(Buffer.from(options.encryptionStaticKeyBase64, 'base64').toString('utf8'))
  }

  private getCipherOption (key: crypto.lib.WordArray): Parameters<typeof crypto.AES.decrypt>[2] {
    return {
      mode: crypto.mode.CBC,
      padding: crypto.pad.Pkcs7,
      keySize: 128,
      blockSize: 128,
      iv: key,
      key
    }
  }

  private async fetchApi (
    url: string,
    session?: Session,
    options?: FetchOptions,
    predicate?: (x: FetchResponse) => boolean
  ): Promise<FetchResponse> {
    const sessionHeaders = (session != null)
      ? {
          'X-Client-Id': session.clientId,
          ...('token' in session ? { 'X-Token': session.token } : {})
        }
      : {}

    const sanitizeOptions: Pick<FetchOptions, 'sanitizeRequestLog' | 'sanitizeResponseLog'> = {
      sanitizeRequestLog: sanitizeLog,
      sanitizeResponseLog: sanitizeLog
    }

    const mergedOptions = (options != null)
      ? {
          ...sanitizeOptions,
          ...options,
          headers: {
            ...(options.body != null && options.body !== '' ? { 'Content-Type': 'application/json-patch+json' } : {}),
            ...(typeof options.headers === 'object' && options.headers != null ? options.headers : {}),
            ...sessionHeaders
          }
        }
      : { ...sanitizeOptions, headers: sessionHeaders }

    const response = await fetchJson(this.baseUrl + url, mergedOptions)

    // This exact expiry state is also handled by the current Janus web interceptor.
    if (response.status === 401 && get(response.body, 'ErrorType') === 1 && get(response.body, 'ResponseType') === 5) {
      throw new SessionExpiredError('Session expired')
    }
    this.validateResponse(response, res => res.ok && get(res.body, 'error') == null && get(res.body, 'ErrorCode') == null)
    const token = response.headers.get('x-token')
    if (session != null && 'token' in session && token != null && token !== '' && token !== session.token) {
      session.token = token
      if ('createdDate' in session) this.onSessionUpdate?.(session)
    }
    if (predicate != null) this.validateResponse(response, predicate)
    return response
  }

  private validateResponse (response: FetchResponse, predicate?: (x: FetchResponse) => boolean): void {
    console.assert((predicate == null) || predicate(response), 'Non-successful response', { status: response.status, body: sanitizeLog(response.body) })
  }

  public async login ({ login, password }: Preferences, isInBackground: boolean, session?: Session): Promise<Session> {
    console.debug('login', sanitize({ session }, true))
    if ((session != null) && 'createdDate' in session) {
      const expirationDate = new Date(session.createdDate.valueOf() + session.timeoutSeconds * 1000)
      console.debug('login', { expirationDate })

      if (expirationDate > new Date()) {
        try {
          await this.extendSession(session)
          console.debug('login', 'extended session')
          return { ...session, createdDate: new Date() }
        } catch (error) {
          if (!(error instanceof SessionExpiredError)) throw error
          console.debug('Saved session was rejected; starting interactive login')
        }
      }
    }

    if (isInBackground) throw new UserInteractionError()
    const applicationVersion = await this.getApplicationVersion()
    session = { clientId: generateUUID() }

    const { token, encryptionKey } = await this.getInitialToken(session)

    session = {
      clientId: session.clientId,
      encryptionKey,
      token
    }

    const { id: captchaId, code: captchaData } = await this.askForCaptcha(session, isInBackground)

    const cryptoKey = crypto.AES.decrypt(
      session.encryptionKey,
      this.encryptionStaticKey,
      this.getCipherOption(this.encryptionStaticKey)
    )

    const loginEncrypted = crypto.AES.encrypt(
      login,
      cryptoKey,
      this.getCipherOption(cryptoKey)
    ).toString()

    const passwordEncrypted = crypto.AES.encrypt(
      password,
      cryptoKey,
      this.getCipherOption(cryptoKey)
    ).toString()

    const captchaIdEncrypted = crypto.AES.encrypt(
      captchaId,
      cryptoKey,
      this.getCipherOption(cryptoKey)
    ).toString()

    const { sessionTimeout } = await this.sendCredentials(session, loginEncrypted, passwordEncrypted, captchaIdEncrypted, captchaData, applicationVersion)

    const { pushSentId } = await this.sendPush(session)

    let userHasVerifiedPush = false
    let pushTimeout = 90

    while (!userHasVerifiedPush && pushTimeout > 0) {
      const timeStart = new Date()
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const pushIdEncrypted = crypto.AES.encrypt(
        pushSentId,
        cryptoKey,
        this.getCipherOption(cryptoKey)
      ).toString()

      const res = await this.verifyPush(session, pushIdEncrypted)

      if (res.pushVerified) {
        userHasVerifiedPush = true
        session.token = res.token
      }

      pushTimeout -= (new Date().valueOf() - timeStart.valueOf()) / 1000
    }

    console.assert(userHasVerifiedPush, 'Push confirmation timed out')
    return { ...session, createdDate: new Date(), timeoutSeconds: sessionTimeout }
  }

  private async getApplicationVersion (): Promise<string> {
    const response = await fetch('https://acikdeniz.denizbank.com/', {
      sanitizeRequestLog: sanitizeLog,
      sanitizeResponseLog: { headers: { 'set-cookie': true }, body: true }
    })
    const version = typeof response.body === 'string' ? response.body.match(/window\.versionInfo\s*=\s*"(\d{8}\.\d+)"/)?.[1] : undefined
    console.assert(response.ok && version != null, 'Could not determine Janus application version', { status: response.status })
    return `JanusIB-${String(version)}-`
  }

  private async getCaptcha (session: Session): Promise<{ id: string, captchaByteData: string }> {
    const response = await this.fetchApi('auth/captcha-create', session, {
      method: 'GET'
    }, res => getOptString(res.body, 'id') != null && getOptString(res.body, 'captchaByteData') != null) as FetchResponse & { body: { id: string, captchaByteData: string } }

    return response.body
  }

  private async askForCaptcha (session: Session, isInBackground: boolean): Promise<{ id: string, code: string }> {
    return await solveCaptcha(async () => await this.getCaptcha(session), isInBackground)
  }

  private async getInitialToken (session: Session): Promise<{ token: string, encryptionKey: string }> {
    const response = await this.fetchApi('auth/token', undefined, {
      method: 'POST',
      body: {
        browserAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        browserName: 'Chrome',
        browserVersion: '136.0.0.0',
        clientDate: new Date()
          .toISOString()
          .replace(/(\d{4}-\d{2}-\d{2}).*/, '$1'),
        clientGMT: '+0000',
        clientTime: new Date()
          .toISOString()
          .replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1'),
        isMobileBrowser: 0,
        recordTime: new Date().toISOString(),
        screenResolution: '5120x1440',
        code: session.clientId
      }
    }, (res) => {
      return typeof res.body === 'object' &&
      res.body != null &&
      getOptString(res.body, 'token') != null &&
      getOptString(res.body, 'encryptionKey') != null
    }) as { body: { token: string, encryptionKey: string } }

    console.debug('getInitialToken', sanitize(response.body, true))

    return response.body
  }

  private async sendCredentials (session: Session, loginEncrypted: string, passwordEncrypted: string, captchaIdEncrypted: string, captchaData: string, applicationVersion: string): Promise<{ currentTime: Date, sessionTimeout: number }> {
    const response = await this.fetchApi('auth/token', session, {
      method: 'PATCH',
      body: {
        identifier: loginEncrypted,
        captchaId: captchaIdEncrypted,
        secret: passwordEncrypted,
        grantType: 'username',
        applicationVersion: applicationVersion + ('token' in session ? session.token : ''),
        captchaData
      }
    }, res => get(res.body, 'isSuccess') === true &&
      Number.isFinite(new Date(getOptString(res.body, 'currentTime') ?? '').valueOf()) &&
      Number.isFinite(getOptNumber(res.body, 'sessionTimeout')) &&
      (getOptNumber(res.body, 'sessionTimeout') ?? 0) > 0) as FetchResponse & { body: { currentTime: string, sessionTimeout: number } }

    return {
      currentTime: new Date(response.body.currentTime),
      sessionTimeout: response.body.sessionTimeout
    }
  }

  private async sendPush (session: Session): Promise<{ pushSentId: string, maskedPhoneNumber: string }> {
    const response = await this.fetchApi('auth/otp?isMobileNotification=true', session, {
      method: 'POST',
      body: '',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    }, (res) => {
      return typeof res.body === 'object' &&
      res.body != null &&
      getOptString(res.body, 'pushSentId') != null &&
      getOptString(res.body, 'maskedPhoneNumber') != null
    }) as { body: { pushSentId: string, maskedPhoneNumber: string } }

    console.debug('sendPush', sanitize(response.body, true))

    return response.body
  }

  private async verifyPush (session: Session, pushIdEncrypted: string): Promise<{ pushVerified: false } | { pushVerified: true, token: string }> {
    const response = await this.fetchApi('auth/token?validationType=mobileNotification', session, {
      method: 'PATCH',
      body: {
        code: pushIdEncrypted
      }
    }, res => typeof get(res.body, 'isSuccess') === 'boolean') as FetchResponse & { body: { isSuccess: boolean } }

    console.debug('verifyPush', sanitize({ body: response.body, headers: response.headers }, true))

    if (!response.body.isSuccess) {
      return { pushVerified: false }
    }

    const token = response.headers.get('x-token')
    console.assert(token != null && token !== '', 'Missing token after push confirmation')
    return { pushVerified: true, token: token as string }
  }

  private async extendSession (session: Session): Promise<void> {
    await this.fetchApi('auth/session-extension', session)
  }

  public async fetchCards (session: Session): Promise<CardInfo[]> {
    const response = await this.fetchApi(
      'cards?isVirtualDebitCardInclude=true',
      session,
      undefined,
      (res) => typeof res.body === 'object' && res.body != null
    ) as FetchResponse & { body: Record<string, unknown> }
    console.assert(get(response.body, 'ErrorType') == null, 'Invalid cards response')

    const cardIds = Object.values(response.body).reduce<CardInfo[]>((acc, cardResponse) => {
      if (typeof cardResponse === 'object' && cardResponse != null) {
        for (const prop of Object.values(cardResponse)) {
          if (Array.isArray(prop)) {
            for (const cardInfo of prop) {
              if (typeof cardInfo === 'object' && cardInfo != null && 'guid' in cardInfo) {
                acc.push({
                  guid: cardInfo.guid,
                  name: cardInfo.name,
                  maskedCardNumber: cardInfo.maskedCardNumber,
                  currency: cardInfo.currency
                })
              }
            }
          }
        }
      }

      return acc
    }, [])

    console.debug('fetchCards', sanitize({ cardIds }, true))

    return cardIds
  }

  public async fetchCardTransactions (
    session: Session,
    cardId: string,
    fromDate: Date,
    toDate?: Date): Promise<CardTransaction[]> {
    const response = await this.fetchApi(
      `cards/new-debitcard-transactions/${cardId}?${qs.stringify({
        startTime: fromDate.toISOString(),
        endTime: toDate?.toISOString()
      })}`,
      session,
      undefined,
      res => Array.isArray(get(res.body, 'selectedCardIntermRecordList.intermRecordList'))
    ) as FetchResponse & {
      body: {
        selectedCardIntermRecordList: {
          intermRecordList: Array<Record<string, unknown>>
        }
      }
    }

    console.debug('fetchCardTransactions', sanitize(response.body, true))

    return response.body.selectedCardIntermRecordList.intermRecordList.map(t => ({
      currency: t.currency as string,
      amount: -(t.transactionAmount as number),
      description: t.description as string,
      date: new Date(t.orgTransactionDate as string),
      name: t.transactionName as string,
      usageType: t.usageType as string
    }))
  }

  public async fetchAccounts (session: Session): Promise<AccountInfo[]> {
    const response = await this.fetchApi(
      'accounts',
      session,
      undefined,
      (res) => typeof res.body === 'object' && res.body != null && Array.isArray(get(res.body, 'accounts')) && (get(res.body, 'accounts') as unknown[]).length > 0
    ) as FetchResponse & { body: { accounts: Array<Record<string, unknown>> } }
    console.debug('fetchAccounts', sanitize(response.body, true))
    return response.body.accounts.map(a => ({
      id: a.id as string,
      iban: a.iban as string,
      currency: a.currencyCode as string,
      name: a.name as string,
      balance: a.balance as number,
      available: a.availableBalance as number
    }))
  }

  public async fetchTransactions (session: Session, accountId: string, fromDate: Date, toDate?: Date): Promise<AccountTransaction[]> {
    const respose = await this.fetchApi(
    `accounts/${accountId}/activities?${qs.stringify({
      startTime: fromDate.toISOString(),
      endTime: toDate?.toISOString()
    })}`,
    session, undefined, res => Array.isArray(get(res.body, 'activities'))) as FetchResponse & { body: { activities: Array<Record<string, unknown>> } }

    console.debug('fetchTransactions', sanitize(respose.body, true))

    return respose.body.activities.map(t => ({
      id: t.uniqueTransactionId as string,
      date: new Date(t.time as string),
      amount: t.amount as number,
      currency: t.currencyCode as string,
      description: t.description as string,
      usageType: t.usageType as string,
      remainingBalance: t.remainingBalance as number
    }))
  }
}

export function createDenizBankApi (onSessionUpdate?: (session: Session) => void): DenizBankApi {
  return new DenizBankApi({
    baseUrl: 'https://acikdeniz.denizbank.com/Janus/api/',
    encryptionStaticKeyBase64: 'U0tob0FBeWRTWWltQ1NpSw==',
    onSessionUpdate
  })
}

export const denizBankApi = createDenizBankApi()
