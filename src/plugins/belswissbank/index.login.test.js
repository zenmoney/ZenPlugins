import fetchMock from 'fetch-mock'
import { installFetchMockDeveloperFriendlyFallback } from '../../testUtils'
import { makePluginDataApi } from '../../ZPAPI.pluginData'
import { scrape } from './index'
import { mockArchiveRequest, mockCardListRequest, mockLogin, mockLogout } from './mocks'

installFetchMockDeveloperFriendlyFallback(fetchMock)

test('throws credentials mismatch as InvalidPreferencesError', async () => {
  const deviceId = '11111111-1111-1111-1111-111111111111'
  const username = 'test(username)'
  const password = 'test(password)'

  global.ZenMoney = {
    isAccountSkipped: () => false,
    ...makePluginDataApi({
      deviceId
    }).methods
  }
  mockCardListRequest({ response: { status: 401 } })
  mockArchiveRequest({ fromDate: '20181201', toDate: '20181207', response: { status: 401 } })
  mockLogout()
  mockLogin({
    username,
    password,
    deviceId,
    response: {
      status: 403,
      body: {
        stackTrace: null,
        message: 'Неверные учетные данные',
        error: 'Неверные учетные данные',
        authorizationStatus: 'INCORECT_LOGIN_OR_PASSWORD',
        status: 403
      }
    }
  })

  const result = scrape({
    preferences: { username, password },
    fromDate: new Date('2018-12-01T12:00:00Z'),
    toDate: new Date('2018-12-07T12:00:00Z')
  })
  await expect(result).rejects.toBeInstanceOf(InvalidPreferencesError)
  await expect(result).rejects.toMatchObject({ message: 'Неверные учетные данные' })
})
