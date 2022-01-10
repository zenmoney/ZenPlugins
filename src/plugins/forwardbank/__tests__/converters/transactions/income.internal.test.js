import { dateInTimezone } from '../../../../../common/dateUtils'
import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        Id: 'Ib__0000000000000',
        Index: null,
        Date: '2022-01-08T00:00:00',
        Name: 'З рахунку UA000000000000000000000000001',
        AccountAmount: 100,
        AccountCurrencyCode: 'UAH',
        Amount: 100,
        CurrencyCode: 'UAH',
        Merchant: {
          Id: null,
          Name: 'З рахунку UA000000000000000000000000001',
          City: null,
          Country: null,
          Street: null
        },
        Mark: 'Credit',
        CurrencyRate: '1',
        Fee: 0,
        AvailableBalance: null,
        Status: 'Pending',
        StatusMessage: null,
        InternalId: '00000000000',
        IsReceiptAvailable: false,
        TransactionIconUrl: null,
        CategoryIconUrl: '/cards/operations/logo?name=credit_operation.png',
        CategoryName: 'Поповнення картки'
      },
      {
        id: 'UA000000000000000000000000002'
      },
      {
        hold: true,
        date: dateInTimezone(new Date('2022-01-08T00:00:00'), -120),
        movements: [
          {
            id: 'Ib__0000000000000',
            account: {
              id: 'UA000000000000000000000000002'
            },
            invoice: null,
            sum: 1,
            fee: 0
          },
          {
            id: null,
            account: {
              id: 'UA000000000000000000000000001'
            },
            invoice: null,
            sum: -1,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Поповнення картки. З рахунку UA000000000000000000000000001'
      }
    ]
  ])('converts income internal', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
