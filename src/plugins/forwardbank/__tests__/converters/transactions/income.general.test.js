import { dateInTimezone } from '../../../../../common/dateUtils'
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        Id: 'Upc__1111111111111111',
        Index: null,
        Date: '2021-11-12T12:30:21',
        Name: 'Зарахування кешбеку',
        AccountAmount: 9232,
        AccountCurrencyCode: 'UAH',
        Amount: 11468,
        CurrencyCode: 'UAH',
        Merchant: {
          Id: null,
          Name: null,
          City: null,
          Country: null,
          Street: null
        },
        Mark: 'Credit',
        CurrencyRate: '1',
        Fee: 0,
        AvailableBalance: 900000,
        Status: 'Success',
        StatusMessage: 'Зарахування кешбеку',
        InternalId: null,
        IsReceiptAvailable: false,
        TransactionIconUrl: null,
        CategoryIconUrl: '/cards/operations/logo?name=cashback.png',
        CategoryName: 'Cash back'
      },
      {
        id: 'UA000000000000000000000000002'
      },
      {
        hold: false,
        date: dateInTimezone(new Date('2021-11-12T12:30:21'), -120),
        movements: [
          {
            id: 'Upc__1111111111111111',
            account: {
              id: 'UA000000000000000000000000002'
            },
            invoice: null,
            sum: 92.32,
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
