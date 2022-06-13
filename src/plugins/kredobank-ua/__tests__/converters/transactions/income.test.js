import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '220412_190658_102452575257',
        externalId: '102452575257',
        destination:
          {
            accountNumber: '26202011343133',
            name: 'Николай Николаевич Николаев',
            currency: 'UAH'
          },
        amountInCents: 14958295,
        currency: 'UAH',
        localAmountInCents: 14958295,
        operationDate: 1649779618000,
        finalizationDate: 1649809507000,
        description: 'KREDOBANK',
        cardId: '4125309'
      },
      {
        id: '4321',
        instrument: 'UAH',
        syncIds: ['26202011343133', '5168********1234']
      },
      {
        comment: null,
        date: new Date('2022-04-12T16:06:58.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'KREDOBANK',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '4321' },
            fee: 0,
            id: '220412_190658_102452575257',
            invoice: null,
            sum: 149582.95
          }
        ]
      }
    ]
  ])('convert income transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
