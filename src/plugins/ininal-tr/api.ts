import { Preferences, Session, AccountInfo, AccountTransaction } from './models'
import { generateUUID } from '../../common/utils'
import { sanitize } from '../../common/sanitize'
import { dateInTimezone } from '../../common/dateUtils'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import get from '../../types/get'
import { InvalidPreferencesError, InvalidOtpCodeError } from '../../errors'
import padLeft from 'pad-left'

export class IninalApi {
  private readonly baseUrl: string
  private readonly anonymousToken: string
  private readonly authDeviceName: string
  private readonly userAgent: string

  constructor (options: {
    baseUrl: string
    anonymousToken: string
    authDeviceName: string
    userAgent: string
  }) {
    this.baseUrl = options.baseUrl
    this.anonymousToken = options.anonymousToken
    this.authDeviceName = options.authDeviceName
    this.userAgent = options.userAgent
  }

  private async fetchApi (
    url: string,
    session?: Session,
    options?: FetchOptions,
    predicate?: (x: FetchResponse) => boolean
  ): Promise<FetchResponse> {
    const sessionHeaders = {
      Authorization: `Bearer ${
        ((session !== null && session !== undefined) && 'accessToken' in session)
        ? (session.accessToken ?? '')
        : this.anonymousToken}`
    }

    const commonHeaders = {
      'User-Agent': this.userAgent
    }

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
            ...sessionHeaders,
            ...commonHeaders
          }
        }
      : { ...sanitizeOptions, headers: sessionHeaders }

    const response = await fetchJson(this.baseUrl + url, mergedOptions)

    if (predicate != null) {
      this.validateResponse(response, response => (get(response.body, 'httpCode') === 200) && predicate(response))
    }

    return response
  }

  private validateResponse (response: FetchResponse, predicate?: (x: FetchResponse) => boolean): void {
    console.assert((predicate == null) || predicate(response), 'non-successful response')
  }

  public async login (preferences: Preferences, isInBackground: boolean, session?: Session): Promise<Session> {
    console.debug('login', sanitize({ session }, true))

    if (session == null) {
      session = {
        deviceId: this.generateDeviceID()
      }
    }

    session.deviceId = session?.deviceId !== '' ? session?.deviceId : this.generateDeviceID()

    if ('accessToken' in session && 'userId' in session) {
      // try to fetch user info to check auth
      const userResponse = await this.fetchApi(
        `v3.0/users/${session.userId ?? ''}`,
        session,
        {
          method: 'GET'
        }
      ) as FetchResponse & { body: { httpCode: number, response: { customerToken: string } } }
      // if ok, session is fine -- return it
      if (userResponse.body.httpCode === 200 && userResponse.body.response.customerToken === session.userId) {
        return session
      }
    }

    // remove session accessToken now -- it's not valid for sure
    if ('accessToken' in session) {
      delete session.accessToken
    }

    const confirmationToken = await this.authSignin(preferences, session)

    const { authToken, userId, needOtp } = await this.authCheckPassword(confirmationToken, preferences, session)

    session.userId = userId
    // if got auth token, return session now
    if (authToken != null) {
      session.accessToken = authToken
      return session
    }

    // check if authToken is needed because of OTP missing
    if (needOtp) {
      const smsCode = await ZenMoney.readLine('Enter SMS OTP Code')
      console.assert(smsCode, 'OTP Code is missing')

      const { authToken, userId } = await this.authVerifyDevice(confirmationToken, smsCode as string, session)

      session.userId = userId
      session.accessToken = authToken

      return session
    }

    // otherwise, authCheckPassword failed -- no token and otp is missing
    throw new InvalidPreferencesError()
  }

  private async authVerifyDevice (confirmationToken: string, otpCode: string, session: Session): Promise<{ authToken: string, userId: string }> {
    const rawResponse = await this.fetchApi(
      'v3.1/auth/verify/device',
      undefined,
      {
        method: 'POST',
        body: {
          confirmationToken,
          otp: otpCode,
          deviceId: session.deviceId,
          saveDevice: true,
          deviceName: this.authDeviceName
        }
      },
      (res) => {
        return (res.body as { response?: { customerStatus?: string } })?.response?.customerStatus === 'ACTIVE'
      }
    ) as FetchResponse & {
      body: {
        response: {
          token: string
          userToken: string
          accessToken: boolean
        }
      }
    }

    const response = rawResponse.body.response

    if (!response.accessToken) {
      throw new InvalidOtpCodeError()
    }

    return {
      authToken: response.token,
      userId: response.userToken
    }
  }

  private async authCheckPassword (confirmationToken: string, { password }: Preferences, session: Session): Promise<{ authToken: string | null, userId: string, needOtp: boolean }> {
    const rawResponse = await this.fetchApi(
      'v3.1/auth/check/password',
      undefined,
      {
        method: 'POST',
        body: {
          confirmationToken,
          password,
          deviceId: session.deviceId
        }
      },
      (res) => {
        return (res.body as { response?: { customerStatus?: string } })?.response?.customerStatus === 'ACTIVE'
      }
    ) as FetchResponse & {
      body: {
        response: {
          token: string
          userToken: string
          otp: boolean
          accessToken: boolean
        }
      }
    }

    const response = rawResponse.body.response

    return {
      authToken: response.accessToken ? response.token : null,
      userId: response.userToken,
      needOtp: response.otp
    }
  }

  private async authSignin ({ login }: Preferences, session: Session): Promise<string> {
    const response = await this.fetchApi(
      'v3.1/auth/signin',
      undefined,
      {
        method: 'POST',
        body: {
          loginCredential: login
        }
      },
      (res) => {
        return (res.body as { response?: { customerStatus?: string } })?.response?.customerStatus === 'ACTIVE'
      }
    ) as FetchResponse & { body: { response: { token: string } } }

    return response.body.response.token
  }

  // fetchAccounts returns list of accounts, but also refreshes session token
  public async fetchAccounts (session: Session): Promise<{ session?: Session, accounts: AccountInfo[] }> {
    const rawResponse = await this.fetchApi(
      `v3.2/users/${session.userId ?? ''}/cardaccount`,
      session,
      {
        method: 'POST',
        // official app submits deviceID, but there can be only one
        // active deviceID. turns out deviceID parameter is optional.
        body: {}
      },
      (res) => {
        const resp = (res.body as { response?: { accountListResponse?: unknown[] } })?.response
        return !!((resp != null) && 'accountListResponse' in resp)
      }
    ) as FetchResponse & {
      body: {
        response: {
          accountListResponse: Array<{
            accountNumber: string
            accountName: string
            accountStatus: string
            accountBalance: number
            isFavorite: boolean
            currency: string
            cardListResponse: Array<{
              cardId: string
              productCode: string
              cardStatus: string
              cardType: string
              barcodeNumber: string
              cardNumber: string
              cardToken: string
            }>
          }>
          accessToken?: string
        }
      }
    }

    const response = rawResponse.body.response

    // if there is accessToken in response, update the session
    let newSession: Session | undefined
    if ((response?.accessToken) !== null) {
      session.accessToken = response.accessToken
      newSession = session
    }

    const accounts = response.accountListResponse.map((apiAccount): AccountInfo => ({
      number: apiAccount.accountNumber,
      name: apiAccount.accountName,
      balance: apiAccount.accountBalance,
      currency: apiAccount.currency,

      // filter out blocked and fake cards which would have cardStatus STOPLIST
      cardNumbers: apiAccount.cardListResponse.filter(card => card.cardStatus === 'A').map(card => card.cardNumber)
    }))

    return {
      session: newSession,
      accounts
    }
  }

  public async fetchAccountTransactions (session: Session, accountNumber: string, fromDate: Date, toDate?: Date): Promise<AccountTransaction[]> {
    // if toDate is not provided, set it to the end of the current day
    if (toDate == null) {
      toDate = new Date()
      toDate.setHours(23, 59, 59, 999)
    }

    const rawResponse = await this.fetchApi(
      `v3.1/users/${session.userId ?? ''}/transactions/${accountNumber}`,
      session,
      {
        method: 'POST',
        body: {
          startDate: this.formatDateRangeBoundary(fromDate),
          endDate: this.formatDateRangeBoundary(toDate),
          resultLimit: null
        }
      },
      (res) => {
        const resp = (res.body as { response?: { transactionList?: unknown[] } })?.response
        return !!((resp != null) && 'transactionList' in resp)
      }
    ) as FetchResponse & {
      body: {
        response: {
          transactionList: Array<{
            transactionDate: string
            description: string
            referenceNo: string
            amount: number
            currency: string
            icon: string
            transactionType: string
          }>
        }
      }
    }

    return rawResponse.body.response.transactionList.map((t): AccountTransaction => ({
      date: new Date(t.transactionDate),
      description: t.description,
      reference: t.referenceNo,
      amount: t.amount,
      currency: t.currency,
      icon: t.icon,
      transactionType: t.transactionType
    }))
  }

  private generateDeviceID (): string {
    return generateUUID().toUpperCase()
  }

  // ininal API accepts date in Turkey time zone
  private formatDateRangeBoundary (date: Date): string {
    const timezoneOffset = 3 * 60 // Europe/Istanbul - +3
    const d = dateInTimezone(date, timezoneOffset)
    const pad = (num: number, padNum = 2): string => padLeft(String(num), padNum, '0')

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.` +
      pad(d.getMilliseconds(), 3)
  }
}

export const ininalApi = new IninalApi({
  baseUrl: 'https://api.ininal.com/',
  // API uses a long-lived token for "anonymous" operations, which is hard-coded in the app:
  // SIGNIN,REGISTER,USERS_GET_WITH_DEVICES,USERS_POST_DEVICE,OTP_RESEND,USERS_FORGOT_PASSWORD,USERS_STATUS_PUT,USERS_EMAIL_EXIST
  // to obtain without traffic capture from android app:
  //   apktool ...; strings lib/arm64-v8a/libkeys_native.so | grep eyJhbGciOiJIUzI1NiJ9
  // this one expires at Dec 12 2024
  anonymousToken: 'eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1NzYyMjAxNjMsInN1YiI6ImluaW5hbCIsImlzcyI6ImluaW5hbCIsInNjb3BlIjoiU0lHTklOLFJFR0lTVEVSLFVTRVJTX0dFVF9XSVRIX0RFVklDRVMsVVNFUlNfUE9TVF9ERVZJQ0UsT1RQX1JFU0VORCxVU0VSU19GT1JHT1RfUEFTU1dPUkQsVVNFUlNfU1RBVFVTX1BVVCxVU0VSU19FTUFJTF9FWElTVCIsImlzVXNlciI6ZmFsc2UsImNoYW5uZWxJZCI6MSwiY29tcGFueUlkIjoxLCJleHAiOjE3MzQwMDQ5MjN9.mZxNZQk0pxY2qPxMrk3Y1CMh2KUlO7uihPozTrnIyWw',
  authDeviceName: 'iPhone10,1',
  userAgent: 'ininal/3.4.91 (com.ngier.ininalwallet; build:1; iOS 16.3.1) Alamofire/5.4.4'
})
