import fetchMock from 'fetch-mock'
import { TemporaryError } from '../../../errors'
import { installFetchMockDeveloperFriendlyFallback } from '../../../testUtils'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'
import { fetchAccounts, fetchOperations, fetchTransactions, login } from '../api'

installFetchMockDeveloperFriendlyFallback(fetchMock)

const baseUrl = 'https://mbank.rbank.by:443/services/v2/'
const sessionToken = 'test-session-token'
const expectedDeviceInfo = {
  parameters: [
    {
      device_model: 'ne2211',
      device_name: 'op516fl1',
      deviceid: 'test-device-id',
      geolocationdata: '53.902284, 27.561831',
      locale: 'ru_by',
      time_zone: 'europe/minsk',
      os_name: 'android',
      os_version: '11',
      width: '1080',
      height: '2400',
      scale: '3',
      uuid: 'test-device-id',
      android_specific: {
        build_bootloader: '',
        build_display: 'ne2211_11_c.48',
        build_fingerprint: 'ne2211_11_c.48',
        build_id: 'rkq1.211119.001',
        build_manufacturer: 'oneplus',
        build_radio: '',
        iccid: '',
        package_manager_getsystemavailablefeatures: [
          'android.hardware.camera',
          'android.hardware.location.gps',
          'android.hardware.location.network',
          'android.hardware.nfc',
          'android.hardware.telephony',
          'android.hardware.touchscreen',
          'android.hardware.wifi',
          'android.software.webview'
        ]
      }
    }
  ]
}

let dataApi

beforeEach(() => {
  dataApi = makePluginDataApi({
    device_id: 'test-device-id',
    anti_fraud_id: 'test-anti-fraud-id',
    push_id: 'test-push-id'
  })
  global.ZenMoney = {
    ...dataApi.methods,
    readLine: jest.fn(async () => '123456')
  }
})

describe('login', () => {
  it('uses the Android mobile contract and retries with SMS confirmation', async () => {
    fetchMock.once(baseUrl + 'session/login', {
      status: 400,
      body: {
        errorInfo: {
          error: '10415',
          errorText: 'Введите код из СМС'
        }
      }
    }, { method: 'POST' })
    fetchMock.once(baseUrl + 'session/login', {
      status: 200,
      body: {
        errorInfo: {
          error: '0',
          errorText: 'Успешно'
        },
        fingerprint: 'test-fingerprint',
        sessionToken
      }
    }, { method: 'POST' })

    await expect(login('test-login', 'test-password')).resolves.toBe(sessionToken)

    const calls = fetchMock.calls(baseUrl + 'session/login')
    expect(calls).toHaveLength(2)

    const firstRequest = JSON.parse(calls[0][1].body)
    expect(firstRequest).toEqual({
      applicID: '1.60.0',
      browser: 'OP516FL1',
      browserVersion: 'NE2211 (NE2211)',
      clientKind: '0',
      deviceUDID: 'test-device-id',
      deviceInfo: expectedDeviceInfo,
      login: 'test-login',
      password: 'test-password',
      platform: 'Android',
      platformVersion: '11',
      pushId: 'test-push-id'
    })

    const secondRequest = JSON.parse(calls[1][1].body)
    expect(secondRequest).toEqual({
      ...firstRequest,
      confirmationData: '123456'
    })
    expect(calls[0][1].headers).toEqual(expect.objectContaining({
      _ac1: 'test-anti-fraud-id',
      language: 'ru'
    }))
    expect(calls[1][1].headers).toEqual(expect.objectContaining({
      _ac1: 'test-anti-fraud-id',
      language: 'ru'
    }))
    expect(ZenMoney.readLine).toHaveBeenCalledWith('Введите код из СМС', {
      time: 120000,
      inputType: 'text'
    })
    expect(dataApi.currentData.anti_fraud_id).toBe('test-fingerprint')
  })

  it('fails login when SMS confirmation response returns bank error', async () => {
    fetchMock.once(baseUrl + 'session/login', {
      status: 400,
      body: {
        errorInfo: {
          error: '10415',
          errorText: 'Введите код из СМС'
        }
      }
    }, { method: 'POST' })
    fetchMock.once(baseUrl + 'session/login', {
      status: 400,
      body: {
        errorInfo: {
          error: '10003',
          errorText: 'Сессионный ключ не задан'
        }
      }
    }, { method: 'POST' })

    await expect(login('test-login', 'test-password')).rejects.toMatchObject({
      bankMessage: 'Сессионный ключ не задан'
    })
  })

  it('fails login when successful response has no session token', async () => {
    fetchMock.once(baseUrl + 'session/login', {
      status: 200,
      body: {
        errorInfo: {
          error: '0',
          errorText: 'Успешно'
        }
      }
    }, { method: 'POST' })

    await expect(login('test-login', 'test-password')).rejects.toBeInstanceOf(TemporaryError)
  })
})

