import { convertAccount, convertTransaction } from './converters'

describe('convertAccount', () => {
  it('should convert credit card account', () => {
    const account = convertAccount({
      'id': 'B7C94FAC',
      'currency': {
        'shortName': 'RUB',
        'symbol': 'руб',
        'rate': 1
      },
      'product': 'Mastercard Credit World Premium',
      'cba': '40817810301003402816',
      'pan': '5536********1038',
      'moneyAmount': {
        'value': 145600.24
      },
      'accountBalance': {
        'value': 45600.24
      }
    })

    expect(account).toEqual({
      id: 'B7C94FAC',
      type: 'card',
      title: 'Mastercard Credit World Premium',
      instrument: 'RUB',
      balance: 45600.24,
      creditLimit: 100000,
      syncID: [
        '1038',
        '2816'
      ]
    })
  })

  it('should convert checking account', () => {
    const account = convertAccount({
      'id': '4480910C',
      'currency': {
        'shortName': 'USD',
        'symbol': '$',
        'rate': 54.60
      },
      'cba': '40817840401000898597',
      'moneyAmount': {
        'value': 2432.19
      },
      'accountBalance': {
        'value': 2432.19
      }
    })

    expect(account).toEqual({
      id: '4480910C',
      title: '*8597',
      type: 'card',
      instrument: 'USD',
      balance: 2432.19,
      creditLimit: 0,
      syncID: [
        '8597'
      ]
    })
  })
})

describe('convertTransaction', () => {
  it('should convert hold foreign currency transaction', () => {
    const transaction = convertTransaction({
      'type': 'HOLD',
      'operationTime': '2018-01-05 09:10:34 GMT+3',
      'relation': 'CARD',
      'relationId': 'B7C94FAC',
      'amount': {
        'value': -3,
        'currency': {
          'shortName': 'USD',
          'symbol': '$'
        }
      },
      'accountAmount': {
        'value': -164.10,
        'currency': {
          'shortName': 'RUB',
          'symbol': 'руб'
        }
      }
    })

    expect(transaction).toEqual({
      hold: true,
      date: new Date('2018-01-05T06:10:34.000Z'),
      income: 0,
      incomeAccount: 'B7C94FAC',
      outcome: 164.10,
      outcomeAccount: 'B7C94FAC',
      opOutcome: 3,
      opOutcomeInstrument: 'USD'
    })
  })

  it('should convert regular transaction', () => {
    const transaction = convertTransaction({
      'id': '7876123',
      'type': 'TRANSACTION',
      'operationTime': '2018-01-04 18:44:12 GMT+3',
      'debitingTime': '2018-01-07 12:21:07 GMT+3',
      'relation': 'ACCOUNT',
      'relationId': '4480910C',
      'amount': {
        'value': -50,
        'currency': {
          'shortName': 'USD',
          'symbol': '$'
        }
      },
      'accountAmount': {
        'value': -50,
        'currency': {
          'shortName': 'USD',
          'symbol': '$'
        }
      }
    })

    expect(transaction).toEqual({
      id: '7876123',
      hold: false,
      date: new Date('2018-01-04T15:44:12.000Z'),
      income: 0,
      incomeAccount: '4480910C',
      outcome: 50,
      outcomeAccount: '4480910C'
    })
  })
})
