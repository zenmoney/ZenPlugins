import fetchMock from 'fetch-mock'
import _ from 'lodash'
import { installFetchMockDeveloperFriendlyFallback } from '../../testUtils'
import { makePluginDataApi } from '../../ZPAPI.pluginData'
import { scrape } from './index'

function expectLoginRequest ({ response }) {
  fetchMock.once({
    method: 'POST',
    headers: {
      'jmb-protocol-version': '1.0',
      'jmb-protocol-service': 'Authorization',
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
          base_id: '16080bf6-dbe4-428e-b648-06739b59e920',
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
})