describe('fetchAccounts', () => {
  it('loads card accounts through account overview and card balance endpoint', async () => {
    let balanceRequests = 0
    fetchMock.once({
      method: 'POST',
      matcher: (url, { body, headers }) => {
        const request = JSON.parse(body)
        return url === baseUrl + 'products/getUserAccountsOverview' &&
          headers.session_token === sessionToken &&
          headers._ac0 === sessionToken &&
          headers._ac1 === 'test-anti-fraud-id' &&
          headers.language === 'ru' &&
          request.cardAccount &&
          request.creditAccount &&
          request.currentAccount &&
          request.depositAccount
      },
      response: {
        status: 200,
        body: {
          errorInfo: {
            error: '0',
            errorText: 'Успешно'
          },
          overviewResponse: {
            cardAccount: [
              {
                internalAccountId: 'internal-account-id',
                cardAccountNumber: 'card-account-number',
                currency: '933',
                productName: 'Личные, BYN',
                availableAmount: 123.45,
                cards: [
                  {
                    cardNumberMasked: '4*** **** **** 1111',
                    cardHash: 'first-card-hash',
                    currency: '933',
                    retailCardId: 111,
                    availableAmount: 222.22
                  },
                  {
                    cardNumberMasked: '5*** **** **** 2222',
                    cardHash: 'second-card-hash',
                    currency: '933',
                    retailCardId: 222
                  }
                ],
                bankCode: '288',
                rkcCode: '004',
                accountType: '1'
              }
            ]
          }
        }
      }
    })
    fetchMock.once({
      method: 'POST',
      matcher: (url, { body, headers }) => {
        const request = JSON.parse(body)
        const matched = url === baseUrl + 'payment/simpleExcute' &&
          headers.session_token === sessionToken &&
          headers._ac0 === sessionToken &&
          headers._ac1 === 'test-anti-fraud-id' &&
          headers.language === 'ru' &&
          request.komplatRequests[0].request.includes('<RequestType>Balance</RequestType>') &&
          request.komplatRequests[0].request.includes('first-card-hash')
        if (matched) {
          balanceRequests += 1
        }
        return matched
      },
      response: {
        status: 200,
        body: {
          komplatResponse: [
            {
              response: '<BS_Response><Balance><Amount>111,11</Amount></Balance></BS_Response>'
            }
          ]
        }
      }
    })
    fetchMock.once({
      method: 'POST',
      matcher: (url, { body, headers }) => {
        const request = JSON.parse(body)
        const matched = url === baseUrl + 'payment/simpleExcute' &&
          headers.session_token === sessionToken &&
          headers._ac0 === sessionToken &&
          headers._ac1 === 'test-anti-fraud-id' &&
          headers.language === 'ru' &&
          request.komplatRequests[0].request.includes('<RequestType>Balance</RequestType>') &&
          request.komplatRequests[0].request.includes('second-card-hash')
        if (matched) {
          balanceRequests += 1
        }
        return matched
      },
      response: {
        status: 200,
        body: {
          komplatResponse: [
            {
              response: '<BS_Response><Balance><Amount>222,22</Amount></Balance></BS_Response>'
            }
          ]
        }
      }
    })

    await expect(fetchAccounts(sessionToken)).resolves.toEqual([
      expect.objectContaining({
        internalAccountId: 'internal-account-id',
        cardHash: 'first-card-hash',
        balance: '111,11'
      }),
      expect.objectContaining({
        internalAccountId: 'internal-account-id',
        cardHash: 'second-card-hash',
        balance: '222,22'
      })
    ])
    expect(balanceRequests).toBe(2)
  })
})

