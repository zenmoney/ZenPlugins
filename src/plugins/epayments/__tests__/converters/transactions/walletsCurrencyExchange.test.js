import { convertTransactions } from '../../../converters'
import * as data from './_data'

describe('convertTransactions', () => {
  it('converts currency exchange  between wallets transactions', () => {
    expect(convertTransactions(data.walletsCurrencyExchangeApiTrnsactions)).toEqual([
      {
        hold: false,
        date: new Date(Date.parse('2019-06-27T08:02:45.373Z')),
        merchant: null,
        comment: 'Currency exchange from USD to EUR. Rate = 0.8568',
        movements: [{
          id: '666666666',
          account: { id: '000-123456-EUR' },
          sum: 4.28,
          fee: 0,
          invoice: null,
          _type: 'exchange'
        }]
      },
      {
        hold: false,
        date: new Date(Date.parse('2019-06-27T08:02:45.373Z')),
        merchant: null,
        comment: 'Currency exchange from USD to EUR. Rate = 0.8568',
        movements: [{
          id: '777777777',
          account: { id: '000-123456-USD' },
          sum: -5.0,
          fee: 0,
          invoice: null,
          _type: 'exchange'
        }]
      }
    ])
  })
})
