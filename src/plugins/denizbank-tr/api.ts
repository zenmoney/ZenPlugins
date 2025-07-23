import crypto from 'crypto-js'
import qs from 'querystring'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { sanitize } from '../../common/sanitize'
import { generateUUID } from '../../common/utils'
import get from '../../types/get'
import { InvalidOtpCodeError, InvalidPreferencesError } from '../../errors'

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

export class DenizBankApi {
  private readonly baseUrl: string
  private readonly encryptionStaticKey: crypto.lib.WordArray

  constructor (options: { baseUrl: string, encryptionStaticKeyBase64: string }) {
    this.baseUrl = options.baseUrl
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
      sanitizeRequestLog: (obj: unknown) => sanitize(obj, true),
      sanitizeResponseLog: (obj: unknown) => sanitize(obj, true)
    }

    const mergedOptions = (options != null)
      ? {
          ...sanitizeOptions,
          ...options,
          headers: {
            ...(typeof options.headers === 'object' && options.headers != null ? options.headers : {}),
            ...sessionHeaders
          }
        }
      : { ...sanitizeOptions, headers: sessionHeaders }

    const response = await fetchJson(this.baseUrl + url, mergedOptions)

    if (predicate !== null && predicate !== undefined) {
      this.validateResponse(response, response => !(get(response.body, 'error') != null) && predicate(response))
    }
    return response
  }

  private validateResponse (response: FetchResponse, predicate?: (x: FetchResponse) => boolean): void {
    console.assert((predicate == null) || predicate(response), 'non-successful response')
  }

  public async login ({ login, password }: Preferences, isInBackground: boolean, session?: Session): Promise<Session> {
    console.debug('login', sanitize({ session }, true))
    if ((session != null) && 'createdDate' in session) {
      const expirationDate = new Date(session.createdDate.valueOf() + session.timeoutSeconds * 1000)
      console.debug('login', { expirationDate })

      if (expirationDate > new Date()) {
        await this.extendSession(session)
        console.debug('login', 'extended session')
        return {
          ...session,
          createdDate: new Date()
        }
      }
    }

    session = {
      clientId: generateUUID()
    }

    const { token, encryptionKey } = await this.getInitialToken(session)

    session = {
      clientId: session.clientId,
      encryptionKey,
      token
    }

    const { id: captchaId, captchaByteData } = await this.getCaptcha(session)

    const captchaData = await this.askForCaptcha(captchaByteData)

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

    const { currentTime, sessionTimeout } = await this.sendCredentials(session, loginEncrypted, passwordEncrypted, captchaIdEncrypted, captchaData)
    session = {
      ...session,
      createdDate: currentTime,
      timeoutSeconds: sessionTimeout
    }

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

    return session
  }

  private async getCaptcha (session: Session): Promise<{ id: string, captchaByteData: string }> {
    const response = await this.fetchApi('auth/captcha-create', session, {
      method: 'GET'
    }) as FetchResponse & { body: { id: string, captchaByteData: string } }

    console.log('getCaptcha', response.body)

    return response.body
  }

  private async askForCaptcha (captchaByteData: string): Promise<string> {
    const image = new Uint8Array(Buffer.from(captchaByteData, 'base64'))
    const code = await ZenMoney.readLine('Введите код с картинки', { image })
    if (code === null || code === undefined || code === '') {
      throw new InvalidOtpCodeError()
    }
    return code
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
      'token' in res.body &&
      'encryptionKey' in res.body
    }) as { body: { token: string, encryptionKey: string } }

    console.debug('getInitialToken', sanitize(response.body, true))

    return response.body
  }

  private async sendCredentials (session: Session, loginEncrypted: string, passwordEncrypted: string, captchaIdEncrypted: string, captchaData: string): Promise<{ currentTime: Date, sessionTimeout: number }> {
    const response = await this.fetchApi('auth/token', session, {
      method: 'PATCH',
      body: {
        identifier: loginEncrypted,
        captchaId: captchaIdEncrypted,
        secret: passwordEncrypted,
        grantType: 'username',
        applicationVersion: 'JanusIB-20250527.3652-gD2GnZwbfqRyrb3xeCZ2',
        captchaData
      }
    }) as FetchResponse & { body: { currentTime: string, sessionTimeout: number, Message?: string | null } }

    console.debug('sendCredentials', sanitize(response.body, true))

    if (response.body.Message?.match(/.*girdiğiniz.*bilgil.*/i) != null) {
      throw new InvalidPreferencesError()
    }

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
      'pushSentId' in res.body &&
      'maskedPhoneNumber' in res.body
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
    }) as FetchResponse & { body: { isSuccess: boolean }, headers: { 'x-token': string } }

    console.debug('verifyPush', sanitize({ body: response.body, headers: response.headers }, true))

    if (!response.body.isSuccess) {
      return { pushVerified: false }
    }

    return {
      pushVerified: true,
      token: response.headers['x-token']
    }
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
    console.debug('fetchCards', sanitize(response.body, true))

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
    toDate?: Date): Promise<CardTransaction[] | undefined> {
    const response = await this.fetchApi(
      `cards/new-debitcard-transactions/${cardId}?${qs.stringify({
        startTime: fromDate.toISOString(),
        endTime: toDate?.toISOString()
      })}`,
      session
    ) as FetchResponse & {
      body: {
        selectedCardIntermRecordList: {
          intermRecordList: Array<Record<string, unknown>>
        }
      }
    }

    console.debug('fetchCardTransactions', sanitize(response.body, true))

    return response.body.selectedCardIntermRecordList?.intermRecordList.map(t => ({
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
      (res) => typeof res.body === 'object' && res.body != null && 'accounts' in res.body
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
    session) as FetchResponse & { body: { activities: Array<Record<string, unknown>> } }

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

export const denizBankApi = new DenizBankApi({
  baseUrl: 'https://janusacikdenizv2.denizbank.com/Janus/api/',
  encryptionStaticKeyBase64: 'U0tob0FBeWRTWWltQ1NpSw=='
})
