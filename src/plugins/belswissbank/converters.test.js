import { convertApiTransactionsToReadableTransactions } from './converters'

describe('convertApiTransactionsToReadableTransactions', () => {
  it('converts outcome with payee and city', () => {
    expect(convertApiTransactionsToReadableTransactions([
      {
        account: {
          id: 'account',
          instrument: 'BYN'
        },
        apiTransactions: [
          {
            cardTransactionId: 55330580,
            docId: 1015956,
            openwayId: 20619597,
            transactionDate: 1554109440000,
            transactionType: 'Товары и услуги',
            transactionCategory: 'Request',
            transactionResult: 'Успешно',
            transactionAmount: 36.81,
            transactionCurrency: 'BYN',
            transactionDetails: 'SUPERMARKET "GREEN" BAPB',
            city: 'MINSK',
            countryCode: 'BLR',
            accountRest: 1582.67,
            accountCurrency: 'BYN',
            accountRestDate: 1554109440000,
            colour: 2,
            last4: '<string[22]>'
          }
        ]
      }
    ])).toEqual([
      {
        date: new Date('2019-04-01T09:04:00.000Z'),
        hold: null,
        movements: [
          {
            id: '55330580',
            account: { id: 'account' },
            invoice: null,
            sum: -36.81,
            fee: 0
          }
        ],
        merchant: {
          country: 'BLR',
          city: 'MINSK',
          title: 'SUPERMARKET "GREEN" BAPB',
          mcc: null,
          location: null
        },
        comment: '2019-04-01 12:04:00'
      }
    ])
  })
})
