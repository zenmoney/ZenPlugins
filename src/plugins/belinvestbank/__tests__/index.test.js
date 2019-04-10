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
    mockApiSmsCode()
    mockApiAuthCallback()
    mockApiSaveDevice()
    mockApiFetchAccounts()
    mockApiFetchTransactions()

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
      date: new Date('2019-01-01T10:12:13+03:00'),
      movements: [{
        id: null,
        invoice: null,
        account: { id: '30848200' },
        sum: 10.13,
        fee: 0
      }],
      merchant: null,
      comment: null
    }])
  })
})

function mockApiFetchTransactions () {
  fetchMock.once({
    method: 'POST',
    headers: { Cookie: '' },
    matcher: (url, { body }) => url === 'https://ibank.belinvestbank.by/app_api' && _.isEqual(body, querystring.stringify({
      section: 'cards',
      method: 'history',
      cardId: 30848200,
      dateFrom: '27.12.2018',
      dateTo: '02.01.2019'
    })),
    response: {
      status: 200,
      body: {
        status: 'OK',
        values: {
          cardId: '30848200',
          cardNum: '**** **** **** 1111',
          cards: [
            {
              balance: '99.90',
              blocking: '',
              blockingCode: '',
              blockingText: '',
              cardClass: 'type-logo_belcaed-maestro',
              cardClassColor: '_type_blue',
              cardHolder: 'VASILIY PYPKIN',
              cardImage: '/core/assets/redesign3/images/cardsLogo/belcard_mini2.svg',
              cardName: '',
              cardsKey: 30848200,
              commonId: 'ownBankCards_30848200',
              corporative: 0,
              currency: 'BYN',
              expdate: 1711832400,
              finalName: 'Безымянная',
              fixedBalance: 99.9,
              id: '30848200',
              international: 0,
              internet: 1,
              isBelcard: 0,
              isCredit: 0,
              isCurrent: true,
              isDBO: 0,
              isGroupPackage: '0',
              isProlongable: 0,
              isReplaceable: 1,
              isSendPinAllowed: 1,
              isVirtual: '0',
              num: '**** 1111',
              packageName: '',
              pimpText: '',
              status3D: 0,
              statusLimits: 0,
              statusPimp: 0,
              subTitle: '',
              type: 'БЕЛКАРТ-Maestro',
              widgetContent: []
            }
          ],
          chooseHistoryPeriod: null,
          history: [
            {
              cardNum: '**** **** **** 1111',
              date: '2019-01-01 10:12:13',
              type: 'ПОПОЛНЕНИЕ',
              accountAmt: '10,13',
              status: 'ПРОВЕДЕНО'
            }
          ],
          coursesType: 'cards',
          currentCard: {
            balance: ' 99,90 BYN',
            cardImage: '/core/assets/redesign3/images/cardsLogo/belcard_mini2.svg',
            cardName: '',
            cardNum: '**** 1111',
            clearBalance: 99.9,
            currency: 'BYN',
            type: 'БЕЛКАРТ-Maestro'
          },
          dateFrom: '27.12.2018',
          dateTo: '02.01.2019',
          emailSubscribed: false,
          enableCorp: '1',
          enableSimple: '1',
          maxPeriodDays: 90,
          showMenuBlock: true,
          siteArea: 'physicist',
          summaryData: {
            availableSum: ' 0,00',
            currencyCode: 'BYN',
            debtSum: '0',
            freeSum: ' 0,00',
            lockedSum: ' 0,00',
            minimumBalance: '0,00',
            overdraftSum: '0'
          },
          timeInterval: null,
          _appName: 'simple'
        }
      }
    }
  })
}

