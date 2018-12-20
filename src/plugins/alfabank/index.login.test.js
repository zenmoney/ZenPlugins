import fetchMock from 'fetch-mock'
import _ from 'lodash'
import { installFetchMockDeveloperFriendlyFallback } from '../../testUtils'
import { makePluginDataApi } from '../../ZPAPI.pluginData'
import { scrape } from './index'

describe('login flow', () => {
  installFetchMockDeveloperFriendlyFallback(fetchMock)

  function expectLogin ({ response }) {
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

  function expectRegisterCustomer ({ response }) {
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

  it('calls registration if gets SESSION_EXPIRED from login', async () => {
    global.ZenMoney = makePluginDataApi({
      deviceId: '11111111-1111-1111-1111-111111111111',
      registered: true,
      accessToken: '22222222-2222-2222-2222-222222222222',
      refreshToken: '33333333-3333-3333-3333-333333333333'
    }).methods

    expectLogin({
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
    expectRegisterCustomer({ response: { throws: exit } })

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
