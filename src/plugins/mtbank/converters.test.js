import { convertAccount, convertTransaction } from './converters'

describe('convertAccount', () => {
  it('should convert checking account', () => {
    const account = convertAccount({
      'productType': 'PC',
      'accountId': '1113333',
      'id': 1,
      'productCode': '1113333|PC',
      'show': true,
      'variationId': '[MASTERCARD][MCW INSTANT BYR 3Y (PAYOKAY)]',
      'accruedInterest': null,
      'avlBalance': '99.9',
      'avlLimit': null,
      'cardAccounts': [{
        'accType': null,
        'accountId': 'BY36MTBK10110008000001111000',
        'accountIdenType': 'PC',
        'availableBalance': null,
        'contractCode': '1113333',
        'currencyCode': 'BYN',
        'productType': 'PC'
      }],
      'cards': [{
        'blockReason': null,
        'cardCurr': 'BYN',
        'commisDate': '2019-01-31',
        'commisSum': '99.9',
        'description': 'MASTERCARD',
        'embossedName': 'IVAN IVANOV',
        'isOfAccntHolder': '1',
        'mainCard': '1',
        'over': '0',
        'pan': '999999_1111',
        'smsNotification': '1',
        'status': 'A',
        'term': '01/01',
        'type': 'MASTERCARD',
        'vpan': '1234567890123456',
        'rbs': '1234567',
        'pinPhoneNumber': '123456789012'
      }],
      'description': 'PayOkay',
      'debtPayment': null,
      'isActive': true,
      'isOverdraft': false,
      'rate': '0.0001'
    })

    expect(account).toEqual({
      id: '1113333',
      type: 'card',
      title: 'PayOkay',
      productType: 'PC',
      instrument: 'BYN',
      balance: 99.9,
      syncID: [
        'BY36MTBK10110008000001111000',
        '1111'
      ]
    })
  })
})

describe('convertTransaction', () => {
  const accounts = [{
    id: '1113333',
    type: 'card',
    title: 'PayOkay',
    productType: 'PC',
    instrument: 'BYN',
    balance: 99.9,
    syncID: [
      'BY36MTBK10110008000001111000',
      '1111'
    ]
  }]

  it('should convert hold foreign currency transaction', () => {
    const transaction = convertTransaction({
      'amount': '40.11',
      'balance': '153.99',
      'cardPan': '111111******1111',
      'curr': 'EUR',
      'debitFlag': '0',
      'description': 'Оплата товаров и услуг',
      'error': '',
      'operationDate': '2019-02-18',
      'orderStatus': '1',
      'place': 'PAYPAL',
      'status': 'T',
      'transAmount': '97.91',
      'transDate': '2019-02-14 00:00:00',
      'accountId': 'BY36MTBK10110008000001111000'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14 00:00:00'),
      income: 0,
      incomeAccount: '1113333',
      outcome: 97.91,
      outcomeAccount: '1113333',
      opOutcome: 40.11,
      opOutcomeInstrument: 'EUR',
      payee: 'PAYPAL'
    })
  })

  it('should convert regular transaction', () => {
    const transaction = convertTransaction({
      'amount': '7.87',
      'balance': '99.99',
      'cardPan': '111111******1111',
      'curr': 'BYN',
      'debitFlag': '0',
      'description': 'Оплата товаров и услуг',
      'error': '',
      'operationDate': '2019-03-25',
      'orderStatus': '1',
      'place': 'RBO RUP \'LIDO\'            / MINSK         / BY',
      'status': 'T',
      'transAmount': '7.87',
      'transDate': '2019-03-21 15:01:03',
      'accountId': 'BY36MTBK10110008000001111000'
    }, accounts)

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-03-21 15:01:03'),
      income: 0,
      incomeAccount: '1113333',
      outcome: 7.87,
      outcomeAccount: '1113333',
      payee: 'RBO RUP \'LIDO\'            / MINSK         / BY'
    })
  })
})
