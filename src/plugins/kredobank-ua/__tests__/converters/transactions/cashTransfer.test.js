import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '201016_113001_101830982480',
        externalId: '101830982480',
        destination: {
          accountNumber: '26205011376033',
          name: 'Николаев Николай Николаевич',
          currency: 'UAH'
        },
        amountInCents: 400000,
        currency: 'UAH',
        localAmountInCents: 400000,
        operationDate: 1602837001000,
        finalizationDate: 1602896054000,
        description: ' MONO011\\\\KYIV\\',
        cardId: '3632841'
      },
      {
        comment: ' MONO011\\\\KYIV\\',
        date: new Date('2020-10-16T08:30:01.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '201016_113001_101830982480',
            invoice: null,
            sum: 4000
          },
          {
            account: {
              company: null,
              instrument: 'UAH',
              syncIds: null,
              type: 'cash'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -4000
          }
        ]
      }
    ]
  ])('convert cash transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337', instrument: 'UAH', syncIds: ['26205011376033'] })).toEqual(transaction)
  })
})
