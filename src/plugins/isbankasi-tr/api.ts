import crypto from 'crypto'

import { FetchFunc } from '../../common/network'
import { generateUUID } from '../../common/utils'
import { getArray, getOptBoolean, getOptNumber, getString } from '../../types/get'
import { IsBankFetchApi } from './fetchApi'
import { AccountFetchParams, AuthSession, DeviceIdentity, Preferences } from './types'

const MAX_TRANSACTION_PAGES = 100
const SUPPORTED_OTP_AST_TYPE = 2
const ISTANBUL_UTC_OFFSET_MS = 3 * 60 * 60 * 1000

export class IsBankApi {
  private readonly identity: DeviceIdentity
  private readonly fetchApi: IsBankFetchApi
  private accessToken?: string
  private refreshToken?: string

  constructor (options: {
    identity: DeviceIdentity
    fetch?: FetchFunc
    session?: AuthSession
  }) {
    this.identity = options.identity
    this.fetchApi = new IsBankFetchApi(options)
    this.accessToken = options.session?.accessToken
    this.refreshToken = options.session?.refreshToken
  }

  async initialize (): Promise<void> {
    await this.fetchApi.requestMcm('IsCepOnboardingInitialize/GetIsCepStartupParameters', {
      RegisteredCustomerListInDevice: ['UNREGISTERED']
    }, 'startup', undefined, {
      clearCookies: true,
      disableResponseCookie: true,
      updateRandNo: false
    })
  }

  async passwordVerification (preferences: Preferences): Promise<{ astType: number, accessToken: string }> {
    const isCitizenId = preferences.login.length === 11
    const body = await this.fetchApi.requestMcm('IsCepLogin/PasswordVerification', {
      ...(isCitizenId ? { citizenID: preferences.login } : { customerNumber: preferences.login }),
      password: preferences.password,
      deviceMatchInfo: this.createDeviceMatchInfo({ isPushEnabled: true }),
      captchaVerified: true,
      captchaType: 'image'
    }, 'password')

    const accessToken = getString(body, 'authorization.accessToken')
    const astType = getOptNumber(body, 'loginInfo.security.igaInformation.astType')
    console.assert(astType === SUPPORTED_OTP_AST_TYPE, 'İşCep returned an unsupported second-factor type', {
      astType,
      supportedAstType: SUPPORTED_OTP_AST_TYPE,
      deviceMatchingStatus: getOptNumber(body, 'loginInfo.security.deviceMatchingStatus'),
      secondFactorAuthentication: getOptNumber(body, 'loginInfo.security.secondFactorAuthentication')
    })
    this.accessToken = accessToken
    return { astType: SUPPORTED_OTP_AST_TYPE, accessToken }
  }

  async verifyOtp (otp: string, astType: number, mfaToken: string): Promise<AuthSession> {
    console.assert(astType === SUPPORTED_OTP_AST_TYPE, 'İşCep OTP verification received an unsupported second-factor type', {
      astType,
      supportedAstType: SUPPORTED_OTP_AST_TYPE
    })
    const body = await this.fetchApi.requestMcm('IsCepLogin/IGAVerification', {
      deviceMatchInfo: {
        ...this.createDeviceMatchInfo({
          isPushEnabled: false,
          mobileApprovalCode: otp,
          challengeResponse: ''
        })
      },
      secondFactorAuthentication: astType,
      mfaToken,
      HasDeviceNfc: true
    }, 'otp', this.accessToken)

    this.accessToken = getString(body, 'authorization.accessToken')
    this.refreshToken = getString(body, 'authorization.refreshToken')
    return this.getSession()
  }

  async refresh (): Promise<AuthSession> {
    console.assert(isNonBlank(this.refreshToken), 'İşCep refresh token is missing from stored authorization')
    const tokens = await this.fetchApi.refreshToken(this.refreshToken as string)
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken
    return this.getSession()
  }

  async fetchAccounts (): Promise<unknown[]> {
    const body = await this.fetchApi.requestMcm('Accounting/Listing/GetAccounts', {}, 'data', this.accessToken)
    return getArray(body, 'accountList')
  }

