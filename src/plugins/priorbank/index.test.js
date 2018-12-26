import fetchMock from 'fetch-mock'
import _ from 'lodash'
import { installFetchMockDeveloperFriendlyFallback } from '../../testUtils'
import { makePluginDataApi } from '../../ZPAPI.pluginData'
import { scrape } from './index'
import { mockGetSalt, mockLogin, mockMobileToken } from './mocks'

const priorSuccessResponse = (result) => ({
  'success': true,
  'errorMessage': '',
  'errorMessageOriginal': '',
  'internalErrorCode': 0,
  'externalErrorCode': '',
  'token': false,
  'tokenFields': null,
  'result': result
})

describe('scraper happy path', () => {
  installFetchMockDeveloperFriendlyFallback(fetchMock)

  it('should work', () => {
    const login = 'login'
    const password = 'password'
    const tokenType = 'bearer'
    const clientSecret = 'client_secret'
    const accessToken = 'access_token'

    global.ZenMoney = {
      isAccountSkipped: () => false,
      ...makePluginDataApi({}).methods
    }

    mockGetSalt({ tokenType, accessToken, clientSecret, login, response: priorSuccessResponse({ 'salt': 'salt' }) })

    mockLogin({
      tokenType,
      accessToken,
      clientSecret,
      login,
      hash: '0a610f0bbf7a92accc7e962c53ef3ed7d7d2cabb16139ae169555a6685056b405fa4a3edb041f27e6d8c29bea70eb9bd89bad9fcfcdf05e23b1b8b99ad1256a5',
      response: priorSuccessResponse({ 'access_token': 'logged_in_access_token', 'userSession': 'userSession' })
    })

    const postAuthExpectedHeaders = {
      Authorization: 'bearer logged_in_access_token',
      client_id: clientSecret,
      'User-Agent': 'PriorMobile3/3.17.03.22 (Android 24; versionCode 37)'
    }

    fetchMock.once({
      matcher: (url, { body }) => url.endsWith('/Cards') && _.isEqual(JSON.parse(body), { 'usersession': 'userSession' }),
      method: 'POST',
      headers: postAuthExpectedHeaders,
      response: priorSuccessResponse([
        {
          'clientObject': {
            'id': 'BYN_ACCOUNT_ID',
            'type': 6,
            'currIso': 'BYN',
            'cardContractNumber': 1,
            'cardMaskedNumber': '************2345',
            'defaultSynonym': 'BYNdefaultSynonym',
            'customSynonym': null
          },
          'balance': {
            'available': 499.99
          }
        },
        {
          'clientObject': {
            'id': 'USD_ACCOUNT_ID',
            'type': 6,
            'currIso': 'USD',
            'cardContractNumber': 2,
            'cardMaskedNumber': '************1234',
            'defaultSynonym': 'USDdefaultSynonym',
            'customSynonym': 'USDcustomSynonym'
          },
          'balance': {
            'available': 100.50
          }
        }
      ])
    })

    fetchMock.once({
      matcher: (url, { body }) => url.endsWith('/Cards/CardDesc') && _.isEqual(JSON.parse(body), {
        'usersession': 'userSession',
        'ids': [],
        'dateFromSpecified': false,
        'dateToSpecified': false
      }),
      method: 'POST',
      headers: {
        Authorization: 'bearer logged_in_access_token',
        client_id: clientSecret,
        'User-Agent': 'PriorMobile3/3.17.03.22 (Android 24; versionCode 37)'
      },
      response: priorSuccessResponse([
        {
          'id': 'BYN_ACCOUNT_ID',
          'contract': {
            'account': {
              'transCardList': [
                {
                  'transCardNum': 1,
                  'transactionList': [
                    {
                      'postingDate': '2017-01-03T00:00:00+03:00',
                      'transDate': '2017-01-03T00:00:00+03:00',
                      'transCurrIso': 'BYN',
                      'amount': 10.0,
                      'feeAmount': 0.0,
                      'accountAmount': 10.0,
                      'transDetails': 'Поступление на контракт клиента #ID  '
                    },
                    {
                      'postingDate': '2017-01-04T00:00:00+03:00',
                      'transDate': '2017-01-03T00:00:00+03:00',
                      'transCurrIso': 'BYN',
                      'amount': -4.0,
                      'feeAmount': 0.0,
                      'accountAmount': -4.0,
                      'transDetails': 'Payment From Client Contract  '
                    }
                  ]
                }
              ]
            },
            'abortedContractList': [
              {
                'abortedCard': 1,
                'abortedTransactionList': [
                  {
                    'amount': 6,
                    'transAmount': 6,
                    'transCurrIso': 'BYN',
                    'transDetails': 'Retail BLR',
                    'transDate': '2017-01-09T00:00:00+03:00'
                  }
                ]
              }
            ]
          }
        },
        {
          'id': 'USD_ACCOUNT_ID',
          'contract': {
            'account': {
              'transCardList': [
                {
                  'transCardNum': 2,
                  'transactionList': [
                    {
                      'postingDate': '2017-01-02T00:00:00+03:00',
                      'transDate': '2017-01-01T00:00:00+03:00',
                      'transCurrIso': 'USD',
                      'amount': 1000,
                      'feeAmount': 0.0,
                      'accountAmount': 1000,
                      'transDetails': 'Поступление на контракт клиента #ID  '
                    },
                    {
                      'postingDate': '2017-01-02T00:00:00+03:00',
                      'transDate': '2017-01-01T00:00:00+03:00',
                      'transCurrIso': 'BYN',
                      'amount': 4,
                      'feeAmount': 0.0,
                      'accountAmount': 2,
                      'transDetails': 'Retail BLR'
                    }
                  ]
                },
                {
                  'transactionList': [
                    {
                      'postingDate': '2017-01-10T00:00:00+03:00',
                      'transDate': '2017-01-10T00:00:00+03:00',
                      'transCurrIso': 'BYN',
                      'amount': -20,
                      'feeAmount': 0.0,
                      'accountAmount': -10.00,
                      'transDetails': 'Retail BLR'
                    },
                    {
                      'postingDate': '2017-01-09T00:00:00+03:00',
                      'transDate': '2017-01-08T00:00:00+03:00',
                      'transCurrIso': 'USD',
                      'amount': -200,
                      'feeAmount': 0.0,
                      'accountAmount': -200,
                      'transDetails': 'Cash BLR'
                    },
                    {
                      'postingDate': '2017-01-09T00:00:00+03:00',
                      'transDate': '2017-01-08T00:00:00+03:00',
                      'transCurrIso': 'BYN',
                      'amount': -100,
                      'feeAmount': 0.0,
                      'accountAmount': -50.67,
                      'transDetails': 'ATM BLR'
                    },
                    {
                      'postingDate': '2017-01-07T00:00:00+03:00',
                      'transDate': '2017-01-06T00:00:00+03:00',
                      'transCurrIso': 'USD',
                      'amount': -2.79,
                      'feeAmount': 0.0,
                      'accountAmount': -2.79,
                      'transDetails': 'Retail NLD'
                    }
                  ]
                }
              ]
            },
            'abortedContractList': [
              {
                'abortedCard': 2,
                'abortedTransactionList': [
                  {
                    'amount': 100,
                    'transAmount': 202.34,
                    'transCurrIso': 'BYN',
                    'transDetails': 'Retail BLR',
                    'transDate': '2017-01-10T00:00:00+03:00'
                  }
                ]
              }
            ]
          }
        }
      ])
    })

    mockMobileToken({
      response: {
        access_token: accessToken,
        token_type: tokenType,
        client_secret: clientSecret
      }
    })

    return expect(scrape({
      preferences: { login, password },
      fromDate: null,
      toDate: null
    }))
      .resolves
      .toMatchSnapshot('happy path scrape result')
  })
})
