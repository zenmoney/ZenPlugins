import { convertAccount } from '../../converters'

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
      'over': null,
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
      creditLimit: 0,
      syncID: [
        'BY36MTBK10110008000001111000',
        '1111'
      ]
    })
  })
})
