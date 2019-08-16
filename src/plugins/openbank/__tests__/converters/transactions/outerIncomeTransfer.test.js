import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        'transDate': '2019-06-30T14:00:00.000+0300',
        'authDate': '2019-06-30T17:42:25.000+0300',
        'authAmount': { 'amount': 48285.00, 'currency': 'RUR' },
        'transAmount': { 'amount': 48285.00, 'currency': 'RUR' },
        'status': { 'code': 'PROCESSED', 'value': 'Проведена' },
        'authCode': '546626',
        'place': 'OPEN.RU CARD2CARD',
        'category': { 'code': 'OTHER', 'value': 'Другое' },
        'operationType': { 'code': 'P2P', 'value': 'Перевод P2P' },
        'cardId': '8388244',
        'categoryIconUrl': 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        'id': '6042440449/6042494321/1',
        'digitalSign': false,
        'mccCode': '6536'
      },
      {
        hold: false,
        date: new Date('2019-06-30T17:42:25.000+03:00'),
        movements: [
          {
            id: '6042440449/6042494321/1',
            account: { id: 'account' },
            invoice: null,
            sum: 48285,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -48285,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'OPEN.RU CARD2CARD'
      }
    ],
    [
      {
        transDate: '2019-08-11T14:00:00.000+0300',
        authDate: '2019-08-10T23:02:07.000+0300',
        authAmount: { amount: 150000, currency: 'RUR' },
        transAmount: { amount: 150000, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        place: 'Перевод СБП от Николай Николаевич Н 79111234567 — (номер операции A922220020294000rrLH9w7FC2AA1CC0) Без НДС.',
        category: { code: 'OTHER', value: 'Другое' },
        operationType: { code: 'ACC', value: 'Перевод между счетами' },
        cardId: '8628798',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        id: '6261575632/6261575634/1',
        digitalSign: false
      },
      {
        hold: false,
        date: new Date('2019-08-10T23:02:07.000+0300'),
        movements: [
          {
            id: '6261575632/6261575634/1',
            account: { id: 'account' },
            invoice: null,
            sum: 150000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUR',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -150000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Николай Николаевич Н',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
