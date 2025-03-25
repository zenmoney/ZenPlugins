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
        transactionDate: '2025-01-30 02:03:03.+0000',
        transactionGuid: 'VISA-702ce307-0000-0000-0000-8517b4c9c677',
        transactionType: 'DEBIT',
        status: 'SUCCESS',
        name: 'APPLE.COM/BILL',
        amount: 399,
        currency: {
          name: 'USD',
          scale: 2
        }
      },
      {
        date: new Date('2025-01-30T02:03:03.000Z'),
        hold: false,
        comment: null,
        merchant: {
          fullTitle: 'APPLE.COM/BILL',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: 'VISA-702ce307-0000-0000-0000-8517b4c9c677',
            account: { id: 'card' },
            invoice: null,
            sum: -3.99,
            fee: 0
          }
        ]
      }
    ]
  ])('converts outcome USD', (rawTransaction, transaction) => {
    const card = {
      id: 'card',
      instrument: 'USD'
    }
    expect(convertCardOrAccountTransaction(card, rawTransaction)).toEqual(transaction)
  })
})
