import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '210426_113400_102042203453',
        externalId: '102042203453',
        source: {
          accountNumber: '26205011376033',
          name: 'Николаев Николай Николаевич',
          currency: 'UAH'
        },
        amountInCents: -366798,
        currency: 'UAH',
        localAmountInCents: -14672,
        operationDate: 1619426040000,
        finalizationDate: 1619650597000,
        description: 'PAY FORCE P2P',
        cardId: '3632841'
      },
      {
        comment: null,
        date: new Date('2021-04-26T08:34:00.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'PAY FORCE P2P',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '210426_113400_102042203453',
            invoice: null,
            sum: -146.72
          },
          {
            account: {
              company: null,
              instrument: 'UAH',
              syncIds: null,
              type: 'ccard'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 146.72
          }
        ]
      }
    ]
  ])('convert p2p transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337', instrument: 'UAH', syncIds: ['26205011376033'] })).toEqual(transaction)
  })
})
