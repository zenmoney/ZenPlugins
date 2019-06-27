import { convertTransactions } from '../../../converters'
import * as data from './_data'

describe('convertTransactions', () => {
  it('converts card load transactions', () => {
    expect(convertTransactions(data.cardLoadApiTransactions)).toEqual([
      {
        hold: false,
        date: new Date(Date.parse('2018-02-10T00:04:26.403Z')),
        merchant: null,
        comment: 'Load (50.00 USD)',
        movements: [{
          id: '222222222',
          account: { id: '1234xxxxxxxx5678' },
          sum: 50.0,
          fee: 0,
          invoice: null,
          _type: 'load'
        }]
      },
      {
        hold: false,
        date: new Date(Date.parse('2018-02-10T00:04:24.367Z')),
        merchant: null,
        comment: 'Card load to ePayments Card',
        movements: [{
          id: '333333333',
          account: { id: '000-123456-USD' },
          sum: -50.0,
          fee: 0,
          invoice: null,
          _type: 'load'
        }]
      }
    ])
  })
})
