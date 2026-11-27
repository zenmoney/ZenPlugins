import { FetchFunc } from '../../common/network'
import { generateUUID } from '../../common/utils'
import { getOptArray, getOptBoolean, getOptString } from '../../types/get'
import { createDeviceNonce, encryptAuth, encryptLogin } from './crypto'
import { AkbankFetchApi, APP_VERSION } from './fetchApi'
import { AccountFetchParams, AuthSession, DeviceIdentity, FirstFactor, Preferences } from './types'

const MAX_TRANSACTION_PAGES = 100
const AUTH_TYPE = 'MBL-RTL-SMR-MBB'
const OTHER_AUTH_TYPE = 'MBB'

export class AkbankApi {
  private readonly identity: DeviceIdentity
  private readonly fetchApi: AkbankFetchApi
  private deviceClientId?: string
  private tripleDesKey?: string

  constructor (options: {
    identity: DeviceIdentity
    fetch?: FetchFunc
    session?: AuthSession
  }) {
    this.identity = options.identity
    this.fetchApi = new AkbankFetchApi({ identity: options.identity, fetch: options.fetch, session: options.session })
    this.deviceClientId = options.session?.deviceClientId
    this.tripleDesKey = options.session?.tripleDesKey
  }

  async beginColdAuth (preferences: Preferences): Promise<FirstFactor> {
    const loginType = preferences.login.length === 11 ? 'TCKN' : 'MBB'
    const body = await this.fetchApi.request(
      'Mobile/MobileDirektAuthentication/DirektAuthentication1',
      {
        ...(loginType === 'TCKN' ? { tckn: preferences.login, mbb: null } : { tckn: null, mbb: preferences.login }),
        PushNotificationToken: null,
        isNfc: false,
        navigationParameters: null,
        ...this.authFields(loginType, { hardOtpFlag: true })
      },
      {
        igsEnc: encryptAuth(preferences.password, this.identity.clientUid),
        crystalHeader: true,
        emptyLoginHeader: true
      }
    )
    console.assert(getOptBoolean(body, 'isCaptchaRequired') !== true, 'Akbank requested an unsupported captcha challenge', {
      isCaptchaRequired: getOptBoolean(body, 'isCaptchaRequired'),
      isPhoneNumberRequired: getOptBoolean(body, 'isPhoneNumberRequired')
    })
    console.assert(getOptBoolean(body, 'isPhoneNumberRequired') !== true, 'Akbank requested an unsupported phone-number selection', {
      isPhoneNumberRequired: getOptBoolean(body, 'isPhoneNumberRequired')
    })
    console.assert(getOptBoolean(body, 'isSmsSend') === true, 'Akbank did not enter the supported SMS verification state', {
      isSmsSend: getOptBoolean(body, 'isSmsSend'),
      hardOtpFlag: getOptBoolean(body, 'hardOtpFlag'),
      otpIdPresent: isNonBlank(getOptString(body, 'otpId'))
    })
    return {
      login: getOptString(body, 'mbb') ?? preferences.login,
      tokenSessionId: this.fetchApi.getTokenSessionId()
    }
  }

  async verifySmsOtp (firstFactor: FirstFactor, otp: string): Promise<AuthSession> {
    console.assert(firstFactor.tokenSessionId === this.fetchApi.getTokenSessionId(), 'Akbank SMS verification session changed unexpectedly')
    const body = await this.fetchApi.request('Mobile/MobileDirektAuthentication/DirektAuthentication2', {
      mbb: firstFactor.login,
      hardOtpEnc: null,
      hceActiveDemo: false,
      isMCADummyRequest: false,
      employeeVersionFlag: false,
      otpEnc: encryptAuth(otp, this.identity.clientUid),
      softOtpEnc: null,
      ...this.authFields('MBB')
    })
    this.updateRegistration(body)
    return this.getSession()
  }

  async hotLogin (password: string): Promise<AuthSession> {
    console.assert(isNonBlank(this.deviceClientId) && isNonBlank(this.tripleDesKey), 'Akbank stored device authorization is incomplete')
    const deviceClientId = this.deviceClientId as string
    const tripleDesKey = this.tripleDesKey as string
    const body = await this.fetchApi.request(
      'Mobile/MobileDirektLogin/DirektLogin1',
      {
        clientDeviceID: deviceClientId,
        changeKey: true,
        smartPhoneDeviceClientID: null,
        hceActiveDemo: true,
        clientDeviceIDWithTimeStamp: encryptLogin(`${Date.now()}${deviceClientId}`, tripleDesKey),
        faceRecognitionFlag: false,
        hasFaceModel: false,
        employeeVersionFlag: false,
        isNfc: false,
        navigationParameters: null,
        ...this.authFields(OTHER_AUTH_TYPE, {
          channelKey: AUTH_TYPE,
          uniqueUserId: this.identity.clientUid
        })
      },
      { igsEnc: encryptLogin(password, tripleDesKey) }
    )
    this.updateRegistration(body)
    return this.getSession()
  }