describe('fetchTransactions', () => {
  it('loads uncleared operations through GetAuthHistory for every card', async () => {
    const accounts = [
      {
        id: 'regular-byn-account',
        productType: 'Visa Classic',
        instrument: 'BYN',
        instrumentCode: '933',
        cardHash: 'regular-card-hash'
      },
      {
        id: 'virtual-account',
        productType: 'Visa Virtual',
        instrument: 'BYN',
        instrumentCode: '933',
        cardHash: 'virtual-card-hash'
      }
    ]
    fetchMock.once({
      method: 'POST',
      matcher: (url, { body, headers }) => {
        const request = JSON.parse(body)
        return url === baseUrl + 'payment/simpleExcute' &&
          headers.session_token === sessionToken &&
          headers._ac0 === sessionToken &&
          headers._ac1 === 'test-anti-fraud-id' &&
          headers.language === 'ru' &&
          request.komplatRequests[0].request.includes('<RequestType>GetAuthHistory</RequestType>') &&
          request.komplatRequests[0].request.includes('regular-card-hash')
      },
      response: {
        status: 200,
        body: {
          komplatResponse: [
            {
              response: '<BS_Response><GetAuthHistory><Operation Date="20260504123456" Type="*Оплата* Безналичная операция" Currency="933" Merchant="REGULAR SHOP">-5,00</Operation></GetAuthHistory></BS_Response>'
            }
          ]
        }
      }
    })
    fetchMock.once({
      method: 'POST',
      matcher: (url, { body, headers }) => {
        const request = JSON.parse(body)
        return url === baseUrl + 'payment/simpleExcute' &&
          headers.session_token === sessionToken &&
          headers._ac0 === sessionToken &&
          headers._ac1 === 'test-anti-fraud-id' &&
          headers.language === 'ru' &&
          request.komplatRequests[0].request.includes('<RequestType>GetAuthHistory</RequestType>') &&
          request.komplatRequests[0].request.includes('virtual-card-hash')
      },
      response: {
        status: 200,
        body: {
          komplatResponse: [
            {
              response: '<BS_Response><GetAuthHistory><Operation Date="20260505123456" Type="*Оплата* Безналичная операция" Currency="933" Merchant="SHOP">-10,50</Operation></GetAuthHistory></BS_Response>'
            }
          ]
        }
      }
    })

    await expect(fetchTransactions(sessionToken, accounts, new Date('2026-05-01T00:00:00.000+03:00'))).resolves.toEqual([
      {
        account_id: 'regular-byn-account',
        accountCurrencyCode: '933',
        transactionDate: new Date('2026-05-04T12:34:56+03:00'),
        transactionName: '*Оплата* Безналичная операция',
        transactionCurrencyCode: '933',
        transactionAmount: -5,
        merchant: 'REGULAR SHOP',
        hold: true
      },
      {
        account_id: 'virtual-account',
        accountCurrencyCode: '933',
        transactionDate: new Date('2026-05-05T12:34:56+03:00'),
        transactionName: '*Оплата* Безналичная операция',
        transactionCurrencyCode: '933',
        transactionAmount: -10.5,
        merchant: 'SHOP',
        hold: true
      }
    ])
  })
})

