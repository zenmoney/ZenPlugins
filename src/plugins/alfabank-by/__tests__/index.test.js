import fetchMock from 'fetch-mock'
import { scrape } from '..'
import { makePluginDataApi } from '../../../ZPAPI.pluginData'

describe('scrape', () => {
  it('should hit the mocks and return results', async () => {
    mockZenmoney()
    mockCheckDeviceStatus()
    mockAuthWithPassportID()
    mockAuthConfirm()
    mockFetchAccounts()
    mockFetchAccountInfo()
    mockFetchTransactions()

    const result = await scrape(
      {
        preferences: { },
        fromDate: new Date('2019-01-24T00:00:00.000+03:00'),
        toDate: new Date('2019-01-28T00:00:00.000+03:00')
      }
    )

    expect(result.accounts).toEqual([{
      id: '6505111',
      instrument: 'BYN',
      type: 'card',
      title: 'Карта №1',
      balance: 486.18,
      syncID: ['3014111MFE0011110', 'BY31 ALFA 3014 111M RT00 1111 0000'],
      productType: 'ACCOUNT'
    }])

    expect(result.transactions).toEqual([{
      date: new Date('Tue Jan 25 2019 12:27:55 GMT+0300 (Moscow Standard Time)'),
      movements: [
        {
          id: null,
          account: { id: '6505111' },
          invoice: null,
          sum: -7.99,
          fee: 0
        }
      ],
      merchant: {
        city: 'Amsterdam',
        country: 'NL',
        location: null,
        mcc: null,
        title: 'UBER'
      },
      comment: 'Покупка товара / получение услуг',
      hold: false
    }])
  })
})

function mockFetchTransactions () {
  fetchMock.once('https://insync2.alfa-bank.by/mBank256/v5/History', {
    status: 200,
    body: JSON.stringify({
      accounts: [{ id: '3014111MFE0011110', name: 'Карта №1 - ...ALFA3014111MFE001... - 486,18 BYN' }],
      filterAccount: '3014111MFE0011110',
      items: [
        {
          availableSplit: true,
          cardMask: '5.1111',
          date: '20190125122755',
          description: 'Amsterdam Покупка товара / получение услуг UBER',
          iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
          id: '11113111050111',
          info: {
            amount: {
              amount: -7.99,
              currency: 'BYN',
              format: '###,###,###,###,##0.##'
            },
            description: 'Карта №1',
            icon: {
              backgroundColorFrom: '#8976f3',
              backgroundColorTo: '#8976f3',
              captionColor: '#FFFFFF',
              displayType: 'REGULAR',
              frameColor: '#c2b7b7',
              iconUrl: 'v0/Image/52_392.SVG'
            },
            title: 'UBER'
          },
          sendReceipt: false,
          showAddRecipient: false,
          showAddToFuture: false,
          showCompensate: false,
          showReceipt: false,
          showRepeat: false,
          status: 'NORMAL'
        }
      ],
      maxAmount: 0,
      maxDate: '20190308180602',
      minAmount: -7.99,
      minDate: '20191113100349',
      totalItems: 1
    }),
    statusText: 'OK'
  }, { method: 'POST' })
}

function mockFetchAccountInfo () {
  fetchMock.once('https://insync2.alfa-bank.by/mBank256/v5/Account/Info', {
    status: 200,
    body: JSON.stringify({
      iban: 'BY31 ALFA 3014 111M RT00 1111 0000',
      info: {
        amount: {
          amount: 486.18,
          currency: 'BYN',
          format: '###,###,###,###,##0.##'
        },
        description: 'BY31 ALFA 3014 111M RT00 1111 0000',
        icon: {
          backgroundColorFrom: '#f9589e',
          backgroundColorTo: '#fe9199',
          captionColor: '#FFFFFF',
          displayType: 'REGULAR',
          frameColor: '#c2b7b7',
          iconUrl: 'v0/Image/49923_392.SVG',
          title: 'Карта №1'
        },
        title: 'Карта №1'
      },
      isClosable: false,
      isPayslipAvailable: false,
      objectId: '3014111MFE0011110',
      onDesktop: true,
      startDate: '20171111000000'
    }),
    statusText: 'OK'
  }, { method: 'POST' })
}

function mockFetchAccounts () {
  fetchMock.once('https://insync2.alfa-bank.by/mBank256/v5/Desktop', {
    status: 200,
    body: JSON.stringify({
      shortcuts: [
        {
          arbitraryTransfer: true,
          hasHistory: true,
          icon: {
            backgroundColorFrom: '#f9589e',
            backgroundColorTo: '#fe9199',
            captionColor: '#FFFFFF',
            displayType: 'REGULAR',
            frameColor: '#c2b7b7',
            iconUrl: 'v0/Image/49923_392.SVG',
            title: 'Карта №1'
          },
          id: '6505111',
          objectId: '3014111MFE0011110',
          objectType: 'ACCOUNT',
          operations: [{ id: '6505111', operation: 'OWNACCOUNTSTRANSFER' }],
          tagBalance: 486.18,
          type: 'ACCOUNT'
        }]
    }),
    statusText: 'OK'
  }, { method: 'POST' })
}

function mockAuthConfirm () {
  fetchMock.once('https://insync2.alfa-bank.by/mBank256/v5/AuthorizationConfirm?locale=ru', {
    status: 200,
    body: JSON.stringify({
      'status': 'OK',
      'sessionId': '111cad2f-cb81-1111-111b-53f98c1fede0',
      'token': '111cad2fcb811111111b53f981112223'
    }),
    statusText: 'OK'
  }, { method: 'POST' })
}

function mockAuthWithPassportID () {
  fetchMock.once('https://insync2.alfa-bank.by/mBank256/v5/Authorization?locale=ru', {
    status: 200,
    body: JSON.stringify({
      'status': 'OK'
    }),
    statusText: 'OK'
  }, { method: 'POST' })
}

function mockCheckDeviceStatus () {
  fetchMock.once('https://insync2.alfa-bank.by/mBank256/v5/CheckDeviceStatus?locale=ru', {
    status: 200,
    body: JSON.stringify({
      'status': 'NO_DEVICE'
    }),
    statusText: 'OK'
  }, { method: 'POST' })
}

function mockZenmoney () {
  global.ZenMoney = {
    ...makePluginDataApi({
      'deviceID': '123404df-f99a-4826-1234-a3fb7e5a1234'
    }).methods
  }
  ZenMoney.readLine = async () => 'test(readLine)'
}
