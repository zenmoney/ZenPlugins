import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        'authDate': '2019-08-13T20:56:31.000+0300',
        'authAmount': { 'amount': -350.00, 'currency': 'RUR' },
        'transAmount': { 'amount': -350.00, 'currency': 'RUR' },
        'status': { 'code': 'ACCEPTED', 'value': 'В обработке' },
        'authCode': '546666',
        'place': '"MODERN PAYMENT STANDA',
        'category': { 'code': 'PAYMENTS', 'value': 'Платежи' },
        'operationType': { 'code': 'Retail', 'value': 'Оплата товаров' },
        'cardId': '8388244',
        'categoryIconUrl': 'https://ib.open.ru/webbank/image/transaction-category-icons/payments.png',
        'id': '363668851',
        'digitalSign': false,
        'mccCode': '4900'
      },
      {
        hold: true,
        date: new Date('2019-08-13T20:56:31.000+03:00'),
        movements: [
          {
            id: '363668851',
            account: { id: 'account' },
            invoice: null,
            sum: -350,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: '"MODERN PAYMENT STANDA',
          mcc: 4900,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        'transDate': '2019-08-14T14:00:00.000+0300',
        'authDate': '2019-08-11T19:12:05.000+0300',
        'authAmount': { 'amount': -435.94, 'currency': 'RUR' },
        'transAmount': { 'amount': -435.94, 'currency': 'RUR' },
        'status': { 'code': 'PROCESSED', 'value': 'Проведена' },
        'authCode': '546663',
        'place': 'ALTYN KUM',
        'category': { 'code': 'FOOD', 'value': 'Продукты' },
        'operationType': { 'code': 'POS', 'value': 'Оплата товаров' },
        'cardId': '8388244',
        'categoryIconUrl': 'https://ib.open.ru/webbank/image/transaction-category-icons/food.png',
        'id': '6279569308/6279810130/1',
        'digitalSign': false,
        'mccCode': '5411'
      },
      {
        hold: false,
        date: new Date('2019-08-11T19:12:05.000+03:00'),
        movements: [
          {
            id: '6279569308/6279810130/1',
            account: { id: 'account' },
            invoice: null,
            sum: -435.94,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'ALTYN KUM',
          mcc: 5411,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        authDate: '2019-11-09T18:32:24.000+0300',
        authAmount: { amount: 1570, currency: 'RUR' },
        transAmount: { amount: 1570, currency: 'RUR' },
        status: { code: 'ACCEPTED', value: 'В обработке' },
        place: 'Retail RUS SANKT-PETERBU MCDONALDS 21032',
        category: { code: 'RESTAURANTS_AND_CAFES', value: 'Рестораны и кафе' },
        operationType: { code: 'R1', value: 'Оплата товаров' },
        cardId: '8212749',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/restaurants_and_cafes.png',
        id: '',
        digitalSign: false,
        mccCode: '5814'
      },
      {
        hold: true,
        date: new Date('2019-11-09T18:32:24.000+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -1570,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'RUS SANKT-PETERBU MCDONALDS 21032',
          mcc: 5814,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
