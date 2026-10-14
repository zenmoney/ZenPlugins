import fetchMock from 'fetch-mock'

import { IsBankApi } from '../api'
import { AuthSession, DeviceIdentity } from '../types'

const passwordUrl = 'https://mobil.isbank.com.tr/ClientGateway/IsCepLogin/PasswordVerification'
const accountsUrl = 'https://mobil.isbank.com.tr/ClientGateway/Accounting/Listing/GetAccounts'

const identity: DeviceIdentity = {
  deviceId: '11111111-2222-3333-4444-555555555555',
  androidId: '0123456789abcdef',
  manufacturer: 'Google',
  model: 'Pixel 8',
  osVersion: '15'
}

const session: AuthSession = {
  version: 3,
  ...identity,
  accessToken: 'secret-access-token',
  refreshToken: 'secret-refresh-token',
  randNo: 'secret-rand-number',
  cookies: { JSESSIONID: 'secret-session-cookie' }
}

function getLog (debug: jest.SpyInstance, label: string): Record<string, unknown> {
  const call = debug.mock.calls.find(([entry]) => entry === label)
  if (call === undefined || call[1] === null || typeof call[1] !== 'object') {
    throw new Error(`Expected ${label} network log`)
  }
  return call[1] as Record<string, unknown>
}

describe('İşCep network log sanitization', () => {
  beforeEach(() => {
    global.ZenMoney = {
      device: { model: 'Pixel 8' },
      features: {}
    } as unknown as typeof ZenMoney
  })

  afterEach(() => {
    fetchMock.restore()
    jest.restoreAllMocks()
  })

  it('masks credentials and customer identity while retaining non-auth device diagnostics', async () => {
    fetchMock.once(passwordUrl, {
      status: 200,
      headers: { 'Set-Cookie': 'JSESSIONID=response-secret-cookie; Path=/; Secure' },
      body: {
        Tuid: 'RESPONSE-DIAGNOSTIC-TUID',
        RandNo: 'response-secret-rand',
        Error: null,
        authorization: {
          accessToken: 'response-secret-access-token',
          refreshToken: 'response-secret-refresh-token'
        },
        loginInfo: {
          customer: { fullName: 'Sensitive Customer', phone: '+905551234567' },
          security: { igaInformation: { astType: 2 } }
        }
      }
    }, { method: 'POST' })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const api = new IsBankApi({ identity })

    await api.passwordVerification({ login: 'customer-secret', password: 'password-secret' })

    const requestText = JSON.stringify(getLog(debug, 'request'))
    expect(requestText).not.toContain('customer-secret')
    expect(requestText).not.toContain('password-secret')
    expect(requestText).toContain(identity.deviceId)
    expect(requestText).toContain(identity.androidId)
    expect(requestText).not.toContain('A562432E-061C-4584-8252-19F153BF0E31')
    expect(requestText).toMatch(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/)

    const response = getLog(debug, 'response')
    const responseText = JSON.stringify(response)
    expect(responseText).not.toContain('response-secret-cookie')
    expect(responseText).not.toContain('response-secret-rand')
    expect(responseText).not.toContain('response-secret-access-token')
    expect(responseText).not.toContain('response-secret-refresh-token')
    expect(responseText).not.toContain('Sensitive Customer')
    expect(responseText).not.toContain('+905551234567')
    expect(responseText).toContain('RESPONSE-DIAGNOSTIC-TUID')
    expect(responseText).toContain('astType')
  })

  it('keeps diagnostic bank errors and account payload visible while masking stored authorization', async () => {
    fetchMock.once(accountsUrl, {
      status: 200,
      body: {
        Error: {
          Category: 'PROTOCOL',
          ErrorCode: 'NEW_ACCOUNT_STATE',
          Text: 'Unsupported account state'
        },
        accountList: [{
          Index: 'diagnostic-account-index',
          IBAN: 'TR00 0000 0000 0000 0000 0000 00',
          Balance: '123.45'
        }]
      }
    }, { method: 'POST' })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const api = new IsBankApi({ identity, session })

    await expect(api.fetchAccounts()).rejects.toBeInstanceOf(Error)

    const requestText = JSON.stringify(getLog(debug, 'request'))
    expect(requestText).not.toContain(session.accessToken)
    expect(requestText).not.toContain(session.cookies.JSESSIONID as string)
    expect(requestText).not.toContain(session.randNo as string)

    const responseText = JSON.stringify(getLog(debug, 'response'))
    expect(responseText).toContain('NEW_ACCOUNT_STATE')
    expect(responseText).toContain('Unsupported account state')
    expect(responseText).toContain('diagnostic-account-index')
    expect(responseText).toContain('TR00 0000 0000 0000 0000 0000 00')
    expect(responseText).toContain('123.45')
  })
})
