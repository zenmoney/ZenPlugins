import { convertApiTransactionsToReadableTransactions } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      [
        {
          account: {
            id: 'account',
            instrument: 'BYN'
          },
          apiTransactions: [
            {
              cardTransactionId: 100292434,
              docId: 3788563,
              openwayId: 65582065,
              transactionDate: 1646910420000,
              transactionType: 'Зачисление Money-back',
              transactionCategory: 'Request',
              transactionResult: 'Успешно',
              transactionAmount: 0.1,
              transactionCurrency: 'BYN',
              transactionDetails: '179.58 BYN',
              city: '',
              countryCode: '',
              accountRest: null,
              accountCurrency: '',
              accountRestDate: 1646910420000,
              colour: 1,
              last4: '1234, NIKOLAY NIKOLAEV'
            }
          ]
        }
      ],
      [],
      [
        {
          comment: 'Зачисление Money-back',
          date: new Date('2022-03-10T11:07:00.000Z'),
          hold: null,
          merchant: {
            city: null,
            country: null,
            location: null,
            mcc: null,
            title: '179.58 BYN'
          },
          movements: [
            {
              account: {
                id: 'account'
              },
              fee: 0,
              id: '100292434',
              invoice: null,
              sum: 0.1
            }
          ]
        }
      ]
    ]
  ])('converts income transaction', (apiTransactionsByAccount, paymentsArchive, transaction) => {
    expect(convertApiTransactionsToReadableTransactions(apiTransactionsByAccount, paymentsArchive)).toEqual(transaction)
  })
})
