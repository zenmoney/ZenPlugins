import { dateInTimezone } from '../../../../../common/dateUtils'
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        Id: 'Upc__1111111111111111',
        Index: null,
        Date: '2021-10-21T10:25:31',
        Name: 'Purchase',
        AccountAmount: 3500,
        AccountCurrencyCode: 'UAH',
        Amount: 3500,
        CurrencyCode: 'UAH',
        Merchant: {
          Id: 'ASHAN_014',
          Name: 'Ашан',
          City: 'KIYEV',
          Country: 'UKR',
          Street: null
        },
        Mark: 'Debet',
        CurrencyRate: '1',
        Fee: 0,
        AvailableBalance: 992952,
        Status: 'Success',
        StatusMessage: null,
        InternalId: null,
        IsReceiptAvailable: true,
        TransactionIconUrl: '/cards/operations/logo?name=auchan.png',
        CategoryIconUrl: '/cards/operations/logo?name=produkty_ta_supermerkety.png',
        CategoryName: 'Продукти та супермаркети'
      },
      {
        id: 'UA000000000000000000000000001'
      },
      {
        hold: false,
        date: dateInTimezone(new Date('2021-10-21T10:25:31'), -120),
        movements: [
          {
            id: 'Upc__1111111111111111',
            account: {
              id: 'UA000000000000000000000000001'
            },
            invoice: null,
            sum: -35,
            fee: 0
          }
        ],
        merchant: {
          country: 'UKR',
          city: 'KIYEV',
          location: null,
          title: 'Ашан',
          mcc: 5411
        },
        comment: 'Продукти та супермаркети'
      }
    ]
  ])('converts income internal', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