  async fetchTransactions (
    params: AccountFetchParams,
    fromDate: Date,
    toDate: Date
  ): Promise<unknown[]> {
    const operations: unknown[] = []
    let hasMore = false
    let page = 0
    do {
      console.assert(page < MAX_TRANSACTION_PAGES, 'İşCep transaction pagination limit exceeded', {
        accountIndex: params.accountIndex,
        page
      })
      const body = await this.fetchApi.requestMcm('Accounting/Activity/Retrieve', {
        AccountIndex: params.accountIndex,
        Type: mapAccountTypeForTransactions(params.accountType),
        FinancialType: 100,
        GetAccounts: false,
        UseFilterParameters: true,
        BeginTime: formatIstanbulDate(toDate),
        Number: null,
        OperationType: null,
        MinAmount: null,
        EndTime: formatIstanbulDate(fromDate),
        BranchCode: null,
        MaxAmount: null,
        addresses: null,
        UseAmountParameters: false,
        Description: null,
        RemainingData: page > 0
      }, 'data', this.accessToken)
      operations.push(...getArray(body, 'Activities'))
      hasMore = getOptBoolean(body, 'HasMore') ?? false
      page += 1
    } while (hasMore)
    return operations
  }

  getSession (): AuthSession {
    console.assert(isNonBlank(this.accessToken) && isNonBlank(this.refreshToken), 'İşCep authorization tokens are incomplete')
    return {
      version: 3,
      ...this.identity,
      accessToken: this.accessToken as string,
      refreshToken: this.refreshToken as string,
      ...this.fetchApi.getState()
    }
  }

  private createDeviceMatchInfo (options: {
    isPushEnabled: boolean
    mobileApprovalCode?: string
    challengeResponse?: string
  }): Record<string, unknown> {
    return {
      SerialNumbers: [this.identity.deviceId],
      useRegisteredDeviceOnly: false,
      currentDeviceSerialNo: this.identity.deviceId,
      isRegisteredDevice: false,
      ...(options.challengeResponse !== undefined ? { challengeResponse: options.challengeResponse } : {}),
      ...(options.mobileApprovalCode !== undefined ? { mobileApprovalCode: options.mobileApprovalCode } : {}),
      isPushEnabled: options.isPushEnabled,
      deviceSpecificIdentifiers: [{
        Key: 'deviceMatchingSerialNumber',
        Value: this.identity.deviceId,
        showInfoMessage: false
      }, {
        Key: 'androidId',
        Value: this.identity.androidId,
        showInfoMessage: false
      }],
      hasBiometricAuthentication: false
    }
  }
}

export function createDeviceIdentity (): DeviceIdentity {
  return {
    deviceId: generateUUID(),
    androidId: crypto.randomBytes(8).toString('hex'),
    ...getCurrentDeviceProfile()
  }
}

export function getCurrentDeviceProfile (): Pick<DeviceIdentity, 'manufacturer' | 'model' | 'osVersion'> {
  return {
    manufacturer: normalizeDeviceText(ZenMoney.device?.manufacturer, 'Google'),
    model: normalizeDeviceText(ZenMoney.device?.model, 'Pixel 8'),
    osVersion: normalizeOsVersion(ZenMoney.device?.os?.version)
  }
}

function normalizeDeviceText (value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.trim() === '') return fallback
  const normalized = value.replace(/[^\w .-]/g, '').trim().slice(0, 40)
  return normalized === '' ? fallback : normalized
}

function normalizeOsVersion (value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return '15'
  const normalized = value.replace(/[^\w .-]/g, '').trim().slice(0, 20)
  return normalized === '' ? '15' : normalized
}

function formatIstanbulDate (date: Date): string {
  console.assert(!Number.isNaN(date.getTime()), 'İşCep transaction request date is invalid')
  const istanbulDate = new Date(date.getTime() + ISTANBUL_UTC_OFFSET_MS)
  const year = istanbulDate.getUTCFullYear()
  const month = String(istanbulDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(istanbulDate.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mapAccountTypeForTransactions (accountType: number): number {
  if (accountType === 1) return 0
  if (accountType === 2) return 1
  if (accountType === 3) return 4
  if (accountType === 4) return 3
  if (accountType === 7) return 5
  return 6
}

function isNonBlank (value?: string): boolean {
  return value !== undefined && value.trim() !== ''
}
