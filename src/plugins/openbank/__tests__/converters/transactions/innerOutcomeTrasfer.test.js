import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        'transDate': '2019-08-16T14:00:00.000+0300',
        'authDate': '2019-08-16T10:00:33.000+0300',
        'authAmount': { 'amount': -50000.00, 'currency': 'RUR' },
        'transAmount': { 'amount': -50000.00, 'currency': 'RUR' },
        'status': { 'code': 'PROCESSED', 'value': 'Проведена' },
        'place': 'Перевод собств. ср-в с карты 5586********6923 (40817810380003428888 Николаев Н. Н.) на счёт 40817810000003455345 (Николаев Н. Н.). НДС не облагается.',
        'category': { 'code': 'MONEY_TRANSFER', 'value': 'Перевод денежных средств' },
        'operationType': { 'code': 'ACC', 'value': 'Перевод между счетами' },
        'cardId': '8388244',
        'categoryIconUrl': 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        'id': '6287854222/6287854223/1',
        'digitalSign': true,
        'idDigital': 1548781816080
      },
      {
        hold: false,
        date: new Date('2019-08-16T10:00:33.000+03:00'),
        movements: [
          {
            id: '6287854222/6287854223/1',
            account: { id: 'account' },
            invoice: null,
            sum: -50000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2019-08-16_RUR_50000_8888_5345',
          '2019-08-16_RUR_50000'
        ]
      }
    ],
    [
      {
        transDate: '2019-08-09T14:00:00.000+0300',
        authDate: '2019-08-09T12:17:30.000+0300',
        authAmount: { amount: -4000, currency: 'RUR' },
        transAmount: { amount: -4000, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        authCode: '841471',
        place: 'Перечисление денежных средств для пополнения счета',
        category: { code: 'MONEY_TRANSFER', value: 'Перевод денежных средств' },
        operationType: { code: 'ACC', value: 'Перевод между счетами' },
        merchantLogoUrl: 'https://ib.open.ru/webbank/image/merchant-logos/sberbank.png',
        cardId: '3804612',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        id: '6256704432/6256704435/1',
        digitalSign: true,
        idDigital: 1548780832324
      },
      {
        hold: false,
        date: new Date('2019-08-09T12:17:30.000+03:00'),
        movements: [
          {
            id: '6256704432/6256704435/1',
            account: { id: 'account' },
            invoice: null,
            sum: -4000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          null,
          '2019-08-09_RUR_4000'
        ]
      }
    ],
    [
      {
        transDate: '2019-08-14T14:00:00.000+0300',
        authDate: '2019-08-14T15:03:56.000+0300',
        authAmount: { amount: -0.1, currency: 'A98' },
        transAmount: { amount: -321.01, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        place: 'Продажа металла клиенту. НДС не облагается.',
        category: { code: 'MONEY_TRANSFER', value: 'Перевод денежных средств' },
        operationType: { code: 'ACC', value: 'Перевод между счетами' },
        cardId: '8237711',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        id: '6277002911/6277002912/1',
        digitalSign: true,
        idDigital: 1548781511919
      },
      {
        hold: false,
        date: new Date('2019-08-14T15:03:56.000+03:00'),
        movements: [
          {
            id: '6277002911/6277002912/1',
            account: { id: 'account' },
            invoice: null,
            sum: -321.01,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          null,
          '2019-08-14_A98_0.1'
        ]
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
