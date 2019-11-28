import fetchMock from 'fetch-mock'
import _ from 'lodash'
import { installFetchMockDeveloperFriendlyFallback } from '../../../testUtils'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'
import { scrape } from '../index'
import { formatApiDate } from '../api'
import * as utils from '../../../common/utils'

function expectLoginRequest ({ accessToken, response }) {
  fetchMock.once({
    method: 'POST',
    headers: {
      'DEVICE-ID': '11111111-1111-1111-1111-111111111111',
      Authorization: `Bearer ${accessToken || '22222222-2222-2222-2222-222222222222'}`
    },
    matcher: (url, { body }) => url === 'https://alfa-mobile.alfabank.ru/ALFAJMB/gate' && _.isEqual(JSON.parse(body), {
      'operationId': 'Authorization:Login',
      'parameters': {
        'appVersion': '10.8.1',
        'deviceId': '11111111-1111-1111-1111-111111111111',
        'deviceName': 'Zenmoney',
        'login': '',
        'loginType': 'token',
        'operationSystem': 'Android',
        'operationSystemVersion': '25',
        'password': ''
      }
    }),
    response
  })
}

function expectRegisterCustomerRequest ({ response }) {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/registerCustomer' &&
      _.isEqual(JSON.parse(body), {
        'credentials': {
          'card': {
            'expirationDate': '12/34',
            'number': '4444555566661111'
          },
          'phoneNumber': '71234567890',
          'queryRedirectParams': {
            'acr_values': 'card_account:sms',
            'client_id': 'mobile-app',
            'device_id': '11111111-1111-1111-1111-111111111111',
            'is_webview': 'true',
            'non_authorized_user': 'true',
            'scope': 'openid mobile-bank'
          },
          'type': 'CARD'
        }
      }),
    response
  })
}

function expectFetchAccessTokenRequest ({ response }) {
  fetchMock.once({
    method: 'GET',
    headers: {
      'DEVICE-ID': '11111111-1111-1111-1111-111111111111'
    },
    matcher: (url) => url === 'https://alfa-mobile.alfabank.ru/ALFAJMB/openid/token?refresh_token=33333333-3333-3333-3333-333333333333',
    response
  })
}

function expectFetchCommonAccounts ({ response }) {
  fetchMock.once({
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json;charset=UTF-8',
      'jmb-protocol-version': '1.0',
      'jmb-protocol-service': 'Budget',
      'APP-VERSION': '10.8.1',
      'OS-VERSION': '7.1.1',
      OS: 'android',
      'DEVICE-ID': '11111111-1111-1111-1111-111111111111',
      'DEVICE-MODEL': 'Zenmoney',
      applicationId: 'ru.alfabank.mobile.android',
      appVersion: '10.8.1',
      osVersion: '7.1.1',
      'User-Agent': 'okhttp/3.8.0'
    },
    matcher: (url, { body }) => url === 'https://alfa-mobile.alfabank.ru/ALFAJMB/gate' && _.isEqual(JSON.parse(body), {
      operationId: 'Budget:GetCommonAccounts',
      parameters: { operation: 'mainPage' }
    }),
    response
  })
}

function expectFetchCommonMovements ({ sessionId, startDate, endDate, offset, count, response }) {
  fetchMock.once({
    method: 'POST',
    headers: {
      'jmb-protocol-version': '1.0',
      'jmb-protocol-service': 'Budget',
      'APP-VERSION': '10.8.1',
      'OS-VERSION': '7.1.1',
      OS: 'android',
      'DEVICE-ID': '11111111-1111-1111-1111-111111111111',
      'DEVICE-MODEL': 'Zenmoney',
      applicationId: 'ru.alfabank.mobile.android',
      appVersion: '10.8.1',
      osVersion: '7.1.1',
      session_id: sessionId,
      'User-Agent': 'okhttp/3.8.0'
    },
    matcher: (url, { body }) => url === 'https://alfa-mobile.alfabank.ru/ALFAJMB/gate' && _.isEqual(JSON.parse(body), {
      operationId: 'Budget:GetCommonMovements',
      operation: 'commonStatement',
      filters: [],
      tagsCloud: [],
      startDate,
      endDate,
      offset,
      count,
      forceCache: false
    }),
    response
  })
}

