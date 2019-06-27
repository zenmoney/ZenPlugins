import { convertTransaction } from '../../../converters'
import * as data from './_data'

describe('convertTransaction', () => {
  it('converts cash withdrawal', () => {
    expect(convertTransaction(data.cashWithdrawalApiTransaction))
      .toEqual({
        hold: false,
        date: new Date(Date.parse('2018-11-12T13:27:47.237Z')),
        comment: 'SICH BANK PAT UKR (1458.60 UAH)',
        merchant: null,
        movements: [
          {
            account: { id: '1234xxxxxxxx5678' },
            fee: -2.6,
            id: '111111111',
            invoice: {
              instrument: 'UAH',
              sum: -1458.6
            },
            sum: -53.62,
            _type: null
          },
          {
            account: {
              type: 'cash',
              instrument: 'UAH',
              syncIds: null,
              company: null
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 1458.6
          }
        ]
      })
  })
})
