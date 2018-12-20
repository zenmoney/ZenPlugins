import fetchMock from 'fetch-mock'
import _ from 'lodash'
import { installFetchMockDeveloperFriendlyFallback } from '../../testUtils'
import { makePluginDataApi } from '../../ZPAPI.pluginData'
import { scrape } from './index'

function expectLoginRequest ({ response }) {
  fetchMock.once({
    method: 'POST',
    headers: {
      'DEVICE-ID': '11111111-1111-1111-1111-111111111111',
      Authorization: 'Bearer 22222222-2222-2222-2222-222222222222'
    },
    matcher: (url, { body }) => url === 'https://alfa-mobile.alfabank.ru/ALFAJMB/gate' && _.isEqual(JSON.parse(body), {
      'operationId': 'Authorization:Login',
      'parameters': {
        'appVersion': '10.8.1',
        'deviceId': '11111111-1111-1111-1111-111111111111',
        'deviceName': 'Sony D6503',
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
})