describe('login', () => {
  installFetchMockDeveloperFriendlyFallback(fetchMock)

  it('re-registers when receives SESSION_EXPIRED from login', async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 419,
        body: {
          id: 'SESSION_EXPIRED',
          message: { en: 'Session has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    const exit = new Error('got expected call')
    expectRegisterCustomerRequest({ response: { throws: exit } })

    await expect(scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })).rejects.toBe(exit)
  })

  describe('handles TOKEN_NOT_FOUND from login', () => {
    it('re-logins if refresh_token is still valid', async () => {
      const sessionId = utils.generateUUID()
      utils.generateUUID = jest.fn(() => sessionId)

      global.ZenMoney = makePluginDataApi({
        deviceId: '11111111-1111-1111-1111-111111111111',
        registered: true,
        accessToken: '22222222-2222-2222-2222-222222222222',
        refreshToken: '33333333-3333-3333-3333-333333333333'
      }).methods

      expectLoginRequest({
        response: {
          status: 403,
          body: {
            id: 'TOKEN_NOT_FOUND',
            message: { en: 'Token not found' },
            type_id: 'AUTHORIZATION',
            class: 'class ru.ratauth.exception.AuthorizationException'
          }
        }
      })

      expectFetchAccessTokenRequest({
        response: {
          status: 200,
          body: {
            operationId: 'OpenID:TokenResult',
            access_token: '44444444-4444-4444-4444-444444444444',
            expires_in: Date.now() + (2 * 86400000),
            refresh_token: '55555555-5555-5555-5555-555555555555'
          }
        }
      })

      expectLoginRequest({
        accessToken: '44444444-4444-4444-4444-444444444444',
        response: {
          status: 200,
          body: {
            header: { status: 'STATUS_OK' },
            operationId: 'Authorization:LoginResult'
          }
        }
      })

      expectFetchCommonAccounts({
        response: {
          status: 200,
          body: {
            operationId: 'Budget:GetCommonAccountsResult',
            accounts: []
          }
        }
      })

      const fromDate = new Date()
      const toDate = null

      expectFetchCommonMovements({
        sessionId,
        startDate: formatApiDate(fromDate),
        endDate: formatApiDate(toDate),
        offset: 0,
        count: 1024,
        response: {
          status: 200,
          body: {
            operationId: 'Budget:GetCommonMovementsResult',
            accountsAmount: { credit: '10 000.00', debet: '11 656.60', currency: 'RUR' },
            movements: []
          }
        }
      })

      await expect(scrape({
        preferences: {
          cardNumber: '4444555566661111',
          cardExpirationDate: '1234',
          phoneNumber: '71234567890'
        },
        fromDate,
        toDate
      })).resolves.toEqual({
        accounts: [],
        transactions: []
      })
    })

    it('re-registers when receives REFRESH_TOKEN_EXPIRED from fetchAccessToken', async () => {
      const sessionId = utils.generateUUID()
      utils.generateUUID = jest.fn(() => sessionId)

      global._fetchMock = fetchMock
      global.ZenMoney = makePluginDataApi({
        deviceId: '11111111-1111-1111-1111-111111111111',
        registered: true,
        accessToken: '22222222-2222-2222-2222-222222222222',
        refreshToken: '33333333-3333-3333-3333-333333333333'
      }).methods

      expectLoginRequest({
        response: {
          status: 403,
          body: {
            id: 'TOKEN_NOT_FOUND',
            message: { en: 'Token not found' },
            type_id: 'AUTHORIZATION',
            class: 'class ru.ratauth.exception.AuthorizationException'
          }
        }
      })

      expectFetchAccessTokenRequest({
        response: {
          status: 419,
          body: {
            id: 'REFRESH_TOKEN_EXPIRED',
            message: { en: 'Refresh token has expired' },
            type_id: 'EXPIRED',
            class: 'class ru.ratauth.exception.ExpiredException'
          }
        }
      })

      const exit = new Error('got expected call')
      expectRegisterCustomerRequest({ response: { throws: exit } })

      const fromDate = new Date()
      const toDate = null

      await expect(scrape({
        preferences: {
          cardNumber: '4444555566661111',
          cardExpirationDate: '1234',
          phoneNumber: '71234567890'
        },
        fromDate,
        toDate
      })).rejects.toBe(exit)
    })
  })

  it('re-registers when receives SESSION_BLOCKED from fetchAccessToken', async () => {
    global._fetchMock = fetchMock
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 419,
        body: {
          id: 'TOKEN_EXPIRED',
          message: { en: 'Token has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    expectFetchAccessTokenRequest({
      response: {
        status: 403,
        statusText: 'Forbidden',
        body: {
          id: 'SESSION_BLOCKED',
          message: { en: 'Session is blocked' },
          base_id: '16080bf6-dbe4-428e-b648-06739b59e920',
          type_id: 'AUTHORIZATION',
          class: 'class ru.ratauth.exception.AuthorizationException'
        }
      }
    })

    const exit = new Error('got expected call')
    expectRegisterCustomerRequest({ response: { throws: exit } })

    const fromDate = new Date()
    const toDate = null

    await expect(scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate,
      toDate
    })).rejects.toBe(exit)
  })

  it('re-registers when receives SESSION_NOT_FOUND from fetchAccessToken', async () => {
    global._fetchMock = fetchMock
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 403,
        body: {
          id: 'TOKEN_NOT_FOUND',
          message: { en: 'Token not found' },
          type_id: 'AUTHORIZATION',
          class: 'class ru.ratauth.exception.AuthorizationException'
        }
      }
    })

    expectFetchAccessTokenRequest({
      response: {
        status: 403,
        statusText: 'Forbidden',
        body: {
          id: 'SESSION_NOT_FOUND',
          message: { en: 'Session not found' },
          base_id: '16080bf6-dbe4-428e-b648-06739b59e920',
          type_id: 'AUTHORIZATION',
          class: 'class ru.ratauth.exception.AuthorizationException'
        }
      }
    })

    const exit = new Error('got expected call')
    expectRegisterCustomerRequest({ response: { throws: exit } })

    const fromDate = new Date()
    const toDate = null

    await expect(scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate,
      toDate
    })).rejects.toBe(exit)
  })

  it('re-registers when receives REFRESH_TOKEN_EXPIRED from fetchAccessToken', async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 419,
        body: {
          id: 'TOKEN_EXPIRED',
          message: { en: 'Token has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    expectFetchAccessTokenRequest({
      response: {
        status: 419,
        body: {
          id: 'REFRESH_TOKEN_EXPIRED',
          message: { en: 'Refresh token has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    const exit = new Error('got expected call')
    expectRegisterCustomerRequest({ response: { throws: exit } })

    await expect(scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })).rejects.toBe(exit)
  })

  it('re-registers when receives SESSION_EXPIRED from fetchAccessToken', async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 419,
        body: {
          id: 'TOKEN_EXPIRED',
          message: { en: 'Token has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    expectFetchAccessTokenRequest({
      response: {
        status: 419,
        body: {
          id: 'SESSION_EXPIRED',
          message: { en: 'Session has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    const exit = new Error('got expected call')
    expectRegisterCustomerRequest({ response: { throws: exit } })

    await expect(scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })).rejects.toBe(exit)
  })

  it('throws "Превышено максимальное количество входов" as TemporaryError', async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 200,
        url: 'https://alfa-mobile.alfabank.ru/ALFAJMB/gate',
        body:
          {
            header: { faultMessage: 'Превышено максимальное количество входов' },
            operationId: 'Exception'
          }
      }
    })

    const result = scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })
    await expect(result).rejects.toBeInstanceOf(TemporaryError)
    await expect(result).rejects.toMatchObject({ message: 'Превышено максимальное количество входов' })
  })

  it('throws WS_CALL_ERROR as TemporaryError', async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 200,
        body: {
          header: {
            faultCode: 'WS_CALL_ERROR',
            faultMessage: 'Не удается установить соединение с банком. Повторите попытку позже.'
          },
          operationId: 'Exception'
        }
      }
    })

    const result = scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })
    await expect(result).rejects.toBeInstanceOf(TemporaryError)
    await expect(result).rejects.toMatchObject({ message: 'Не удается установить соединение с банком. Повторите попытку позже.' })
  })

  it('throws GENERAL_EXCEPTION as TemporaryError', async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    const description = 'К сожалению, доступ к мобильному банку невозможен. Обратитесь в ближайшее отделение Альфа-Банка или в Телефонный центр "Альфа-Консультант" (+ 7 495 78-888-78 для Москвы и Московской области, 8 800 2000-000 для регионов)'
    expectLoginRequest({
      response: {
        status: 200,
        body: {
          header: {
            status: 'GENERAL_EXCEPTION',
            description
          },
          operationId: 'Authorization:LoginResult'
        }
      }
    })

    const result = scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })
    await expect(result).rejects.toBeInstanceOf(TemporaryError)
    await expect(result).rejects.toMatchObject({ message: description })
  })
})

