import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        cardSum: -19000,
        cardCommissionSum: 0,
        cardCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        mcc: '6011',
        mccImageSrc: '/res/i/mcc/86756E529A721BD97EBFDF497F2C7AF7.png',
        valueDate: '2019-10-02T00:00:00Z',
        transactionDate: '2019-10-02T10:54:01Z',
        ground: '520373..6823 Выдача RUS Moscow 00100120 Promsvyazbank 263798',
        transactionSum: -19000,
        transactionCurrency: { currencyId: 1, name: 'Российский рубль', nameIso: 'RUR' },
        isProcessed: true
      },
      {
        hold: false,
        date: new Date('2019-10-02T10:54:01Z'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -19000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 19000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
