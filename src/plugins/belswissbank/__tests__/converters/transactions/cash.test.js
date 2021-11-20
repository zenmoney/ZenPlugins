import { formatCommentDateTime } from '../../../../../common/dateUtils'
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
          comment: formatCommentDateTime(new Date('2021-11-16T08:12:00.000Z')),
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
    ]
  ])('converts cash deposit', (apiTransactionsByAccount, transaction) => {
    expect(convertApiTransactionsToReadableTransactions(apiTransactionsByAccount)).toEqual(transaction)
  })
})