function expectOidReferenceRequest ({ response }) {
  fetchMock.once({
    method: 'POST',
    matcher:
      (url, { body }) => url === 'https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/reference' &&
        _.isEqual(JSON.parse(body), {
          'queryRedirectParams': {
            'acr_values': 'card_account:sms',
            'client_id': 'mobile-app',
            'device_id': '11111111-1111-1111-1111-111111111111',
            'is_webview': 'true',
            'non_authorized_user': 'true',
            'scope': 'openid mobile-bank'
          },
          'previousMultiFactorResponseParams': {
            'is_webview': '<string[4]>',
            'redirect_uri': '<string[64]>',
            'mfa_token': '<string[36]>',
            'acr_values': '<string[8]>'
          },
          'type': 'CARD'
        }),
    response
  })
}

function expectFinishRegistrationRequest ({ response }) {
  fetchMock.once({
    method: 'POST',
    matcher:
      (url, { body }) => url === 'https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/finishCustomerRegistration' &&
        _.isEqual(JSON.parse(body), {
          'credentials': {
            'code': 'test(readLine)',
            'queryRedirectParams': {
              'acr_values': 'card_account:sms',
              'client_id': 'mobile-app',
              'device_id': '11111111-1111-1111-1111-111111111111',
              'is_webview': 'true',
              'non_authorized_user': 'true',
              'scope': 'openid mobile-bank'
            },
            'previousMultiFactorResponseParams': {
              'is_webview': '<string[4]>',
              'redirect_uri': '<string[64]>',
              'mfa_token': '<string[36]>',
              'acr_values': '<string[8]>',
              'reference': '<string[16]>'
            },
            'type': 'CARD'
          }
        }),
    response: response
  })
}

