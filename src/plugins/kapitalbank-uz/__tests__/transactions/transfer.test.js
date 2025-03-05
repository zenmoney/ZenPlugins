import {
  convertCardOrAccountTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        group: {
          title: 'Переводы',
          type: 'P2P'
        },
        module: 'P2P',
        transactionDate: '2025-02-25 03:10:17.+0000',
        transactionGuid: '5c0ea9bc-0000-0000-0000-eb5d0560bcfa',
        transactionType: 'DEBIT',
        status: 'SUCCESS',
        name: 'IVAN IVANOV',
        amount: 17050,
        currency: {
          name: 'USD',
          scale: 2
        }
      },
      {
        date: new Date('2025-02-25 03:10:17Z'),
        hold: false,
        comment: 'Исходящий перевод',
        merchant: {
          fullTitle: 'IVAN IVANOV',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '5c0ea9bc-0000-0000-0000-eb5d0560bcfa',
            account: { id: 'card' },
            invoice: null,
            sum: -170.50,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to card UZS', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertCardOrAccountTransaction(card, rawTransaction)).toEqual(transaction)
  })
})