  async fetchAccounts (): Promise<unknown> {
    return await this.fetchApi.request('Mobile/MobileAllAccounts/MobileAllAccounts3', {
      variables: null,
      activeTab: null,
      refreshNow: null
    })
  }

  async fetchTransactions (
    params: AccountFetchParams,
    fromDate: Date,
    toDate: Date
  ): Promise<unknown[]> {
    if (params.type === 'deposit') return await this.fetchDepositTransactions(params.accountId, fromDate, toDate)
    return await this.fetchCreditCardTransactions(params.cardId, params.isAdditionalCard, fromDate, toDate)
  }

  getSession (): AuthSession {
    console.assert(isNonBlank(this.deviceClientId) && isNonBlank(this.tripleDesKey), 'Akbank authorization artifacts are incomplete')
    return {
      version: 1,
      ...this.identity,
      deviceClientId: this.deviceClientId as string,
      tripleDesKey: this.tripleDesKey as string,
      tokenSessionId: this.fetchApi.getTokenSessionId()
    }
  }

  private async fetchDepositTransactions (accountId: string, fromDate: Date, toDate: Date): Promise<unknown[]> {
    const operations: unknown[] = []
    let hasMore = false
    let page = 0
    do {
      console.assert(page < MAX_TRANSACTION_PAGES, 'Akbank deposit transaction pagination limit exceeded', {
        accountId,
        page
      })
      const body = await this.fetchApi.request('Mobile/MobileDeposit/DepositAccountStatement2', {
        accountId,
        date2: formatDate(fromDate),
        date1: formatDate(toDate),
        minSrgTutar: '',
        maxSrgTutar: '',
        narHareketiGosterme: false,
        aciklama: ''
      })
      operations.push(...(getOptArray(body, 'accountExtractList') ?? []))
      hasMore = getOptBoolean(body, 'devamFlag') ?? false
      page += 1
    } while (hasMore)
    return operations
  }

  private async fetchCreditCardTransactions (
    cardId: string,
    isAdditionalCard: boolean,
    fromDate: Date,
    toDate: Date
  ): Promise<unknown[]> {
    const first = await this.fetchCreditCardStatement(cardId, isAdditionalCard, null)
    const operations = [...(getOptArray(first, 'transactionsWithinPeriod') ?? [])]
    const statementDates = extractStatementDates(getOptArray(first, 'CutOffDateArr') ?? [])
    for (const statementDate of statementDates) {
      const parsed = parseCutOffDate(statementDate)
      if (parsed !== null && parsed.getTime() < fromDate.getTime() - 40 * 24 * 60 * 60 * 1000) continue
      const body = await this.fetchCreditCardStatement(cardId, isAdditionalCard, statementDate)
      operations.push(...(getOptArray(body, 'transactionsWithinPeriod') ?? []))
    }
    const pending = await this.fetchPendingCreditCardTransactions(cardId, isAdditionalCard)
    operations.push(...pending.map(markPendingOperation))
    return deduplicateOperations(operations).filter(operation => {
      const rawDate = getOptString(operation, 'transactionTimeStamp') ?? getOptString(operation, 'Date')
      const date = rawDate === undefined ? null : parseOperationDate(rawDate)
      return date === null || (date.getTime() >= fromDate.getTime() && date.getTime() <= toDate.getTime())
    })
  }

  private async fetchCreditCardStatement (
    cardId: string,
    isAdditionalCard: boolean,
    cutOffDate: string | null
  ): Promise<unknown> {
    return await this.fetchApi.request('Mobile/MobileCreditCards/CreditCardExtract2', {
      dtTarih: cutOffDate,
      creditCardId: cardId,
      IsAdditionalCard: isAdditionalCard,
      isOpenBankingCard: false,
      PushVariables: null
    })
  }

  private async fetchPendingCreditCardTransactions (
    cardId: string,
    isAdditionalCard: boolean
  ): Promise<unknown[]> {
    const body = await this.fetchApi.request('Mobile/MobileCreditCards/CreditCardExtract1', {
      creditCardId: cardId,
      variables: null,
      getPendingProvisions: 'Y',
      getVirtualCardInformation: 'Y',
      getIncomingInstallments: 'N',
      IsAdditionalCard: isAdditionalCard,
      PushVariables: null,
      isOpenBankingCard: false,
      isTriggerOpenBankingRefresh: false
    })
    return getOptArray(body, 'transactionsWithinPeriod') ?? []
  }

