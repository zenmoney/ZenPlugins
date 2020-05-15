import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        'cardNumber': '4469 **** **** 9999',
        'monthExp': 5,
        'yearExp': 2021,
        'cardStatus': 'Активирована',
        'clientId': 707777,
        'amount': 66666.66,
        'limit': 136000,
        'balance': 0
      },
      {
        id: 'CLIENT_ID_707777',
        type: 'ccard',
        title: 'Совесть',
        instrument: 'RUB',
        balance: -69333.34,
        creditLimit: 136000,
        syncID: [
          '9999'
        ]
      }
    ],
    [
      {
        'cardNumber': '4469 **** **** 9999',
        'monthExp': 5,
        'yearExp': 2021,
        'cardStatus': 'Активирована',
        'clientId': 707777,
        'amount': 137000,
        'limit': 136000,
        'balance': 1000
      },
      {
        id: 'CLIENT_ID_707777',
        type: 'ccard',
        title: 'Совесть',
        instrument: 'RUB',
        balance: 1000,
        creditLimit: 136000,
        syncID: [
          '9999'
        ]
      }
    ]
  ])('converts account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