describe('fetchOperations', () => {
  it('loads full card account statement with session and anti-fraud headers', async () => {
    const fromDate = new Date('2026-05-01T00:00:00.000+03:00')
    const toDate = new Date('2026-05-31T23:59:59.000+03:00')
    const account = {
      id: 'account-id',
      internalAccountId: 'internal-account-id',
      accountType: '1',
      bankCode: '288',
      cardHash: 'card-hash',
      instrumentCode: '933',
      rkcCode: '004'
    }

    fetchMock.once({
      method: 'POST',
      matcher: (url, { body, headers }) => {
        const request = JSON.parse(body)
        return url === baseUrl + 'products/getCardAccountFullStatement' &&
          headers.session_token === sessionToken &&
          headers._ac0 === sessionToken &&
          headers._ac1 === 'test-anti-fraud-id' &&
          headers.language === 'ru' &&
          request.currencyCode === 933 &&
          request.internalAccountId === 'internal-account-id' &&
          request.reportData.from === fromDate.getTime() &&
          request.reportData.till === toDate.getTime()
      },
      response: {
        status: 200,
        body: {
          errorInfo: {
            error: '0',
            errorText: 'Успешно'
          },
          operations: [
            {
              accountNumber: 'account-id',
              operationName: 'Покупка товаров и услуг',
              transactionAuthCode: '123456',
              transactionDate: 1777986000000,
              operationDate: 1777899600000,
              transactionAmount: 10,
              transactionCurrency: '933',
              operationAmount: 10,
              operationCurrency: '933',
              operationPlace: 'SHOP',
              operationSign: '-1',
              mcc: '5411'
            }
          ]
        }
      }
    })

    await expect(fetchOperations(sessionToken, [account], fromDate, toDate)).resolves.toEqual([
      {
        id: '123456',
        account_id: 'account-id',
        operationName: 'Покупка товаров и услуг',
        operationDate: new Date(1777986000000),
        operationCurrencyCode: '933',
        operationAmount: -10,
        transactionDate: new Date(1777899600000),
        transactionAmount: -10,
        transactionCurrencyCode: '933',
        merchant: 'SHOP',
        hold: false,
        mcc: '5411'
      }
    ])
  })

  it('filters full statement operations by requested transaction date range', async () => {
    const fromDate = new Date('2026-05-10T00:00:00.000+03:00')
    const toDate = new Date('2026-05-20T23:59:59.000+03:00')
    const account = {
      id: 'account-id',
      internalAccountId: 'internal-account-id',
      accountType: '1',
      bankCode: '288',
      cardHash: 'card-hash',
      instrumentCode: '933',
      rkcCode: '004'
    }

    fetchMock.once({
      method: 'POST',
      matcher: baseUrl + 'products/getCardAccountFullStatement',
      response: {
        status: 200,
        body: {
          operations: [
            {
              operationName: 'Покупка товаров и услуг',
              transactionAuthCode: 'before-range',
              transactionDate: new Date('2026-05-12T12:00:00.000+03:00').getTime(),
              operationDate: new Date('2026-05-09T12:00:00.000+03:00').getTime(),
              transactionAmount: 10,
              transactionCurrency: '933',
              operationAmount: 10,
              operationCurrency: '933',
              operationPlace: 'SHOP BEFORE',
              operationSign: '-1'
            },
            {
              operationName: 'Покупка товаров и услуг',
              transactionAuthCode: 'inside-range',
              transactionDate: new Date('2026-05-15T12:00:00.000+03:00').getTime(),
              operationDate: new Date('2026-05-15T12:00:00.000+03:00').getTime(),
              transactionAmount: 20,
              transactionCurrency: '933',
              operationAmount: 20,
              operationCurrency: '933',
              operationPlace: 'SHOP INSIDE',
              operationSign: '-1'
            },
            {
              operationName: 'Покупка товаров и услуг',
              transactionAuthCode: 'after-range',
              transactionDate: new Date('2026-05-18T12:00:00.000+03:00').getTime(),
              operationDate: new Date('2026-05-21T12:00:00.000+03:00').getTime(),
              transactionAmount: 30,
              transactionCurrency: '933',
              operationAmount: 30,
              operationCurrency: '933',
              operationPlace: 'SHOP AFTER',
              operationSign: '-1'
            }
          ]
        }
      }
    })

    await expect(fetchOperations(sessionToken, [account], fromDate, toDate)).resolves.toEqual([
      expect.objectContaining({
        id: 'inside-range',
        transactionDate: new Date('2026-05-15T12:00:00.000+03:00'),
        transactionAmount: -20,
        merchant: 'SHOP INSIDE'
      })
    ])
  })

  it('loads shared card account statement once and assigns operations by card PAN', async () => {
    let statementRequests = 0
    const fromDate = new Date('2026-05-01T00:00:00.000+03:00')
    const toDate = new Date('2026-05-31T23:59:59.000+03:00')
    const accounts = [
      {
        id: 'account-card-1111',
        cardAccountNumber: 'shared-card-account-number',
        accountType: '1',
        bankCode: '288',
        cardHash: 'first-card-hash',
        cardLast4: '1111',
        instrumentCode: '933',
        rkcCode: '004'
      },
      {
        id: 'account-card-2222',
        cardAccountNumber: 'shared-card-account-number',
        accountType: '1',
        bankCode: '288',
        cardHash: 'second-card-hash',
        cardLast4: '2222',
        instrumentCode: '933',
        rkcCode: '004'
      }
    ]

    fetchMock.once({
      method: 'POST',
      matcher: (url, { body, headers }) => {
        const request = JSON.parse(body)
        const matched = url === baseUrl + 'products/getCardAccountFullStatement' &&
          headers.session_token === sessionToken &&
          headers._ac0 === sessionToken &&
          headers._ac1 === 'test-anti-fraud-id' &&
          headers.language === 'ru' &&
          request.cardHash === 'first-card-hash' &&
          request.internalAccountId === 'shared-card-account-number'
        if (matched) {
          statementRequests += 1
        }
        return matched
      },
      response: {
        status: 200,
        body: {
          errorInfo: {
            error: '0',
            errorText: 'Успешно'
          },
          operations: [
            {
              operationName: 'Оплата товаров и услуг',
              transactionAuthCode: '111',
              transactionDate: 1777986000000,
              operationDate: 1777899600000,
              transactionAmount: 10,
              transactionCurrency: '933',
              operationAmount: 10,
              operationCurrency: '933',
              operationPlace: 'SHOP 1111',
              operationSign: '-1',
              cardPAN: 'mock-pan-1111'
            },
            {
              operationName: 'Оплата товаров и услуг',
              transactionAuthCode: '222',
              transactionDate: 1777987000000,
              operationDate: 1777899700000,
              transactionAmount: 20,
              transactionCurrency: '933',
              operationAmount: 20,
              operationCurrency: '933',
              operationPlace: 'SHOP 2222',
              operationSign: '-1',
              cardPAN: 'mock-pan-2222'
            }
          ]
        }
      }
    })

    await expect(fetchOperations(sessionToken, accounts, fromDate, toDate)).resolves.toEqual([
      expect.objectContaining({
        id: '111',
        account_id: 'account-card-1111',
        transactionAmount: -10,
        merchant: 'SHOP 1111'
      }),
      expect.objectContaining({
        id: '222',
        account_id: 'account-card-2222',
        transactionAmount: -20,
        merchant: 'SHOP 2222'
      })
    ])
    expect(statementRequests).toBe(1)
  })
})
