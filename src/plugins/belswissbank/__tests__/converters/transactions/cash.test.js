import { convertApiTransactionsToReadableTransactions } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      [
        {
          account: {
            id: 'account',
            instrument: 'USD'
          },
          apiTransactions: [
            {
              cardTransactionId: 94484897,
              docId: 3134341,
              openwayId: 59774541,
              transactionDate: 1637050320000,
              transactionType: 'Пополнение счета наличными (по паспорту)',
              transactionCategory: 'Request',
              transactionResult: 'Успешно',
              transactionAmount: 270,
              transactionCurrency: 'USD',
              transactionDetails: '257.00 USD',
              city: '',
              countryCode: '',
              accountRest: null,
              accountCurrency: '',
              accountRestDate: 1637050320000,
              colour: 1,
              last4: '0731, NIKOLAY NIKOLAEV'
            }
          ]
        }
      ],
      [
        {
          comment: 'Пополнение счета наличными (по паспорту)',
          date: new Date('2021-11-16T08:12:00.000Z'),
          hold: null,
          merchant: {
            city: null,
            country: null,
            location: null,
            mcc: null,
            title: '257.00 USD'
          },
          movements: [
            {
              id: null,
              account: {
                type: 'cash',
                instrument: 'USD',
                syncIds: null,
                company: null
              },
              invoice: null,
              sum: -270,
              fee: 0
            },
            {
              account: {
                id: 'account'
              },
              fee: 0,
              id: '94484897',
              invoice: null,
              sum: 270
            }
          ]
        }
      ]
    ],
    [
      [
        {
          account: {
            id: 'account',
            instrument: 'EUR'
          },
          apiTransactions: [
            {
              cardTransactionId: 100534077,
              docId: 4030206,
              openwayId: 65823708,
              transactionDate: 1647342420000,
              transactionType: 'Пополнение счета наличными',
              transactionCategory: 'Request',
              transactionResult: 'Успешно',
              transactionAmount: 5540,
              transactionCurrency: 'EUR',
              transactionDetails: '5534.00 EUR',
              city: '',
              countryCode: '',
              accountRest: null,
              accountCurrency: '',
              accountRestDate: 1647342420000,
              colour: 1,
              last4: '<string[24]>'
            }
          ]
        }
      ],
      [
        {
          comment: 'Пополнение счета наличными',
          date: new Date('2022-03-15T11:07:00.000Z'),
          hold: null,
          merchant: {
            city: null,
            country: null,
            location: null,
            mcc: null,
            title: '5534.00 EUR'
          },
          movements: [
            {
              id: null,
              account: {
                type: 'cash',
                instrument: 'EUR',
                syncIds: null,
                company: null
              },
              invoice: null,
              sum: -5540,
              fee: 0
            },
            {
              account: {
                id: 'account'
              },
              fee: 0,
              id: '100534077',
              invoice: null,
              sum: 5540
            }
          ]
        }
      ]
    ]
  ])('converts cash deposit', (apiTransactionsByAccount, transaction) => {
    expect(convertApiTransactionsToReadableTransactions(apiTransactionsByAccount)).toEqual(transaction)
  })
})
