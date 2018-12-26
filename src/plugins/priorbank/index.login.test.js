import fetchMock from 'fetch-mock'
import { installFetchMockDeveloperFriendlyFallback } from '../../testUtils'
import { makePluginDataApi } from '../../ZPAPI.pluginData'
import { scrape } from './index'
import { mockGetSalt, mockLogin, mockMobileToken } from './mocks'

installFetchMockDeveloperFriendlyFallback(fetchMock)

test('throws credentials mismatch as InvalidPreferencesError', async () => {
  const login = 'test(login)'
  const password = 'test(password)'
  const accessToken = 'test(access_token)'
  const tokenType = 'bearer'
  const clientSecret = 'test(client_secret)'

  global.ZenMoney = {
    isAccountSkipped: () => false,
    ...makePluginDataApi({}).methods
  }

  mockMobileToken({
    response: {
      access_token: accessToken,
      token_type: tokenType,
      client_secret: clientSecret
    }
  })

  mockGetSalt({
    tokenType,
    accessToken,
    clientSecret,
    login,
    response: {
      success: true,
      errorMessage: '',
      internalErrorCode: 0,
      externalErrorCode: '',
      token: false,
      tokenFields: null,
      result: { salt: 'saltsaltsaltsaltsaltsaltsaltsalt' }
    }
  })

  mockLogin({
    tokenType,
    accessToken,
    clientSecret,
    login,
    hash: '6a123a0cbfd5439b87ce4e204a5b65e6728dac2a94f03b6963048db2d5764d70d4b4e1fdac85ed5538473c96070e8d20ff726c9237104427f9393fb8030d2957',
    response: {
      status: 200,
      body: {
        success: false,
        errorMessage: 'Неверный логин или пароль',
        internalErrorCode: 0,
        externalErrorCode: '',
        token: false,
        tokenFields: null,
        result: ''
      }
    }
  })

  const result = scrape({
    preferences: { login, password },
    fromDate: new Date('2018-12-01T12:00:00Z'),
    toDate: new Date('2018-12-07T12:00:00Z')
  })
  await expect(result).rejects.toBeInstanceOf(InvalidPreferencesError)
  await expect(result).rejects.toMatchObject({ message: 'Неверный логин или пароль' })
})
