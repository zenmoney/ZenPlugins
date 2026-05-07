import fetchMock from 'fetch-mock'
import { scrape } from '..'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'

describe('scrape', () => {
  afterEach(() => {
    fetchMock.restore()
  })

  it('should hit the mocks and return results', async () => {
    mockZenMoney()
    mockPreLogin()
    mockSignin()
    mockAuthCallback()
    mockFetchAccounts()
    mockFetchTransactions()

    const result = await scrape(
      {
        preferences: { login: '123456789', password: 'pass' },
        fromDate: new Date(2025, 11, 27),
        toDate: new Date(2026, 0, 2)
      }
    )

    expect(result.accounts).toEqual([
      {
        id: '30848200',
        type: 'card',
        title: 'Безымянная*1111',
        instrument: 'BYN',
        balance: 1213.84,
        creditLimit: 0,
        syncID: ['1111']
      }
    ])

    expect(result.transactions).toEqual([
      {
        hold: false,
        date: new Date('2026-01-01T10:12:13+03:00'),
        movements: [
          {
            id: null,
            invoice: null,
            account: { id: '30848200' },
            sum: 10.13,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ])
  })
})

function mockPreLogin () {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://ibank.belinvestbank.by/app_api' &&
      body.includes('section=info') && body.includes('method=isApprovedVersionApp'),
    response: {
      status: 200,
      headers: { 'set-cookie': 'PHPSESSID=ibanksession;' },
      body: {
        status: 'OK',
        values: { isApprovedVersionApp: true }
      }
    }
  })
}

function mockSignin () {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://login.belinvestbank.by/app_api' &&
      body.includes('section=account') && body.includes('method=signin'),
    response: {
      status: 200,
      headers: { 'set-cookie': 'PHPSESSID=loginsession; auth_token=testtoken; session_type=mobile;' },
      body: {
        status: 'OK',
        values: {
          authCode: 'testauthcode123',
          loginCompleted: true
        }
      }
    }
  })
}

function mockAuthCallback () {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://ibank.belinvestbank.by/app_api' &&
      body.includes('section=account') && body.includes('method=authCallback') && body.includes('auth_code=testauthcode123'),
    response: {
      status: 200,
      headers: { 'set-cookie': 'PHPSESSID=ibanksession;' },
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

function mockFetchAccounts () {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://ibank.belinvestbank.by/app_api' &&
      body.includes('section=payments') && body.includes('method=index'),
    response: {
      status: 200,
      body: {
        status: 'OK',
        values: {
          cards: [
            {
              balance: '1 213.84',
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
              availableAmt: '1 213.84',
              overdraftAmt: '0',
              freeAmt: '1 213.84',
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

function mockFetchTransactions () {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://ibank.belinvestbank.by/app_api' &&
      body.includes('section=cards') && body.includes('method=history'),
    response: {
      status: 200,
      body: {
        status: 'OK',
        values: {
          cardId: '30848200',
          cardNum: '**** **** **** 1111',
          cards: [
            {
              balance: '1 213.84',
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
              availableAmt: '1 213.84',
              overdraftAmt: '0',
              freeAmt: '1 213.84',
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
              date: '2026-01-01 10:12:13',
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
          dateFrom: '27.12.2025',
          dateTo: '02.01.2026',
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

function mockZenMoney () {
  global.ZenMoney = {
    ...makePluginDataApi({}).methods,
    getPreferences: () => ({ login: '123456789', password: 'pass' })
  }
  ZenMoney.readLine = async () => '1234'
}