  private authFields (
    channelType: string,
    overrides: { channelKey?: string, uniqueUserId?: string, hardOtpFlag?: boolean } = {}
  ): Record<string, unknown> {
    const manufacturer = ZenMoney.device?.manufacturer?.trim().toUpperCase()
    const model = manufacturer === undefined || manufacturer === '' ? this.identity.model : `${manufacturer} ${this.identity.model}`
    return {
      captchaEnc: null,
      phoneNumber: null,
      countryCallingCodeId: null,
      kullAdiEnc: null,
      clientUID: this.identity.clientUid,
      deviceOs: `ANDROID 15|V${APP_VERSION}|${model}|TR|${createDeviceNonce(this.identity.clientUid)}|${this.identity.model}`,
      isCracked: '0',
      userAgent: `Mozilla/5.0 (Linux; Android 15; ${this.identity.model}) AppleWebKit/537.36 Mobile Safari/537.36`,
      channelType,
      deviceType: 'SMARTPHONE',
      carrier: '',
      imei: overrides.uniqueUserId ?? this.identity.clientUid,
      connectionType: 'WIFI',
      deviceOsType: 'Android',
      deviceVersion: APP_VERSION,
      softOtpFlag: 'True',
      channelKey: overrides.channelKey ?? null,
      hardOtpFlag: overrides.hardOtpFlag ?? false,
      androidUID: this.identity.clientUid,
      singleFactorStatus: null,
      singleFactorLoginType: null,
      decreaseTime: false,
      flowId: null,
      authorizationId: null
    }
  }

  private updateRegistration (body: unknown): void {
    const deviceClientId = getOptString(body, 'deviceClientID') ?? getOptString(body, 'deviceClientId')
    const tripleDesKey = getOptString(body, 'code')
    console.assert(isNonBlank(deviceClientId) && isNonBlank(tripleDesKey), 'Akbank authorization response is missing device registration artifacts', {
      hasDeviceClientId: isNonBlank(deviceClientId),
      hasTripleDesKey: isNonBlank(tripleDesKey),
      hasSessionToken: isNonBlank(getOptString(body, 'tokenSessionID')) || isNonBlank(getOptString(body, 'tokenSessionId'))
    })
    this.deviceClientId = deviceClientId
    this.tripleDesKey = tripleDesKey
  }
}

export function createDeviceIdentity (): DeviceIdentity {
  return {
    clientUid: generateUUID().replace(/-/g, '').slice(0, 16).toLowerCase(),
    model: normalizeDeviceModel(ZenMoney.device?.model)
  }
}

function normalizeDeviceModel (value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return 'Pixel 8'
  const normalized = value.replace(/[^\w .-]/g, '').trim().slice(0, 40)
  return normalized === '' ? 'Pixel 8' : normalized
}

function formatDate (date: Date): string {
  console.assert(!Number.isNaN(date.getTime()), 'Akbank transaction request date is invalid')
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${day}.${month}.${year}`
}

function extractStatementDates (items: unknown[]): string[] {
  const dates = items.flatMap(item => {
    const value = getOptString(item, 'Value') ?? getOptString(item, 'value') ??
      getOptString(item, 'Key') ?? getOptString(item, 'key')
    return value === undefined ? [] : [value]
  })
  return Array.from(new Set(dates.filter(value => value.trim() !== ''))).sort()
}

function deduplicateOperations (operations: unknown[]): unknown[] {
  const seen = new Set<string>()
  return operations.filter(operation => {
    const key = getOptString(operation, 'Id') ?? getOptString(operation, 'transactionKey') ??
      JSON.stringify([getOptString(operation, 'Date'), getOptString(operation, 'Description'), getOptString(operation, 'Amount')])
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function markPendingOperation (operation: unknown): unknown {
  console.assert(operation !== null && typeof operation === 'object' && !Array.isArray(operation), 'Akbank pending card transaction has an unexpected shape')
  return { ...(operation as Record<string, unknown>), __akbankHold: true }
}

function parseCutOffDate (value: string): Date | null {
  const match = value.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/)
  if (match === null) return null
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
}

function parseOperationDate (value: string): Date | null {
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return parsed
  return parseCutOffDate(value)
}

function isNonBlank (value?: string): value is string {
  return value !== undefined && value.trim() !== ''
}
