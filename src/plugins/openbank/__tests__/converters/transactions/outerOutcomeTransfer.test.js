import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        transDate: '2019-08-15T14:00:00.000+0300',
        authDate: '2019-08-15T11:47:35.000+0300',
        authAmount: { amount: -34000, currency: 'RUR' },
        transAmount: { amount: -34000, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        place: 'Перевод по номеру телефона. Отправитель: Николаев Н. Получатель: Павлов П.',
        category: { code: 'MONEY_TRANSFER', value: 'Перевод денежных средств' },
        operationType: { code: 'ACC', value: 'Перевод между счетами' },
        merchantLogoUrl: 'https://ib.open.ru/webbank/image/merchant-logos/openbank.png',
        cardId: '8237711',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        id: '6281422227/6281422228/1',
        digitalSign: true,
        idDigital: 1548781638818
      },
      {
        hold: false,
        date: new Date('2019-08-15T11:47:35.000+03:00'),
        movements: [
          {
            id: '6281422227/6281422228/1',
            account: { id: 'account' },
            invoice: null,
            sum: -34000,
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
            sum: 34000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'Павлов П.',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        transDate: '2019-08-14T14:00:00.000+0300',
        authDate: '2019-08-14T17:47:43.000+0300',
        authAmount: { amount: -3500, currency: 'RUR' },
        transAmount: { amount: -3500, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        authCode: '862437',
        place: 'open.ru card2card',
        category: { code: 'OTHER', value: 'Другое' },
        operationType: { code: 'P2P', value: 'Перевод P2P' },
        cardId: '7532739',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        id: '6279569305/6280324568/1',
        digitalSign: false,
        mccCode: '6536'
      },
      {
        hold: false,
        date: new Date('2019-08-14T17:47:43.000+03:00'),
        movements: [
          {
            id: '6279569305/6280324568/1',
            account: { id: 'account' },
            invoice: null,
            sum: -3500,
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
            sum: 3500,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'open.ru card2card'
      }
    ],
    [
      {
        transDate: '2019-09-27T14:00:00.000+0300',
        authDate: '2019-09-27T13:32:04.000+0300',
        authAmount: { amount: 63000, currency: 'RUR' },
        transAmount: { amount: 63000, currency: 'RUR' },
        status: { code: 'PROCESSED', value: 'Проведена' },
        place: 'Перевод собственных средств, Без НДС',
        category: { code: 'OTHER', value: 'Другое' },
        operationType: { code: 'ACC', value: 'Перевод между счетами' },
        cardId: '8074304',
        categoryIconUrl: 'https://ib.open.ru/webbank/image/transaction-category-icons/money_transfer.png',
        id: '6532071528/6532071530/1',
        digitalSign: false
      },
      {
        hold: false,
        date: new Date('2019-09-27T13:32:04.000+0300'),
        movements: [
          {
            id: '6532071528/6532071530/1',
            account: { id: 'account' },
            invoice: null,
            sum: 63000,
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
            sum: -63000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод собственных средств, Без НДС'
      }
    ]
  ])('converts outer outcome transfer', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUR' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
