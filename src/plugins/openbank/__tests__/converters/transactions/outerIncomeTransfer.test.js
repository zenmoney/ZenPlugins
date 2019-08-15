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
          }
        ],
        merchant: null,
        comment: 'OPEN.RU CARD2CARD'
      }
    ]
  ])('converts outer income transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
