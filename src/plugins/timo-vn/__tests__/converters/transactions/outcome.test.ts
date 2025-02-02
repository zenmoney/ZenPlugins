import { convertTransaction } from '../../../converters'
import { Account } from '../../../../../types/zenmoney'

describe('convertTransaction', () => {
  it.each([
    [
      {
        txnType: 'OutgoingTransfer',
        txnTime: '02/11/2024 16:27:00',
        txnAmount: -450000,
        timoDesc2: 'Sent from my Timo'
      },
      { id: '9021808997832', instrument: 'VND' },
      {
        hold: true,
        date: new Date('2024-11-02T16:27:00.000Z'),
        movements: [
          {
            id: null,
            account: { id: '9021808997832' },
            invoice: null,
            sum: -450000,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Sent from my Timo',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account as Account)).toEqual(transaction)
  })
})
