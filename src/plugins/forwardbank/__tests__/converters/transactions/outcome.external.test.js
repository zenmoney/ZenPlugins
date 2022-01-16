import { dateInTimezone } from '../../../../../common/dateUtils'
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        Id: 'Ib__11111111111111111',
        Index: null,
        Date: '2021-01-01T10:05:34',
        Name: 'На картку 000000******0000',
        AccountAmount: 20000,
        AccountCurrencyCode: 'UAH',
        Amount: 20000,
        CurrencyCode: 'UAH',
        Merchant: {
          Id: null,
          Name: 'На картку 000000******0000',
          City: null,
          Country: null,
          Street: null
        },
        Mark: 'Debet',
        CurrencyRate: '1',
        Fee: 0,
        AvailableBalance: 100000000,
        Status: 'Success',
        StatusMessage: 'Переказ грошових коштів.',
        InternalId: '1111111111',
        IsReceiptAvailable: true,
        TransactionIconUrl: '/cards/operations/logo?name=mccless_5.png',
        CategoryIconUrl: '/cards/operations/logo?name=mccless_5.png',
        CategoryName: 'Переказ коштів'
      },
      {
        id: 'UA000000000000000000000000001'
      },
      {
        hold: false,
        date: dateInTimezone(new Date('2021-01-01T10:05:34'), -120),
        movements: [
          {
            id: 'Ib__11111111111111111',
            account: {
              id: 'UA000000000000000000000000001'
            },
            invoice: null,
            sum: -200,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'UAH',
              company: null,
              syncIds: [
                '000000******0000'
              ]
            },
            invoice: null,
            sum: 200,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts income internal', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
