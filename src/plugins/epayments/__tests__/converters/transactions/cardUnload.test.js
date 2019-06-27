import { convertTransactions } from '../../../converters'
import * as data from './_data'

describe('convertTransactions', () => {
  it('converts card unload transactions', () => {
    expect(convertTransactions(data.cardUnloadApiTransactions)).toEqual([
      {
        hold: false,
        date: new Date(Date.parse('2019-06-27T08:26:45.64Z')),
        merchant: null,
        comment: 'Unload (10.00 USD)',
        movements: [{
          id: '444444444',
          account: { id: '1234xxxxxxxx5678' },
          sum: -10.0,
          fee: 0,
          invoice: null,
          _type: 'unload'
        }]
      },
      {
        hold: false,
        date: new Date(Date.parse('2019-06-27T08:26:40.83Z')),
        merchant: null,
        comment: 'Card unload from ePayments Card',
        movements: [{
          id: '555555555',
          account: { id: '000-123456-USD' },
          sum: 10.0,
          fee: 0,
          invoice: null,
          _type: 'unload'
        }]
      }
    ])
  })
})
