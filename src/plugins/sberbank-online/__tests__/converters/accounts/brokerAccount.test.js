import { convertBrokerAccount } from '../../../converters'

describe('convertBrokerAccounts', () => {
  it.each([
    [
      {
        'id': 'S004ZXS',
        'total': {
          'value': 71839.63, 'currency': { 'code': 'RUB', 'name': '' }
        },
        'forecastTotal': { 'value': 71756.45, 'currency': { 'code': 'RUB', 'name': '' } },
        'markets': [
          {
            'marketType': 0,
            'marketName': 'Фондовый',
            'total': { 'value': 71839.63, 'currency': { 'code': 'RUB', 'name': '' } },
            'forecastTotal': { 'value': 71756.45, 'currency': { 'code': 'RUB', 'name': '' } }
          }
        ]
      },
      {
        products: [
          {
            id: 'S004ZXS',
            type: 'iis',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'iis:S004ZXS',
          type: 'investment',
          title: 'Брокерский счёт S004ZXS',
          instrument: 'RUB',
          syncID: [
            '83484852908883'
          ],
          balance: 71839.63
        }
      }
    ],
    [
      {
        'id': '4004ZXS',
        'total': { 'value': 0.00, 'currency': { 'code': 'RUB', 'name': '' } },
        'forecastTotal': { 'value': 0.00, 'currency': { 'code': 'RUB', 'name': '' } },
        'markets': [
          {
            'marketType': 0,
            'marketName': 'Фондовый',
            'total': { 'value': 0.00, 'currency': { 'code': 'RUB', 'name': '' } },
            'forecastTotal': { 'value': 0.00, 'currency': { 'code': 'RUB', 'name': '' } }
          },
          {
            'marketType': 2,
            'marketName': 'Внебиржевой',
            'total': { 'value': 0.00, 'currency': { 'code': 'RUB', 'name': '' } },
            'forecastTotal': { 'value': 0.00, 'currency': { 'code': 'RUB', 'name': '' } }
          }
        ]
      },
      {
        products: [
          {
            id: '4004ZXS',
            type: 'iis',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'iis:4004ZXS',
          type: 'investment',
          title: 'Брокерский счёт 4004ZXS',
          instrument: 'RUB',
          syncID: [
            '52484852908883'
          ],
          balance: 0
        }
      }
    ]
  ])('converts broker account', (apiAccount, account) => {
    expect(convertBrokerAccount(apiAccount)).toEqual(account)
  })
})
