import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        'authDate': '2019-08-16T00:00:00.000+0300',
        'digitalSign': false,
        'id': '3C:6287854222',
        'description': 'Перевод собств. ср-в с карты 5586********1162 (40817810380003427762 Николаев Н. Н.) на счёт 40817810000003459923 (Николаев Н. Н.). НДС не облагается.',
        'transAmount': { 'amount': 50000.00, 'currency': 'RUR' },
        'categoryIconUrl': 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        'category': { 'code': 'MONEY_TRANSFER', 'value': 'Перевод денег' },
        'status': { 'code': 'PROCESSED', 'value': 'Проведена' }
      },
      {
        hold: false,
        date: new Date('2019-08-16T00:00:00.000+03:00'),
        movements: [
          {
            id: '3C:6287854222',
            account: { id: 'account' },
            invoice: null,
            sum: 50000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2019-08-16_RUR_50000_7762_9923',
          '2019-08-16_RUR_50000'
        ]
      }
    ],
    [
      {
        transDate: '2019-08-15T14:00:00.000+0300',
        authDate: '2019-08-15T11:46:38.000+0300',
        authAmount: { amount: 34000, currency: 'RUR' },
        transAmount: { amount: 34000, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        place: 'Перевод собств. ср-в со счёта 40817810300003411003 (Николаев Н. Н.) на карту 4058********9101 (40817810980002674646 Николаев Н. Н.). НДС не облагается.',
        category: { code: 'OTHER', value: 'Другое' },
        operationType: { code: 'ACC', value: 'Перевод между счетами' },
        cardId: '8237711',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        id: '6281419367/6281419368/3',
        digitalSign: false
      },
      {
        hold: false,
        date: new Date('2019-08-15T11:46:38.000+03:00'),
        movements: [
          {
            id: '6281419367/6281419368/3',
            account: { id: 'account' },
            invoice: null,
            sum: 34000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2019-08-15_RUR_34000_1003_4646',
          '2019-08-15_RUR_34000'
        ]
      }
    ]
  ])('converts inner income transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
