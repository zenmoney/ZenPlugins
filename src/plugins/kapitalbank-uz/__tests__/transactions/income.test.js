import {
  convertCardOrAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        group: {
          title: 'Остальное',
          type: 'OTHER'
        },
        module: 'PROCESSING',
        transactionDate: '2025-02-25 18:02:04.+0000',
        transactionGuid: 'HUMO-f8aa2d32-0000-0000-0000-40222a0a2659',
        transactionType: 'CREDIT',
        status: 'SUCCESS',
        name: 'YANGIBANK ON VKLAD SPISANIE',
        amount: 12280685,
        currency: {
          name: 'UZS',
          scale: 2
        }
      },
      {
        date: new Date('2025-02-25 18:02:04Z'),
        hold: false,
        comment: null,
        merchant: {
          fullTitle: 'YANGIBANK ON VKLAD SPISANIE',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: 'HUMO-f8aa2d32-0000-0000-0000-40222a0a2659',
            account: { id: 'card' },
            invoice: null,
            sum: 122806.85,
            fee: 0
          }
        ]
      }
    ]
  ])('converts income UZS', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertCardOrAccountTransaction(card, rawTransaction)).toEqual(transaction)
  })
})