describe('finishRegistration', () => {
  installFetchMockDeveloperFriendlyFallback(fetchMock)

  const messages = [
    `Пароль устарел.
Пожалуйста, запросите новый`,
    'Пароль введён неверно'
  ]
  messages.forEach((message) => it(`throws "${message.slice(0, 16)}..." error as TemporaryError (that's shown on UI and has no Send log button)`, async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 419,
        body: {
          id: 'TOKEN_EXPIRED',
          message: { en: 'Token has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    expectFetchAccessTokenRequest({
      response: {
        status: 419,
        body: {
          id: 'SESSION_EXPIRED',
          message: { en: 'Session has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    expectRegisterCustomerRequest({
      response: {
        redirectUrl: '<string[245]>',
        params:
          {
            is_webview: '<string[4]>',
            redirect_uri: '<string[64]>',
            mfa_token: '<string[36]>',
            acr_values: '<string[8]>'
          }
      }
    })
    expectOidReferenceRequest({ response: { reference: { reference: '<string[16]>' } } })

    ZenMoney.readLine = async () => 'test(readLine)'

    expectFinishRegistrationRequest({
      response: {
        status: 500,
        url: '<string[105]>',
        body:
          {
            statusCode: '<number>',
            error: '<string[21]>',
            message: '<string[33]>',
            errors:
              [
                {
                  id: '<string[10]>',
                  status: '<number>',
                  message: message
                }
              ]
          }
      }
    })

    const result = scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })
    await expect(result).rejects.toBeInstanceOf(TemporaryError)
    await expect(result).rejects.toMatchObject({ message: message })
  }))
})

