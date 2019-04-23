import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  it('should return valid transaction', () => {
    expect(convertTransaction({
      hasStatement: true,
      isSuspicious: false,
      id: '1165931124',
      offers: [],
      status: 'OK',
      idSourceType: 'Online',
      type: 'Debit',
      locations: [
        {
          latitude: 59.9395237,
          longitude: 30.3120206
        }
      ],
      loyaltyBonus: [],
      cashbackAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 0
      },
      authMessage: 'Операция утверждена.',
      description: 'Перекресток',
      cashback: 0,
      brand: {
        name: 'Перекресток',
        baseTextColor: 'ffffff',
        logo: 'https://static.tinkoff.ru/brands/perekrestok.png',
        id: '4',
        roundedLogo: false,
        link: 'http://www.perekrestok.ru',
        baseColor: '005221',
        logoFile: 'perekrestok.png'
      },
      amount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      },
      operationTime: {
        milliseconds: 1555441116000
      },
      spendingCategory: {
        id: '25',
        name: 'Супермаркеты',
        icon: '10',
        parentId: '3'
      },
      isHce: false,
      mcc: 5411,
      category: {
        id: '10',
        name: 'Супермаркеты'
      },
      additionalInfo: [],
      virtualPaymentType: 0,
      account: '5000430875',
      ucid: '1022338546',
      merchant: {
        name: 'Перекресток',
        region: {
          country: 'RUS',
          city: 'SANKT-PETERBU'
        }
      },
      card: '2535796',
      loyaltyPayment: [],
      group: 'PAY',
      mccString: '5411',
      cardPresent: true,
      isExternalCard: false,
      cardNumber: '521324******6765',
      accountAmount: {
        currency: {
          code: 643,
          name: 'RUB',
          strCode: '643'
        },
        value: 1041.89
      }
    }, {})
    ).toEqual({
      'created': 1555441116000,
      'date': '2019-04-16',
      'hold': true,
      'id': 'tmp#1165931124',
      'income': 0,
      'incomeAccount': {},
      'latitude': 59.9395237,
      'longitude': 30.3120206,
      'mcc': 5411,
      'outcome': 1041.89,
      'outcomeAccount': {},
      'payee': 'Перекресток',
      'time': '21:59:36'
    })
  })
})
