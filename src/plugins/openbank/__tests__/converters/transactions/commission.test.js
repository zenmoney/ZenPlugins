import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        'transDate': '2019-06-26T14:00:00.000+0300',
        'authDate': '2019-06-26T00:00:00.000+0300',
        'authAmount': { 'amount': -500.00, 'currency': 'RUR' },
        'transAmount': { 'amount': -500.00, 'currency': 'RUR' },
        'status': { 'code': 'PROCESSED', 'value': 'Проведена' },
        'place': ' Комиссия за ведение СКС и осуществления расчетов по карте',
        'category': { 'code': 'OTHER', 'value': 'Другое' },
        'operationType': { 'code': 'ACC', 'value': 'Перевод между счетами' },
        'cardId': '8388244',
        'categoryIconUrl': 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        'id': '6029472865/6029477543/12',
        'digitalSign': false
      },
      {
        hold: false,
        date: new Date('2019-06-26T00:00:00.000+0300'),
        movements: [
          {
            id: '6029472865/6029477543/12',
            account: { id: 'account' },
            invoice: null,
            sum: -500,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Комиссия за ведение СКС и осуществления расчетов по карте'
      }
    ],
    [
      {
        transDate: '2019-08-11T14:00:00.000+0300',
        authDate: '2019-08-11T00:00:00.000+0300',
        authAmount: { amount: -13285.95, currency: 'RUR' },
        transAmount: { amount: -13285.95, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        place: ' Неустойка за превышение платежного лимита',
        category: { code: 'OTHER', value: 'Другое' },
        operationType: { code: 'KOM', value: 'Комиссия' },
        cardId: '8628798',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/commission.png',
        id: '6264373329/6264376369/8',
        digitalSign: false
      },
      {
        hold: false,
        date: new Date('2019-08-11T00:00:00.000+03:00'),
        movements: [
          {
            id: '6264373329/6264376369/8',
            account: { id: 'account' },
            invoice: null,
            sum: -13285.95,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Неустойка за превышение платежного лимита'
      }
    ]
  ])('converts commission', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