describe('getOidReference', () => {
  installFetchMockDeveloperFriendlyFallback(fetchMock)

  it('throws "Произошла ошибка." as TemporaryError', async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: false
    }).methods

    expectRegisterCustomerRequest({
      response: {
        redirectUrl: '<string[245]>',
        params:
          {
            is_webview: '<string[4]>',
            redirect_uri: '<string[64]>',
            mfa_token: '<string[36]>',
            acr_values: '<string[8]>'
          }
      }
    })
    expectOidReferenceRequest({
      response: {
        status: 403,
        url: 'https://sense.alfabank.ru/passport/cerberus-mini-green/dashboard-green/api/oid/reference',
        body:
          {
            statusCode: '<number>',
            error: '<string[9]>',
            message: '<string[20]>',
            errors:
              [
                {
                  id: '<string[10]>',
                  status: '<number>',
                  message: 'Произошла ошибка.\nПожалуйста, запросите пароль повторно'
                }
              ]
          }
      }
    })

    const result = scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })
    await expect(result).rejects.toBeInstanceOf(TemporaryError)
    await expect(result).rejects.toMatchObject({ message: 'Произошла ошибка.\nПожалуйста, запросите пароль повторно' })
  })

  it(`throws user-relevant error messages as TemporaryError (that's shown on UI and has no Send log button)`, async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 419,
        body: {
          id: 'TOKEN_EXPIRED',
          message: { en: 'Token has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    expectFetchAccessTokenRequest({
      response: {
        status: 419,
        body: {
          id: 'SESSION_EXPIRED',
          message: { en: 'Session has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    expectRegisterCustomerRequest({
      response: {
        redirectUrl: '<string[245]>',
        params:
          {
            is_webview: '<string[4]>',
            redirect_uri: '<string[64]>',
            mfa_token: '<string[36]>',
            acr_values: '<string[8]>'
          }
      }
    })
    const message = `В целях вашей безопасности, вход в мобильное приложение был заблокирован. Для восстановления доступа к приложению, пожалуйста, свяжитесь с нами:

— Обратитесь с паспортом в любое отделение Альфа-Банка;

— или позвоните +7 (495) 788-88-78 (Москва, МО, заграница), 8 800 200-00-00 (регионы)`
    expectOidReferenceRequest({
      response: {
        status: 500,
        body: {
          statusCode: '<number>',
          error: '<string[21]>',
          message: '<string[33]>',
          errors: [
            {
              id: '<string[10]>',
              status: '<number>',
              message: message
            }
          ]
        }
      }
    })

    const result = scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })
    await expect(result).rejects.toBeInstanceOf(TemporaryError)
    await expect(result).rejects.toMatchObject({ message })
  })
})

describe('registerCustomer', () => {
  installFetchMockDeveloperFriendlyFallback(fetchMock)

  it(`throws user-relevant error messages as TemporaryError (that's shown on UI and has no Send log button)`, async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLoginRequest({
      response: {
        status: 419,
        body: {
          id: 'TOKEN_EXPIRED',
          message: { en: 'Token has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    expectFetchAccessTokenRequest({
      response: {
        status: 419,
        body: {
          id: 'SESSION_EXPIRED',
          message: { en: 'Session has expired' },
          type_id: 'EXPIRED',
          class: 'class ru.ratauth.exception.ExpiredException'
        }
      }
    })

    const message = 'Ваша карта закрыта или заблокирована. Для входа используйте другую карту.'
    expectRegisterCustomerRequest({
      response: {
        status: 403,
        body:
          {
            statusCode: '<number>',
            error: '<string[9]>',
            message: '<string[20]>',
            errors:
              [
                {
                  id: '<string[44]>',
                  status: '<number>',
                  message: message
                }
              ]
          }
      }
    })

    const result = scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })
    await expect(result).rejects.toBeInstanceOf(TemporaryError)
    await expect(result).rejects.toMatchObject({ message: message })
  })

  it(`throws preferences error messages as InvalidPreferencesError`, async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: false
    }).methods
    expectRegisterCustomerRequest({
      response: {
        status: 500,
        body: {
          statusCode: '<number>',
          error: '<string[21]>',
          message: '<string[33]>',
          errors: [
            {
              id: '<string[78]>',
              status: '<number>',
              message: `Некорректные данные.\n Пожалуйста, попробуйте ещё раз.`
            }
          ]
        }
      }
    })

    const result = scrape({
      preferences: {
        cardNumber: '4444555566661111',
        cardExpirationDate: '1234',
        phoneNumber: '71234567890'
      },
      fromDate: new Date(),
      toDate: null
    })
    await expect(result).rejects.toBeInstanceOf(InvalidPreferencesError)
    await expect(result).rejects.toMatchObject({ message: `Неверный номер карты, срок ее действия или номер телефона` })
  })
})