function mockApiFetchAccounts () {
  fetchMock.once({
    method: 'POST',
    headers: { Cookie: '' },
    matcher: (url, { body }) => url === 'https://ibank.belinvestbank.by/app_api' && _.isEqual(body, querystring.stringify({
      'section': 'payments',
      'method': 'index'
    })),
    response: {
      status: 200,
      body: {
        status: 'OK',
        values: {
          cards: [
            {
              balance: '99.90',
              blocking: '',
              blockingCode: '',
              blockingText: '',
              cardClass: 'type-logo_belcaed-maestro',
              cardClassColor: '_type_blue',
              cardHolder: 'VASILIY PYPKIN',
              cardImage: '/core/assets/redesign3/images/cardsLogo/belcard_mini2.svg',
              cardName: '',
              cardsKey: 30848200,
              commonId: 'ownBankCards_30848200',
              corporative: 0,
              currency: 'BYN',
              expdate: 1711832400,
              finalName: 'Безымянная',
              fixedBalance: 99.9,
              id: '30848200',
              international: 0,
              internet: 1,
              isBelcard: 0,
              isCredit: 0,
              isCurrent: true,
              isDBO: 0,
              isGroupPackage: '0',
              isProlongable: 0,
              isReplaceable: 1,
              isSendPinAllowed: 1,
              isVirtual: '0',
              num: '**** 1111',
              packageName: '',
              pimpText: '',
              status3D: 0,
              statusLimits: 0,
              statusPimp: 0,
              subTitle: '',
              type: 'БЕЛКАРТ-Maestro',
              widgetContent: []
            }
          ],
          chooseHistoryPeriod: null,
          coursesType: 'cards',
          currencyCourses: [],
          currentCard: {
            balance: ' 99,90 BYN',
            cardImage: '/core/assets/redesign3/images/cardsLogo/belcard_mini2.svg',
            cardName: '',
            cardNum: '**** 1111',
            clearBalance: 99.9,
            currency: 'BYN',
            type: 'БЕЛКАРТ-Maestro'
          },
          currentCourses: [],
          enableCorp: '1',
          enableSimple: '1',
          eripArr: [],
          infMsg: {},
          paymentsTree: [],
          showMenuBlock: true,
          siteArea: 'physicist',
          type: 'PAYMENT',
          _appName: 'simple'
        }
      }
    }
  })
}

function mockApiSaveDevice () {
  fetchMock.once({
    method: 'POST',
    headers: { Cookie: '' },
    matcher: (url, { body }) => url === 'https://ibank.belinvestbank.by/app_api' && _.isEqual(body, querystring.stringify({
      section: 'mobile',
      method: 'setDeviceId',
      deviceId: 'device id',
      os: 'Android'
    })),
    response: {
      status: 200,
      body: {
        status: 'OK',
        values: {
          chooseHistoryPeriod: null,
          coursesType: 'cards',
          currentCard: {
            balance: '99,90 BYN',
            cardImage: '/core/assets/redesign3/images/cardsLogo/belcard_mini2.svg',
            cardName: '',
            cardNum: '**** 111',
            clearBalance: 99.9,
            currency: 'BYN',
            type: 'БЕЛКАРТ-Maestro',
            enableCorp: '1',
            enableSimple: '1',
            info: 'Упрощенный вход в систему включен',
            showMenuBlock: true,
            siteArea: 'physicist',
            _appName: 'simple'
          }
        }
      }
    }
  })
}

function mockApiAuthCallback () {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://ibank.belinvestbank.by/app_api' && _.isEqual(body, querystring.stringify({
      section: 'account',
      method: 'authCallback',
      auth_code: 'auth code'
    })),
    response: {
      status: 200,
      body: {
        status: 'OK',
        values: {
          chooseHistoryPeriod: null,
          coursesType: 'cards',
          enableCorp: '1',
          enableSimple: '1',
          showMenuBlock: true,
          siteArea: 'physicist',
          _appName: 'simple'
        }
      }
    }
  })
}

function mockApiSmsCode () {
  fetchMock.once({
    method: 'POST',
    headers: { Cookie: '' },
    matcher: (url, { body }) => url === 'https://login.belinvestbank.by/app_api' && _.isEqual(body, querystring.stringify({
      section: 'account',
      method: 'signin2',
      action: 1,
      key: '1234',
      device_token: 'device token',
      device_token_type: 'ANDROID'
    })),
    response: {
      status: 200,
      body: {
        status: 'OK',
        values: {
          authCode: 'auth code',
          _appName: 'simple'
        }
      }
    }
  })
}

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
  ZenMoney.readLine = async () => '1234'
}
