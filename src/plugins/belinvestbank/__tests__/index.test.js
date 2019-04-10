import fetchMock from 'fetch-mock'
import _ from 'lodash'
import { scrape } from '..'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'

var querystring = require('querystring')

describe('scrape', () => {
  it('should hit the mocks and return results', async () => {
    mockZenMoney()
    mockApiLoginAndPass()
    mockApiCloseLastSession()
    // mockCheckPassword()
    // mockLoadUser()
    // mockLoadOperationStatements()

    const result = await scrape(
      {
        preferences: { login: '123456789', password: 'pass' },
        fromDate: new Date('2018-12-27T00:00:00.000+03:00'),
        toDate: new Date('2019-01-02T00:00:00.000+03:00')
      }
    )

    expect(result.accounts).toEqual([{
      id: '30848200',
      type: 'card',
      title: 'Безымянная*1111',
      instrument: 'BYN',
      balance: 99.9,
      syncID: ['1111']
    }])

    expect(result.transactions).toEqual([{
      hold: false,
      date: new Date('2018-12-28T00:00:00+03:00'),
      movements: [{
        id: null,
        account: { id: '1111111' },
        sum: -12.39,
        fee: 0,
        invoice: {
          sum: -5,
          instrument: 'EUR'
        }
      }],
      merchant: {
        fullTitle: 'PAYPAL',
        location: null,
        mcc: null
      },
      comment: null
    }, {
      hold: false,
      date: new Date('2018-12-29T01:07:39+03:00'),
      movements: [{
        id: null,
        account: { id: '1111111' },
        sum: -29.68,
        fee: 0,
        invoice: null
      }],
      merchant: {
        fullTitle: 'Магазин',
        location: null,
        mcc: null
      },
      comment: null
    }])
  })
})

function mockApiCloseLastSession () {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://login.belinvestbank.by/app_api' && _.isEqual(body, querystring.stringify({
      section: 'account',
      method: 'confirmationCloseSession'
    })),
    response: {
      status: 200,
      body: {
        status: 'OK',
        values: {
          avatarSrc: 'https://ibank.belinvestbank.by/avatars/user_3.jpg',
          clientIO: 'Василий Викторович',
          clientLastName: 'Пупкин',
          clientName: 'Василий',
          clientPhone: '3752911***11',
          clientThirdName: 'Викторович',
          denominationData: {
            startDate: '01.07.2016',
            dateEndBYR: '31.12.2016',
            currency: 'BYN',
            amtMask: 'moneyDec2',
            decimal: 2
          },
          amtMask: 'moneyDec2',
          currency: 'BYN',
          dateEndBYR: '31.12.2016',
          decimal: 2,
          startDate: '01.07.2016',
          greetingPartDay: 'Добрый день',
          isAppUser: false,
          isSendPush: true,
          isSnap: true,
          login: 'login',
          personPict: 'user_3',
          userImage: 'user_3',
          _appName: 'simple'
        }
      }
    }
  })
}

function mockApiLoginAndPass () {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://login.belinvestbank.by/app_api' && _.isEqual(body, querystring.stringify({
      section: 'account',
      method: 'signin',
      login: '123456789',
      password: 'pass',
      deviceId: 'device id',
      versionApp: '2.1.7',
      os: 'Android',
      device_token: 'device token',
      device_token_type: 'ANDROID'
    })),
    response: {
      status: 200,
      body: {
        isNeedConfirmSessionKey: '1',
        message: 'Внимание! Система "Интернет-банкинг" уже запущена, повторный запуск запрещен.',
        status: 'ER',
        textMessage: 'Внимание! Система "Мобильный банкинг" уже запущена, повторный запуск запрещен. Вы хотите аннулировать предыдущий запуск системы?'
      }
    }
  })
}

function mockZenMoney () {
  global.ZenMoney = {
    ...makePluginDataApi({
      deviceId: 'device id',
      token: 'device token'
    }).methods
  }
  ZenMoney.readLine = async () => 'test(readLine)'
}
